# Database Backup Automation Guide

## Overview

This guide covers three approaches to automate database backups before `terraform destroy`:

1. **Wrapper Script** (Simplest, Recommended for now)
2. **S3 Automated Backups** (Production-grade)
3. **EBS Snapshots** (AWS-native)

---

## Approach 1: Safe Destroy Wrapper Script ✅ **Recommended**

### Setup

1. Make the scripts executable:
```bash
chmod +x scripts/backup-databases.sh
chmod +x terraform/terraform-destroy-safe.sh
```

### Usage

**Instead of `terraform destroy`, use:**
```bash
cd terraform
./terraform-destroy-safe.sh
```

**What it does:**
1. ✅ Retrieves current infrastructure IPs from Terraform state
2. ✅ Creates timestamped backup directory
3. ✅ Backs up PostgreSQL to `database-backups/YYYYMMDD-HHMMSS/postgresql_tribetalk.sql`
4. ✅ Backs up MongoDB to `database-backups/YYYYMMDD-HHMMSS/mongodb_tribetalknosqldb.archive`
5. ✅ Creates metadata file with backup info
6. ✅ Asks for confirmation before destroying
7. ✅ Runs `terraform destroy`

**Restore from backup:**
```bash
# PostgreSQL
PGPASSWORD=admin123 psql -h <new-host> -U admin tribetalk < database-backups/20251219-120000/postgresql_tribetalk.sql

# MongoDB
mongorestore --archive=database-backups/20251219-120000/mongodb_tribetalknosqldb.archive \
  -u admin -p admin123 --authenticationDatabase admin
```

---

## Approach 2: S3 Automated Backups (Production) 🏆 **Best for Production**

### Setup

1. **Apply S3 backup infrastructure:**
```bash
cd terraform
terraform apply  # This creates the S3 bucket
```

2. **Install backup script on database instances:**
```bash
# Copy script to instances via bastion
scp -i ~/.ssh/k8-SecurityKey.pem scripts/backup-to-s3.sh ubuntu@<bastion-ip>:~/
ssh -i ~/.ssh/k8-SecurityKey.pem ubuntu@<bastion-ip>

# From bastion, copy to database instances
scp -i ~/.ssh/k8-SecurityKey.pem backup-to-s3.sh ubuntu@10.0.10.59:/tmp/
scp -i ~/.ssh/k8-SecurityKey.pem backup-to-s3.sh ubuntu@10.0.10.124:/tmp/

# Install on PostgreSQL instance
ssh -i ~/.ssh/k8-SecurityKey.pem ubuntu@10.0.10.59
sudo mv /tmp/backup-to-s3.sh /opt/scripts/backup-to-s3.sh
sudo chmod +x /opt/scripts/backup-to-s3.sh

# Add to crontab (daily at 2 AM)
echo "0 2 * * * /opt/scripts/backup-to-s3.sh >> /var/log/backup.log 2>&1" | sudo crontab -
```

3. **Before destroy, trigger manual backup:**
```bash
# SSH to each database instance and run
sudo /opt/scripts/backup-to-s3.sh
```

4. **Download backups from S3:**
```bash
aws s3 sync s3://tribetalk-database-backups-430006376054/ ./s3-backups/
```

### Benefits
- ✅ Automatic daily backups
- ✅ 30-day retention policy
- ✅ Versioning enabled
- ✅ Backups survive infrastructure destruction
- ✅ Can restore to any new infrastructure

---

## Approach 3: EBS Snapshots (AWS-Native)

### Manual Snapshots Before Destroy

```bash
# Get volume IDs
PGVOL=$(aws ec2 describe-volumes \
  --filters "Name=tag:Service,Values=postgresql" \
  --query 'Volumes[0].VolumeId' --output text)

MONGOVOL=$(aws ec2 describe-volumes \
  --filters "Name=tag:Service,Values=mongodb" \
  --query 'Volumes[0].VolumeId' --output text)

# Create snapshots
aws ec2 create-snapshot \
  --volume-id $PGVOL \
  --description "PostgreSQL backup before destroy $(date +%Y-%m-%d)" \
  --tag-specifications 'ResourceType=snapshot,Tags=[{Key=Name,Value=postgresql-backup},{Key=Database,Value=tribetalk}]'

aws ec2 create-snapshot \
  --volume-id $MONGOVOL \
  --description "MongoDB backup before destroy $(date +%Y-%m-%d)" \
  --tag-specifications 'ResourceType=snapshot,Tags=[{Key=Name,Value=mongodb-backup},{Key=Database,Value=tribetalknosqldb}]'

# Wait for snapshots to complete
aws ec2 wait snapshot-completed --snapshot-ids <snapshot-id>
```

### Automated with Terraform Lifecycle

Add to `ec2-infrastructure.tf`:

```hcl
resource "aws_instance" "postgresql" {
  # ... existing config ...
  
  root_block_device {
    volume_size           = 30
    volume_type           = "gp3"
    delete_on_termination = false  # Keep volume after instance termination
  }
}
```

**Note:** With `delete_on_termination = false`, volumes persist after destroy but you'll be charged ~$3/month per volume.

---

## Comparison

| Approach | Pros | Cons | Cost | Best For |
|----------|------|------|------|----------|
| **Wrapper Script** | Simple, no infrastructure changes | Manual process | Free | Development |
| **S3 Backups** | Automated, versioned, durable | Requires setup | ~$0.50/month | Production |
| **EBS Snapshots** | AWS-native, point-in-time | Costs add up | ~$0.05/GB/month | Disaster recovery |

---

## Recommended Setup

### For Development (Current)
Use the **wrapper script**:
```bash
./terraform/terraform-destroy-safe.sh
```

### For Production
1. Set up **S3 automated backups** with daily cron jobs
2. Enable **EBS snapshots** with `delete_on_termination = false`
3. Use **wrapper script** for additional safety

---

## Current Status

✅ **Scripts created:**
- `scripts/backup-databases.sh` - Manual backup script
- `terraform/terraform-destroy-safe.sh` - Safe destroy wrapper
- `scripts/backup-to-s3.sh` - S3 automated backup
- `terraform/s3-backups.tf` - S3 infrastructure

**To use right now:**
```bash
cd terraform
chmod +x terraform-destroy-safe.sh
./terraform-destroy-safe.sh
```

This will automatically back up your databases before destroying!
