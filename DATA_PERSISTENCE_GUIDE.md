# Data Persistence Strategy for TribeTalk

This guide explains how to persist data when shutting down infrastructure and restore it when bringing it back up.

---

## 🎯 Current Data Storage Locations

### Data on EC2 Database Instance
- **PostgreSQL**: `/var/lib/postgresql/15/main/`
- **MongoDB**: `/var/lib/mongodb/`
- **Redis**: `/var/lib/redis/`
- **Kafka**: `/var/kafka-logs/`

### Data in Kubernetes
- **Application logs**: Ephemeral (lost on pod restart)
- **Uploaded media**: Currently ephemeral (should use S3)

---

## 📦 Option 1: EBS Volume Snapshots (Recommended for EC2)

### Current Setup
Your EC2 database instance has an EBS volume that stores all database data.

### Before Shutdown: Create Snapshot

```bash
# Get the EC2 instance ID
INSTANCE_ID=$(aws ec2 describe-instances \
  --filters "Name=tag:Name,Values=tribetalk-database-server" \
  --query "Reservations[0].Instances[0].InstanceId" \
  --output text \
  --region eu-north-1)

# Get the volume ID
VOLUME_ID=$(aws ec2 describe-volumes \
  --filters "Name=attachment.instance-id,Values=${INSTANCE_ID}" \
  --query "Volumes[0].VolumeId" \
  --output text \
  --region eu-north-1)

# Create snapshot
SNAPSHOT_ID=$(aws ec2 create-snapshot \
  --volume-id ${VOLUME_ID} \
  --description "TribeTalk database backup $(date +%Y-%m-%d)" \
  --tag-specifications "ResourceType=snapshot,Tags=[{Key=Name,Value=tribetalk-db-backup},{Key=Date,Value=$(date +%Y-%m-%d)}]" \
  --region eu-north-1 \
  --query "SnapshotId" \
  --output text)

echo "Snapshot created: ${SNAPSHOT_ID}"

# Wait for snapshot to complete
aws ec2 wait snapshot-completed --snapshot-ids ${SNAPSHOT_ID} --region eu-north-1
echo "Snapshot completed!"
```

### After Shutdown: Restore from Snapshot

**Option A: Restore to existing instance**
```bash
# Stop the instance
aws ec2 stop-instances --instance-ids ${INSTANCE_ID} --region eu-north-1
aws ec2 wait instance-stopped --instance-ids ${INSTANCE_ID} --region eu-north-1

# Detach old volume
OLD_VOLUME_ID=$(aws ec2 describe-volumes \
  --filters "Name=attachment.instance-id,Values=${INSTANCE_ID}" \
  --query "Volumes[0].VolumeId" \
  --output text \
  --region eu-north-1)

aws ec2 detach-volume --volume-id ${OLD_VOLUME_ID} --region eu-north-1

# Create new volume from snapshot
NEW_VOLUME_ID=$(aws ec2 create-volume \
  --snapshot-id ${SNAPSHOT_ID} \
  --availability-zone eu-north-1a \
  --volume-type gp3 \
  --tag-specifications "ResourceType=volume,Tags=[{Key=Name,Value=tribetalk-db-restored}]" \
  --region eu-north-1 \
  --query "VolumeId" \
  --output text)

# Wait for volume to be available
aws ec2 wait volume-available --volume-ids ${NEW_VOLUME_ID} --region eu-north-1

# Attach new volume
aws ec2 attach-volume \
  --volume-id ${NEW_VOLUME_ID} \
  --instance-id ${INSTANCE_ID} \
  --device /dev/sdf \
  --region eu-north-1

# Start instance
aws ec2 start-instances --instance-ids ${INSTANCE_ID} --region eu-north-1
```

**Option B: Update Terraform to use snapshot**

Edit `terraform/ec2-infrastructure.tf`:

```hcl
# Add variable for snapshot ID
variable "database_snapshot_id" {
  description = "EBS snapshot ID to restore database from"
  type        = string
  default     = ""
}

# Update EBS volume resource
resource "aws_ebs_volume" "database_volume" {
  availability_zone = var.availability_zones[0]
  size              = 50
  type              = "gp3"
  
  # Restore from snapshot if provided
  snapshot_id = var.database_snapshot_id != "" ? var.database_snapshot_id : null
  
  tags = {
    Name = "${var.project_name}-database-volume"
  }
}
```

Then apply with snapshot:
```bash
terraform apply -var="database_snapshot_id=snap-xxxxx"
```

---

## 📤 Option 2: Database Dumps (Portable Backups)

### Before Shutdown: Export All Databases

```bash
# SSH into database instance
ssh -i ~/.ssh/your-key.pem ubuntu@<DATABASE_PUBLIC_IP>

# Create backup directory
mkdir -p ~/backups/$(date +%Y-%m-%d)
cd ~/backups/$(date +%Y-%m-%d)

# 1. PostgreSQL Dump
sudo -u postgres pg_dump tribetalk > tribetalk_postgres_$(date +%Y%m%d_%H%M%S).sql
sudo -u postgres pg_dumpall > all_postgres_$(date +%Y%m%d_%H%M%S).sql

# 2. MongoDB Dump
mongodump --uri="mongodb://admin:admin123@localhost:27017/tribetalknosqldb?authSource=admin" \
  --out=mongodb_backup_$(date +%Y%m%d_%H%M%S)

# 3. Redis Dump (if persistence enabled)
sudo cp /var/lib/redis/dump.rdb redis_dump_$(date +%Y%m%d_%H%M%S).rdb

# 4. Kafka Topics Export (optional)
# Export topic configurations
kafka-topics.sh --bootstrap-server localhost:9092 --describe > kafka_topics_$(date +%Y%m%d_%H%M%S).txt

# Create tarball
tar -czf tribetalk_backup_$(date +%Y%m%d_%H%M%S).tar.gz .

# Exit SSH
exit

# Download backup to local machine
scp -i ~/.ssh/your-key.pem ubuntu@<DATABASE_PUBLIC_IP>:~/backups/$(date +%Y-%m-%d)/*.tar.gz ./backups/
```

### Upload Backups to S3 (Recommended)

```bash
# Create S3 bucket for backups
aws s3 mb s3://tribetalk-database-backups --region eu-north-1

# Enable versioning
aws s3api put-bucket-versioning \
  --bucket tribetalk-database-backups \
  --versioning-configuration Status=Enabled \
  --region eu-north-1

# Upload backup
aws s3 cp ~/backups/tribetalk_backup_*.tar.gz \
  s3://tribetalk-database-backups/$(date +%Y-%m-%d)/ \
  --region eu-north-1

# Enable lifecycle policy (optional - delete old backups after 30 days)
cat > lifecycle-policy.json <<EOF
{
  "Rules": [
    {
      "Id": "DeleteOldBackups",
      "Status": "Enabled",
      "Expiration": {
        "Days": 30
      }
    }
  ]
}
EOF

aws s3api put-bucket-lifecycle-configuration \
  --bucket tribetalk-database-backups \
  --lifecycle-configuration file://lifecycle-policy.json \
  --region eu-north-1
```

### After Shutdown: Restore from Dumps

```bash
# Download backup from S3
aws s3 cp s3://tribetalk-database-backups/2025-12-11/tribetalk_backup_*.tar.gz ./restore/ \
  --region eu-north-1

# Extract
cd restore
tar -xzf tribetalk_backup_*.tar.gz

# SSH into new database instance
ssh -i ~/.ssh/your-key.pem ubuntu@<NEW_DATABASE_IP>

# Upload backup
scp -i ~/.ssh/your-key.pem ./tribetalk_postgres_*.sql ubuntu@<NEW_DATABASE_IP>:~/
scp -i ~/.ssh/your-key.pem -r ./mongodb_backup_* ubuntu@<NEW_DATABASE_IP>:~/

# SSH in
ssh -i ~/.ssh/your-key.pem ubuntu@<NEW_DATABASE_IP>

# 1. Restore PostgreSQL
sudo -u postgres psql -c "DROP DATABASE IF EXISTS tribetalk;"
sudo -u postgres psql -c "CREATE DATABASE tribetalk;"
sudo -u postgres psql tribetalk < tribetalk_postgres_*.sql

# 2. Restore MongoDB
mongorestore --uri="mongodb://admin:admin123@localhost:27017/?authSource=admin" \
  --db tribetalknosqldb \
  mongodb_backup_*/tribetalknosqldb/

# 3. Restore Redis (if needed)
sudo systemctl stop redis
sudo cp redis_dump_*.rdb /var/lib/redis/dump.rdb
sudo chown redis:redis /var/lib/redis/dump.rdb
sudo systemctl start redis

# Verify data
sudo -u postgres psql tribetalk -c "SELECT COUNT(*) FROM users;"
mongosh mongodb://admin:admin123@localhost:27017/tribetalknosqldb?authSource=admin --eval "db.notifications.countDocuments()"
```

---

## 🗄️ Option 3: Migrate to AWS Managed Services (Production Recommended)

### Replace EC2 Databases with Managed Services

#### 3.1: Amazon RDS for PostgreSQL

**Add to Terraform:**

```hcl
# terraform/rds.tf
resource "aws_db_subnet_group" "tribetalk" {
  name       = "${var.project_name}-db-subnet-group"
  subnet_ids = aws_subnet.private[*].id

  tags = {
    Name = "${var.project_name}-db-subnet-group"
  }
}

resource "aws_db_instance" "postgresql" {
  identifier             = "${var.project_name}-postgres"
  engine                 = "postgres"
  engine_version         = "15.4"
  instance_class         = "db.t3.micro"
  allocated_storage      = 20
  storage_type           = "gp3"
  storage_encrypted      = true
  
  db_name  = "tribetalk"
  username = "admin"
  password = var.db_password  # Use AWS Secrets Manager
  
  db_subnet_group_name   = aws_db_subnet_group.tribetalk.name
  vpc_security_group_ids = [aws_security_group.database.id]
  
  backup_retention_period = 7  # 7 days of automated backups
  backup_window          = "03:00-04:00"
  maintenance_window     = "Mon:04:00-Mon:05:00"
  
  skip_final_snapshot    = false
  final_snapshot_identifier = "${var.project_name}-final-snapshot"
  
  enabled_cloudwatch_logs_exports = ["postgresql", "upgrade"]
  
  tags = {
    Name = "${var.project_name}-postgresql"
  }
}

output "rds_endpoint" {
  value = aws_db_instance.postgresql.endpoint
}
```

**Benefits:**
- ✅ Automated daily backups (7-35 days retention)
- ✅ Point-in-time recovery
- ✅ Automated patching
- ✅ Multi-AZ for high availability
- ✅ Read replicas for scaling

#### 3.2: Amazon DocumentDB for MongoDB

```hcl
# terraform/documentdb.tf
resource "aws_docdb_subnet_group" "tribetalk" {
  name       = "${var.project_name}-docdb-subnet-group"
  subnet_ids = aws_subnet.private[*].id
}

resource "aws_docdb_cluster" "tribetalk" {
  cluster_identifier      = "${var.project_name}-docdb"
  engine                  = "docdb"
  master_username         = "admin"
  master_password         = var.docdb_password
  backup_retention_period = 7
  preferred_backup_window = "03:00-04:00"
  skip_final_snapshot     = false
  final_snapshot_identifier = "${var.project_name}-docdb-final"
  
  db_subnet_group_name   = aws_docdb_subnet_group.tribetalk.name
  vpc_security_group_ids = [aws_security_group.database.id]
  
  enabled_cloudwatch_logs_exports = ["audit", "profiler"]
}

resource "aws_docdb_cluster_instance" "tribetalk" {
  count              = 1
  identifier         = "${var.project_name}-docdb-instance-${count.index}"
  cluster_identifier = aws_docdb_cluster.tribetalk.id
  instance_class     = "db.t3.medium"
}

output "documentdb_endpoint" {
  value = aws_docdb_cluster.tribetalk.endpoint
}
```

#### 3.3: Amazon ElastiCache for Redis

```hcl
# terraform/elasticache.tf
resource "aws_elasticache_subnet_group" "tribetalk" {
  name       = "${var.project_name}-redis-subnet-group"
  subnet_ids = aws_subnet.private[*].id
}

resource "aws_elasticache_replication_group" "tribetalk" {
  replication_group_id       = "${var.project_name}-redis"
  replication_group_description = "TribeTalk Redis cluster"
  
  engine               = "redis"
  engine_version       = "7.0"
  node_type            = "cache.t3.micro"
  num_cache_clusters   = 2  # Primary + 1 replica
  
  subnet_group_name    = aws_elasticache_subnet_group.tribetalk.name
  security_group_ids   = [aws_security_group.database.id]
  
  automatic_failover_enabled = true
  snapshot_retention_limit   = 5
  snapshot_window           = "03:00-05:00"
  
  at_rest_encryption_enabled = true
  transit_encryption_enabled = true
}

output "redis_endpoint" {
  value = aws_elasticache_replication_group.tribetalk.primary_endpoint_address
}
```

#### 3.4: Amazon MSK for Kafka

```hcl
# terraform/msk.tf
resource "aws_msk_cluster" "tribetalk" {
  cluster_name           = "${var.project_name}-kafka"
  kafka_version          = "3.5.1"
  number_of_broker_nodes = 2
  
  broker_node_group_info {
    instance_type   = "kafka.t3.small"
    client_subnets  = aws_subnet.private[*].id
    security_groups = [aws_security_group.database.id]
    
    storage_info {
      ebs_storage_info {
        volume_size = 100
      }
    }
  }
  
  encryption_info {
    encryption_in_transit {
      client_broker = "TLS"
      in_cluster    = true
    }
  }
  
  logging_info {
    broker_logs {
      cloudwatch_logs {
        enabled   = true
        log_group = aws_cloudwatch_log_group.msk.name
      }
    }
  }
}

output "msk_bootstrap_brokers" {
  value = aws_msk_cluster.tribetalk.bootstrap_brokers_tls
}
```

---

## 🔄 Automated Backup Script

Create a backup script that runs daily:

```bash
#!/bin/bash
# backup-databases.sh

set -e

BACKUP_DIR="/home/ubuntu/backups"
DATE=$(date +%Y-%m-%d)
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
S3_BUCKET="tribetalk-database-backups"

mkdir -p ${BACKUP_DIR}/${DATE}
cd ${BACKUP_DIR}/${DATE}

echo "Starting backup at $(date)"

# PostgreSQL
echo "Backing up PostgreSQL..."
sudo -u postgres pg_dump tribetalk | gzip > tribetalk_postgres_${TIMESTAMP}.sql.gz

# MongoDB
echo "Backing up MongoDB..."
mongodump --uri="mongodb://admin:admin123@localhost:27017/tribetalknosqldb?authSource=admin" \
  --gzip --archive=tribetalk_mongodb_${TIMESTAMP}.archive

# Redis
echo "Backing up Redis..."
sudo cp /var/lib/redis/dump.rdb redis_dump_${TIMESTAMP}.rdb

# Create tarball
echo "Creating archive..."
tar -czf tribetalk_backup_${TIMESTAMP}.tar.gz *.gz *.archive *.rdb

# Upload to S3
echo "Uploading to S3..."
aws s3 cp tribetalk_backup_${TIMESTAMP}.tar.gz \
  s3://${S3_BUCKET}/${DATE}/ \
  --region eu-north-1

# Cleanup local backups older than 7 days
echo "Cleaning up old local backups..."
find ${BACKUP_DIR} -type d -mtime +7 -exec rm -rf {} +

echo "Backup completed at $(date)"
```

**Setup cron job:**
```bash
# Run daily at 2 AM
crontab -e

# Add this line:
0 2 * * * /home/ubuntu/backup-databases.sh >> /var/log/database-backup.log 2>&1
```

---

## 📋 Backup & Restore Checklist

### Before Shutdown

- [ ] Create EBS snapshot of database volume
- [ ] Export PostgreSQL database (`pg_dump`)
- [ ] Export MongoDB database (`mongodump`)
- [ ] Backup Redis data (`dump.rdb`)
- [ ] Upload all backups to S3
- [ ] Verify backup files are complete
- [ ] Document snapshot IDs and S3 paths
- [ ] Export Kubernetes secrets (if needed)

### After Bringing Up Infrastructure

- [ ] Restore EBS volume from snapshot, OR
- [ ] Restore databases from dumps
- [ ] Verify data integrity
- [ ] Update connection strings in secrets
- [ ] Redeploy applications
- [ ] Test application functionality

---

## 🎯 Recommended Strategy by Environment

### Development
- **Method**: Database dumps to S3
- **Frequency**: Weekly
- **Retention**: 30 days

### Staging
- **Method**: EBS snapshots + database dumps
- **Frequency**: Daily
- **Retention**: 7 days

### Production
- **Method**: AWS Managed Services (RDS, DocumentDB, ElastiCache, MSK)
- **Frequency**: Automated continuous backups
- **Retention**: 7-35 days
- **Additional**: Cross-region replication

---

## 💰 Cost Comparison

### Current Setup (EC2)
- EC2 t3.medium: ~$30/month
- EBS 50GB: ~$5/month
- **Total: ~$35/month**
- **Backups**: S3 storage only (~$1/month)

### Managed Services
- RDS PostgreSQL (db.t3.micro): ~$15/month
- DocumentDB (db.t3.medium): ~$70/month
- ElastiCache Redis (cache.t3.micro): ~$15/month
- MSK (kafka.t3.small x2): ~$150/month
- **Total: ~$250/month**
- **Backups**: Included in service cost

**Trade-off**: Pay more for managed services, but get:
- Automated backups
- High availability
- Automated patching
- Better performance
- Less operational overhead

---

## 🚨 Important Notes

1. **Always test restores** - Backups are useless if you can't restore
2. **Automate backups** - Manual backups will be forgotten
3. **Store backups off-site** - Use S3 or cross-region replication
4. **Encrypt backups** - Use S3 encryption or encrypted EBS snapshots
5. **Document procedures** - Keep restore instructions updated
6. **Monitor backup jobs** - Set up CloudWatch alarms for failures

---

## 📚 Additional Resources

- [AWS Backup Service](https://aws.amazon.com/backup/) - Centralized backup management
- [PostgreSQL Backup Best Practices](https://www.postgresql.org/docs/current/backup.html)
- [MongoDB Backup Methods](https://www.mongodb.com/docs/manual/core/backups/)
- [Redis Persistence](https://redis.io/docs/management/persistence/)
