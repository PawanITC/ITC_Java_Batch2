#!/bin/bash
# Automated database backup script
# This runs before Terraform destroys database instances

set -e

BACKUP_DIR="./database-backups/$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BACKUP_DIR"

echo "=== Starting automated database backup ==="
echo "Backup directory: $BACKUP_DIR"

# Get instance IPs from Terraform
POSTGRESQL_IP="$1"
MONGODB_IP="$2"
BASTION_IP="$3"

if [ -z "$POSTGRESQL_IP" ] || [ -z "$MONGODB_IP" ] || [ -z "$BASTION_IP" ]; then
    echo "Error: Missing IP addresses"
    echo "Usage: $0 <postgresql_ip> <mongodb_ip> <bastion_ip>"
    exit 1
fi

echo "PostgreSQL IP: $POSTGRESQL_IP"
echo "MongoDB IP: $MONGODB_IP"
echo "Bastion IP: $BASTION_IP"

# PostgreSQL Backup
echo ""
echo "=== Backing up PostgreSQL ==="
ssh -o StrictHostKeyChecking=no -i ~/.ssh/k8-SecurityKey.pem ubuntu@$BASTION_IP \
    "ssh -o StrictHostKeyChecking=no -i ~/.ssh/k8-SecurityKey.pem ubuntu@$POSTGRESQL_IP \
    'PGPASSWORD=admin123 pg_dump -h localhost -U admin tribetalk'" > "$BACKUP_DIR/postgresql_tribetalk.sql"

if [ -f "$BACKUP_DIR/postgresql_tribetalk.sql" ]; then
    PGSIZE=$(du -h "$BACKUP_DIR/postgresql_tribetalk.sql" | cut -f1)
    echo "✓ PostgreSQL backup completed: $PGSIZE"
else
    echo "✗ PostgreSQL backup failed!"
fi

# MongoDB Backup
echo ""
echo "=== Backing up MongoDB ==="
ssh -o StrictHostKeyChecking=no -i ~/.ssh/k8-SecurityKey.pem ubuntu@$BASTION_IP \
    "ssh -o StrictHostKeyChecking=no -i ~/.ssh/k8-SecurityKey.pem ubuntu@$MONGODB_IP \
    'mongodump -u admin -p admin123 --authenticationDatabase admin -d tribetalknosqldb --archive'" > "$BACKUP_DIR/mongodb_tribetalknosqldb.archive"

if [ -f "$BACKUP_DIR/mongodb_tribetalknosqldb.archive" ]; then
    MONGOSIZE=$(du -h "$BACKUP_DIR/mongodb_tribetalknosqldb.archive" | cut -f1)
    echo "✓ MongoDB backup completed: $MONGOSIZE"
else
    echo "✗ MongoDB backup failed!"
fi

# Create metadata file
cat > "$BACKUP_DIR/backup_metadata.txt" << EOF
Backup Date: $(date)
PostgreSQL IP: $POSTGRESQL_IP
MongoDB IP: $MONGODB_IP
Bastion IP: $BASTION_IP
PostgreSQL Database: tribetalk
MongoDB Database: tribetalknosqldb
EOF

echo ""
echo "=== Backup Summary ==="
ls -lh "$BACKUP_DIR"
echo ""
echo "✓ All backups completed successfully!"
echo "Backup location: $BACKUP_DIR"
echo ""
echo "To restore:"
echo "  PostgreSQL: psql -h <host> -U admin tribetalk < $BACKUP_DIR/postgresql_tribetalk.sql"
echo "  MongoDB: mongorestore --archive=$BACKUP_DIR/mongodb_tribetalknosqldb.archive -u admin -p admin123 --authenticationDatabase admin"
