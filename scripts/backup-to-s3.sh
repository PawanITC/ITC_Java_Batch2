#!/bin/bash
# Automated S3 backup script to run via cron
# Add to crontab: 0 2 * * * /opt/scripts/backup-to-s3.sh

set -e

BACKUP_BUCKET="tribetalk-database-backups-430006376054"  # Update with your bucket name
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
HOSTNAME=$(hostname)

# PostgreSQL Backup
if systemctl is-active --quiet postgresql; then
    echo "Backing up PostgreSQL..."
    PGPASSWORD=admin123 pg_dump -h localhost -U admin tribetalk | gzip > /tmp/postgresql_${TIMESTAMP}.sql.gz
    aws s3 cp /tmp/postgresql_${TIMESTAMP}.sql.gz s3://${BACKUP_BUCKET}/postgresql/${HOSTNAME}/
    rm /tmp/postgresql_${TIMESTAMP}.sql.gz
    echo "PostgreSQL backup uploaded to S3"
fi

# MongoDB Backup
if systemctl is-active --quiet mongod; then
    echo "Backing up MongoDB..."
    mongodump -u admin -p admin123 --authenticationDatabase admin -d tribetalknosqldb --archive=/tmp/mongodb_${TIMESTAMP}.archive --gzip
    aws s3 cp /tmp/mongodb_${TIMESTAMP}.archive s3://${BACKUP_BUCKET}/mongodb/${HOSTNAME}/
    rm /tmp/mongodb_${TIMESTAMP}.archive
    echo "MongoDB backup uploaded to S3"
fi

echo "Backup completed: $TIMESTAMP"
