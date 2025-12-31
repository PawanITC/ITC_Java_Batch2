# AWS Secrets Manager Integration - Quick Reference

## Overview

All secrets are now stored in AWS Secrets Manager and automatically synced to Kubernetes using External Secrets Operator.

## Secrets Structure

### 1. Database Credentials
**Secret Name**: `tribetalk/database/credentials`

Contains:
- `postgres_username`
- `postgres_password`
- `postgres_url`
- `mongodb_username`
- `mongodb_password`
- `mongodb_uri`

### 2. Application Config
**Secret Name**: `tribetalk/app/config`

Contains:
- `jwt_secret`
- `github_client_id`
- `github_client_secret`
- `google_client_id`
- `google_client_secret`
- `redis_host`
- `kafka_bootstrap_servers`

## Quick Setup

```bash
# 1. Install External Secrets Operator
helm repo add external-secrets https://charts.external-secrets.io
helm install external-secrets external-secrets/external-secrets \
  -n external-secrets-system --create-namespace

# 2. Get IAM role ARN from Terraform
ROLE_ARN=$(cd terraform && terraform output -raw secrets_access_role_arn)

# 3. Update external-secrets.yaml
sed -i "s|<SECRETS_ACCESS_ROLE_ARN>|$ROLE_ARN|g" k8s/external-secrets.yaml

# 4. Apply External Secrets configuration
kubectl apply -f k8s/external-secrets.yaml

# 5. Verify secrets were created
kubectl get secrets
kubectl get externalsecrets
```

## Update Secrets

### Via AWS CLI
```bash
aws secretsmanager update-secret \
  --secret-id tribetalk/database/credentials \
  --secret-string '{"postgres_password":"new-password",...}'
```

### Via Terraform
```bash
# Update terraform.tfvars
vim terraform/terraform.tfvars

# Apply changes
cd terraform && terraform apply
```

## Security Features

✅ Centralized secret management
✅ Automatic rotation support
✅ Audit trail via CloudTrail
✅ Encryption at rest
✅ IAM-based access control
✅ No secrets in Git

## Cost

- $0.40 per secret per month
- $0.05 per 10,000 API calls
- **Total**: ~$1/month for 2 secrets

## Troubleshooting

```bash
# Check External Secrets Operator
kubectl logs -n external-secrets-system deployment/external-secrets

# Verify secret sync
kubectl describe externalsecret database-credentials

# Test IAM permissions
kubectl run -it --rm debug --image=amazon/aws-cli \
  --serviceaccount=tribetalk-sa -- \
  secretsmanager get-secret-value --secret-id tribetalk/database/credentials
```

For detailed documentation, see `infrastructure/SECRETS_MANAGER.md`
