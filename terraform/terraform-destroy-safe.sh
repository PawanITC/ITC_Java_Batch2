#!/bin/bash
# Safe Terraform Destroy with Automatic Backups
# Usage: ./terraform-destroy-safe.sh

set -e

TERRAFORM_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$TERRAFORM_DIR"

echo "╔════════════════════════════════════════════════════════════╗"
echo "║     SAFE TERRAFORM DESTROY WITH AUTOMATIC BACKUPS          ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Get current infrastructure IPs
echo "📋 Getting current infrastructure details..."
POSTGRESQL_IP=$(terraform output -raw postgresql_private_ip 2>/dev/null || echo "")
MONGODB_IP=$(terraform output -raw mongodb_private_ip 2>/dev/null || echo "")
BASTION_IP=$(terraform output -raw bastion_public_ip 2>/dev/null || echo "")

if [ -z "$POSTGRESQL_IP" ] || [ -z "$MONGODB_IP" ] || [ -z "$BASTION_IP" ]; then
    echo "⚠️  Warning: Could not retrieve all IP addresses from Terraform state"
    echo "   PostgreSQL: ${POSTGRESQL_IP:-NOT FOUND}"
    echo "   MongoDB: ${MONGODB_IP:-NOT FOUND}"
    echo "   Bastion: ${BASTION_IP:-NOT FOUND}"
    echo ""
    read -p "Continue without backup? (yes/no): " CONTINUE
    if [ "$CONTINUE" != "yes" ]; then
        echo "❌ Destroy cancelled"
        exit 1
    fi
else
    echo "✓ PostgreSQL: $POSTGRESQL_IP"
    echo "✓ MongoDB: $MONGODB_IP"
    echo "✓ Bastion: $BASTION_IP"
    echo ""
    
    # Run backup
    echo "💾 Starting database backup..."
    if bash ../scripts/backup-databases.sh "$POSTGRESQL_IP" "$MONGODB_IP" "$BASTION_IP"; then
        echo "✓ Backup completed successfully!"
    else
        echo "⚠️  Backup failed!"
        read -p "Continue with destroy anyway? (yes/no): " CONTINUE
        if [ "$CONTINUE" != "yes" ]; then
            echo "❌ Destroy cancelled"
            exit 1
        fi
    fi
fi

echo ""
echo "⚠️  WARNING: This will destroy ALL infrastructure!"
echo "   - All EC2 instances (databases, bastion, monitoring, jenkins)"
echo "   - EKS cluster and all pods"
echo "   - VPC, subnets, and networking"
echo "   - Load balancers"
echo "   - All data will be permanently lost (unless backed up)"
echo ""
read -p "Type 'destroy' to confirm: " CONFIRM

if [ "$CONFIRM" != "destroy" ]; then
    echo "❌ Destroy cancelled"
    exit 1
fi

echo ""
echo "🔥 Running terraform destroy..."
terraform destroy

echo ""
echo "✓ Infrastructure destroyed"
echo ""
echo "📦 Backups are located in: ../database-backups/"
ls -lh ../database-backups/ 2>/dev/null || echo "No backups found"
