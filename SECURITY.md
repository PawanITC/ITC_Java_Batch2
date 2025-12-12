# Security Notice

## ⚠️ Credential Management

This repository contains example configurations with placeholder credentials. **NEVER use these in production!**

### Files with Example Credentials

The following files contain `admin123` as an example password for **local development only**:

#### Application Configuration (Uses Environment Variables in Production)
- `tribetalk/src/main/resources/application.yml`
- `notification-service/src/main/resources/application.yaml`

These files use environment variable overrides:
```yaml
password: ${DB_PASSWORD:admin123}  # Uses DB_PASSWORD env var, falls back to admin123 for local dev
```

#### Ansible Roles (Configurable via Environment Variables)
- `ansible/roles/postgresql/tasks/main.yml`
- `ansible/roles/mongodb/tasks/main.yml`

These use:
```yaml
db_password: "{{ lookup('env', 'DB_PASSWORD') | default('admin123', true) }}"
```

#### Documentation Files (Examples Only)
- `DATABASE_ACCESS_GUIDE.md`
- `QUICK_DB_ACCESS.md`
- `DATA_PERSISTENCE_GUIDE.md`
- `DEPLOYMENT_GUIDE.md`
- `BASTION_HOST_GUIDE.md`
- `AWS_INFRASTRUCTURE_INVENTORY.md`

These are guides showing example commands. Replace with actual credentials when using.

---

## 🔒 Production Security Best Practices

### 1. Use AWS Secrets Manager

Store all credentials in AWS Secrets Manager:

```bash
aws secretsmanager create-secret \
    --name tribetalk/database/credentials \
    --secret-string '{
        "postgres_password":"<STRONG_RANDOM_PASSWORD>",
        "mongodb_password":"<STRONG_RANDOM_PASSWORD>"
    }'
```

### 2. Use Environment Variables

Set environment variables in Kubernetes deployments:

```yaml
env:
  - name: DB_PASSWORD
    valueFrom:
      secretKeyRef:
        name: tribetalk-database-secrets
        key: postgres_password
```

### 3. Rotate Credentials Regularly

- Change database passwords every 90 days
- Rotate JWT secrets periodically
- Update GitHub OAuth credentials if compromised

### 4. Never Commit Secrets to Git

Add to `.gitignore`:
```
*.env
*.pem
*.key
**/secrets/
terraform.tfstate*
.terraform/
```

### 5. Use IAM Roles for Service Accounts (IRSA)

For AWS resources, use IRSA instead of access keys:
- ✅ S3 access via IAM role
- ✅ Secrets Manager access via IAM role
- ❌ No hardcoded AWS credentials

---

## 🚨 If Credentials Are Exposed

If you accidentally commit credentials to Git:

1. **Immediately rotate the credentials**
   ```bash
   # Change database password
   ALTER USER admin WITH PASSWORD 'new_secure_password';
   
   # Update in Secrets Manager
   aws secretsmanager update-secret \
       --secret-id tribetalk/database/credentials \
       --secret-string '{"postgres_password":"new_secure_password"}'
   ```

2. **Remove from Git history**
   ```bash
   # Use BFG Repo-Cleaner or git-filter-repo
   git filter-repo --invert-paths --path application.yml
   ```

3. **Force push (if safe)**
   ```bash
   git push --force
   ```

---

## ✅ Current Production Setup

Our production deployment uses:
- ✅ AWS Secrets Manager for all credentials
- ✅ IAM Roles for Service Accounts (IRSA) for S3/AWS access
- ✅ Kubernetes Secrets for sensitive data
- ✅ Environment variables in all deployments
- ✅ No hardcoded credentials in production configs

**The `admin123` password is ONLY used for local development and testing.**

---

## 📝 Checklist Before Deployment

- [ ] All production credentials stored in AWS Secrets Manager
- [ ] Environment variables configured in Kubernetes deployments
- [ ] IAM roles configured for AWS resource access
- [ ] `.gitignore` includes all sensitive files
- [ ] No hardcoded credentials in production configuration files
- [ ] Database passwords are strong (16+ characters, mixed case, numbers, symbols)
- [ ] JWT secret is at least 256 bits of random data
- [ ] GitHub OAuth credentials are from production app (not development)

---

**Last Updated:** 2025-12-12
