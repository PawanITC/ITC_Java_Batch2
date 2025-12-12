# Data Persistence Strategy for TribeTalk

## Current State: ⚠️ DATA WILL BE LOST

**Problem**: Your databases (PostgreSQL, MongoDB, Redis) run on EC2 instances with **ephemeral storage**. When you run `terraform destroy` or stop instances, **all data is permanently lost**.

---

## Solution Options

### Option 1: EBS Volumes (Recommended for Current Setup) ✅

Attach persistent EBS volumes to database EC2 instances.

#### Implementation:

**Add to `terraform/ec2-infrastructure.tf`:**

```terraform
# EBS Volume for PostgreSQL
resource "aws_ebs_volume" "postgresql_data" {
  availability_zone = var.availability_zones[0]
  size              = 50  # GB
  type              = "gp3"  # General Purpose SSD
  encrypted         = true
  
  tags = {
    Name = "tribetalk-postgresql-data"
    Backup = "daily"
  }
}

resource "aws_volume_attachment" "postgresql_data" {
  device_name = "/dev/xvdf"
  volume_id   = aws_ebs_volume.postgresql_data.id
  instance_id = aws_instance.postgresql.id
  
  # Prevent volume deletion when instance is destroyed
  skip_destroy = true
}

# EBS Volume for MongoDB
resource "aws_ebs_volume" "mongodb_data" {
  availability_zone = var.availability_zones[0]
  size              = 50  # GB
  type              = "gp3"
  encrypted         = true
  
  tags = {
    Name = "tribetalk-mongodb-data"
    Backup = "daily"
  }
}

resource "aws_volume_attachment" "mongodb_data" {
  device_name = "/dev/xvdf"
  volume_id   = aws_ebs_volume.mongodb_data.id
  instance_id = aws_instance.mongodb.id
  skip_destroy = true
}

# EBS Snapshots for Backup
resource "aws_ebs_snapshot" "postgresql_backup" {
  volume_id = aws_ebs_volume.postgresql_data.id
  
  tags = {
    Name = "tribetalk-postgresql-backup"
  }
}
```

**Update Ansible to mount volumes:**

```yaml
# In ansible/roles/postgresql/tasks/main.yml
- name: Format EBS volume
  filesystem:
    fstype: ext4
    dev: /dev/xvdf
  when: ansible_devices.xvdf is defined

- name: Create PostgreSQL data directory
  file:
    path: /var/lib/postgresql/data
    state: directory
    owner: postgres
    group: postgres

- name: Mount EBS volume
  mount:
    path: /var/lib/postgresql/data
    src: /dev/xvdf
    fstype: ext4
    state: mounted
  when: ansible_devices.xvdf is defined
```

**Cost**: ~$5/month per 50GB volume

---

### Option 2: AWS RDS & DocumentDB (Best for Production) 🚀

Replace EC2 databases with managed services.

#### PostgreSQL → RDS

```terraform
resource "aws_db_instance" "postgresql" {
  identifier           = "tribetalk-postgres"
  engine              = "postgres"
  engine_version      = "16.1"
  instance_class      = "db.t3.micro"  # $15/month
  allocated_storage   = 20
  storage_encrypted   = true
  
  db_name  = "tribetalk"
  username = var.db_username
  password = var.db_password
  
  vpc_security_group_ids = [aws_security_group.postgresql.id]
  db_subnet_group_name   = aws_db_subnet_group.main.name
  
  # Backup configuration
  backup_retention_period = 7  # Keep 7 days of backups
  backup_window          = "03:00-04:00"
  maintenance_window     = "mon:04:00-mon:05:00"
  
  # Prevent accidental deletion
  deletion_protection = true
  skip_final_snapshot = false
  final_snapshot_identifier = "tribetalk-postgres-final-snapshot"
  
  tags = {
    Name = "tribetalk-postgresql"
  }
}

resource "aws_db_subnet_group" "main" {
  name       = "tribetalk-db-subnet"
  subnet_ids = aws_subnet.private[*].id
}
```

#### MongoDB → DocumentDB

```terraform
resource "aws_docdb_cluster" "mongodb" {
  cluster_identifier      = "tribetalk-docdb"
  engine                  = "docdb"
  master_username         = var.db_username
  master_password         = var.db_password
  backup_retention_period = 7
  preferred_backup_window = "03:00-04:00"
  skip_final_snapshot     = false
  
  vpc_security_group_ids = [aws_security_group.mongodb.id]
  db_subnet_group_name   = aws_docdb_subnet_group.main.name
  
  storage_encrypted = true
  
  tags = {
    Name = "tribetalk-mongodb"
  }
}

resource "aws_docdb_cluster_instance" "mongodb" {
  identifier         = "tribetalk-docdb-instance"
  cluster_identifier = aws_docdb_cluster.mongodb.id
  instance_class     = "db.t3.medium"  # $70/month
}
```

#### Redis → ElastiCache

```terraform
resource "aws_elasticache_cluster" "redis" {
  cluster_id           = "tribetalk-redis"
  engine               = "redis"
  engine_version       = "7.0"
  node_type            = "cache.t3.micro"  # $15/month
  num_cache_nodes      = 1
  parameter_group_name = "default.redis7"
  port                 = 6379
  
  subnet_group_name    = aws_elasticache_subnet_group.main.name
  security_group_ids   = [aws_security_group.redis.id]
  
  # Backup
  snapshot_retention_limit = 5
  snapshot_window         = "03:00-05:00"
  
  tags = {
    Name = "tribetalk-redis"
  }
}
```

**Pros**:
- ✅ Automatic backups
- ✅ Point-in-time recovery
- ✅ Automatic failover
- ✅ Managed updates
- ✅ High availability

**Cons**:
- ❌ Higher cost (~$100/month vs $45/month)

---

### Option 3: Kubernetes Persistent Volumes (For Databases in K8s)

If you want to run databases IN Kubernetes (not recommended for production):

```yaml
# PostgreSQL with Persistent Volume
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: postgresql-pvc
spec:
  accessModes:
    - ReadWriteOnce
  storageClassName: gp3
  resources:
    requests:
      storage: 50Gi
---
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: postgresql
spec:
  serviceName: postgresql
  replicas: 1
  template:
    spec:
      containers:
      - name: postgresql
        image: postgres:16
        volumeMounts:
        - name: data
          mountPath: /var/lib/postgresql/data
  volumeClaimTemplates:
  - metadata:
      name: data
    spec:
      accessModes: [ "ReadWriteOnce" ]
      storageClassName: gp3
      resources:
        requests:
          storage: 50Gi
```

**Not recommended** because:
- Complex to manage
- No automatic backups
- Requires expertise
- Databases should be outside K8s

---

## Backup Strategies

### 1. Automated EBS Snapshots

```terraform
# Data Lifecycle Manager for automated snapshots
resource "aws_dlm_lifecycle_policy" "database_backup" {
  description        = "Daily database backups"
  execution_role_arn = aws_iam_role.dlm_lifecycle_role.arn
  state              = "ENABLED"

  policy_details {
    resource_types = ["VOLUME"]

    schedule {
      name = "Daily snapshots"

      create_rule {
        interval      = 24
        interval_unit = "HOURS"
        times         = ["03:00"]
      }

      retain_rule {
        count = 7  # Keep 7 days
      }

      tags_to_add = {
        SnapshotCreator = "DLM"
      }

      copy_tags = true
    }

    target_tags = {
      Backup = "daily"
    }
  }
}
```

### 2. Database Dumps to S3

```bash
#!/bin/bash
# backup-databases.sh

DATE=$(date +%Y%m%d_%H%M%S)
S3_BUCKET="tribetalk-backups"

# PostgreSQL backup
pg_dump -h $POSTGRES_IP -U admin tribetalk | \
  gzip > /tmp/postgres_$DATE.sql.gz
aws s3 cp /tmp/postgres_$DATE.sql.gz s3://$S3_BUCKET/postgres/

# MongoDB backup
mongodump --host $MONGODB_IP --username admin \
  --authenticationDatabase admin \
  --db tribetalknosqldb \
  --out /tmp/mongodb_$DATE
tar -czf /tmp/mongodb_$DATE.tar.gz /tmp/mongodb_$DATE
aws s3 cp /tmp/mongodb_$DATE.tar.gz s3://$S3_BUCKET/mongodb/

# Cleanup old backups (keep 30 days)
aws s3 ls s3://$S3_BUCKET/postgres/ | \
  awk '{print $4}' | \
  head -n -30 | \
  xargs -I {} aws s3 rm s3://$S3_BUCKET/postgres/{}
```

**Schedule with cron**:
```bash
# Run daily at 3 AM
0 3 * * * /opt/scripts/backup-databases.sh
```

### 3. AWS Backup Service

```terraform
resource "aws_backup_plan" "database_backup" {
  name = "tribetalk-database-backup"

  rule {
    rule_name         = "daily_backup"
    target_vault_name = aws_backup_vault.main.name
    schedule          = "cron(0 3 * * ? *)"  # 3 AM daily

    lifecycle {
      delete_after = 30  # Keep for 30 days
    }
  }
}

resource "aws_backup_vault" "main" {
  name = "tribetalk-backup-vault"
}

resource "aws_backup_selection" "database_volumes" {
  name         = "database-volumes"
  plan_id      = aws_backup_plan.database_backup.id
  iam_role_arn = aws_iam_role.backup.arn

  resources = [
    aws_ebs_volume.postgresql_data.arn,
    aws_ebs_volume.mongodb_data.arn,
  ]
}
```

---

## Disaster Recovery Plan

### Scenario 1: Accidental `terraform destroy`

**With EBS Volumes (skip_destroy = true)**:
1. Volumes survive destruction
2. Recreate infrastructure: `terraform apply`
3. Volumes automatically reattach
4. Data intact ✅

**Without persistent storage**:
1. All data lost ❌
2. Must restore from backups

### Scenario 2: EC2 Instance Failure

**With EBS Volumes**:
1. Detach volume from failed instance
2. Create new instance
3. Attach volume to new instance
4. Mount and restart database
5. Downtime: ~10 minutes

**With RDS/DocumentDB**:
1. Automatic failover to standby
2. Downtime: ~2 minutes

### Scenario 3: Region Failure

**Cross-Region Backup**:
```terraform
resource "aws_ebs_snapshot_copy" "postgresql_dr" {
  source_snapshot_id = aws_ebs_snapshot.postgresql_backup.id
  source_region      = "eu-north-1"
  destination_region = "eu-west-1"
  
  tags = {
    Name = "tribetalk-postgresql-dr"
  }
}
```

---

## Recommended Implementation for Your Setup

### Phase 1: Immediate (EBS Volumes)
1. Add EBS volumes to Terraform
2. Update Ansible to mount volumes
3. Set up automated snapshots
4. **Cost**: +$15/month

### Phase 2: Production (Managed Services)
1. Migrate to RDS for PostgreSQL
2. Migrate to DocumentDB for MongoDB
3. Migrate to ElastiCache for Redis
4. **Cost**: +$100/month (but worth it)

### Phase 3: Backup Strategy
1. Enable automated backups (7-day retention)
2. Set up S3 backup bucket
3. Schedule daily dumps to S3
4. Enable cross-region replication
5. **Cost**: +$5/month

---

## Cost Comparison

| Solution | Monthly Cost | Data Safety | Effort |
|----------|--------------|-------------|--------|
| **Current (No persistence)** | $0 | ❌ Data lost | None |
| **EBS Volumes** | +$15 | ✅ Survives destroy | Low |
| **EBS + Snapshots** | +$20 | ✅✅ Point-in-time | Medium |
| **RDS + DocumentDB + ElastiCache** | +$100 | ✅✅✅ Fully managed | Low |
| **Full DR Setup** | +$120 | ✅✅✅✅ Region failover | High |

---

## Quick Start: Add EBS Persistence Now

```bash
# 1. Add EBS volumes to terraform/ec2-infrastructure.tf
# (code provided above)

# 2. Apply Terraform
cd terraform
terraform apply

# 3. Update Ansible playbooks to mount volumes
# (code provided above)

# 4. Run Ansible
cd ../ansible
ansible-playbook -i inventory/aws_ec2.yml playbooks/setup-infrastructure.yml

# 5. Verify
ssh bastion
df -h  # Should see /dev/xvdf mounted
```

---

## Testing Data Persistence

```bash
# 1. Insert test data
psql -h $POSTGRES_IP -U admin -d tribetalk
INSERT INTO users (username, email) VALUES ('test', 'test@example.com');

# 2. Destroy infrastructure
terraform destroy

# 3. Recreate infrastructure
terraform apply

# 4. Verify data still exists
psql -h $POSTGRES_IP -U admin -d tribetalk
SELECT * FROM users WHERE username = 'test';
# Should return the test user ✅
```

---

## Summary

**Current State**: ❌ Data lost on infrastructure destruction

**Recommended Solution**:
1. **Short-term**: Add EBS volumes (+$15/month)
2. **Long-term**: Migrate to RDS/DocumentDB (+$100/month)
3. **Always**: Implement backup strategy (+$5/month)

**Total Investment**: $120/month for production-grade data persistence

**ROI**: Priceless - your data is safe! 🎉
