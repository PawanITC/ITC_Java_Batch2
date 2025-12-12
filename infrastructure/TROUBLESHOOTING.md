# TribeTalk Deployment - Issues Fixed & Solutions

**Date:** December 10, 2025  
**Status:** Resolved

This document tracks all issues encountered during deployment and their solutions.

---

## Issue 1: Kafka IP Extraction Failed ❌ → ✅ Fixed

### Problem
```bash
export KAFKA_IP=$(terraform output -raw kafka_broker_ips | cut -d',' -f1)
```
**Error:** `Unsupported value for raw output - kafka_broker_ips is tuple`

### Root Cause
The `kafka_broker_ips` Terraform output is a list/tuple, not a string. The `-raw` flag only works with scalar values.

### Solution
Use `grep` to extract the IP address from the list output:
```bash
export KAFKA_IP=$(terraform output kafka_broker_ips | grep -o '[0-9]\+\.[0-9]\+\.[0-9]\+\.[0-9]\+' | head -1)
```

### Files Updated
- ✅ `infrastructure/DEPLOYMENT_CHECKLIST_DETAILED.md`
- ✅ `infrastructure/QUICK_DEPLOY.md`
- ✅ `scripts/deploy-complete.sh`

---

## Issue 2: AWS Load Balancer Controller CRD Installation Failed ❌ → ✅ Fixed

### Problem
```bash
kubectl apply -k "github.com/aws/eks-charts/stable/aws-load-balancer-controller//crds?ref=master"
```
**Error:** `repository not found`

### Root Cause
The kustomize-style GitHub URL format has changed in the eks-charts repository.

### Solution
Use the direct raw GitHub URL:
```bash
kubectl apply -f https://raw.githubusercontent.com/aws/eks-charts/master/stable/aws-load-balancer-controller/crds/crds.yaml
```

### Files Updated
- ✅ `infrastructure/DEPLOYMENT_CHECKLIST_DETAILED.md`
- ✅ `infrastructure/QUICK_DEPLOY.md`
- ✅ `infrastructure/README.md`
- ✅ `infrastructure/PRODUCTION_DEPLOYMENT.md`
- ✅ `scripts/deploy-complete.sh`

---

## Issue 3: AWS Load Balancer Controller CrashLoopBackOff ❌ → ✅ Fixed

### Problem
```bash
helm install aws-load-balancer-controller eks/aws-load-balancer-controller \
  -n kube-system \
  --set clusterName=tribetalk-eks \
  --wait
```
**Error:** Pods in `CrashLoopBackOff` state  
**Log Error:** `unable to initialize AWS cloud - failed to introspect region from EC2Metadata`

### Root Cause
The AWS Load Balancer Controller couldn't detect the AWS region from EC2 metadata and needs explicit configuration.

### Solution
Add `region` and `vpcId` parameters to the Helm installation:
```bash
VPC_ID=$(cd ../terraform && terraform output -raw vpc_id)

helm install aws-load-balancer-controller eks/aws-load-balancer-controller \
  -n kube-system \
  --set clusterName=tribetalk-eks \
  --set region=eu-north-1 \
  --set vpcId=$VPC_ID \
  --set serviceAccount.create=true \
  --set serviceAccount.name=aws-load-balancer-controller
```

### Files Updated
- ✅ `infrastructure/DEPLOYMENT_CHECKLIST_DETAILED.md`
- ✅ `infrastructure/QUICK_DEPLOY.md`
- ✅ `scripts/deploy-complete.sh`

---

## Issue 4: External Secrets Verification Command Incorrect ❌ → ✅ Fixed

### Problem
```bash
grep "roleArn" external-secrets.yaml
```
**Error:** No output (command failed)

### Root Cause
The YAML file uses `role-arn` (with hyphen) not `roleArn` (camelCase).

### Solution
Use the correct hyphenated syntax:
```bash
grep "role-arn" external-secrets.yaml
```

### Files Updated
- ✅ `infrastructure/DEPLOYMENT_CHECKLIST_DETAILED.md`
- ✅ `infrastructure/PRODUCTION_DEPLOYMENT.md`

---

## Issue 5: Incorrect Secret Names in Documentation ❌ → ✅ Fixed

### Problem
Documentation referenced `tribetalk-secrets` but actual secrets created were:
- `tribetalk-app-secrets`
- `tribetalk-database-secrets`

### Root Cause
External Secrets Operator creates secrets with names defined in the `target.name` field of ExternalSecret resources, not a generic name.

### Solution
Updated all documentation to reference the correct secret names:

| ExternalSecret | Kubernetes Secret | Keys | AWS Secrets Manager Key |
|----------------|-------------------|------|-------------------------|
| `app-config` | `tribetalk-app-secrets` | 7 | `tribetalk/app/config` |
| `database-credentials` | `tribetalk-database-secrets` | 6 | `tribetalk/database/credentials` |

### Verification Commands
```bash
# Check ExternalSecrets status
kubectl get externalsecrets

# Check created secrets
kubectl get secrets | grep tribetalk

# Verify secret contents
kubectl describe secret tribetalk-database-secrets
kubectl describe secret tribetalk-app-secrets
```

### Files Updated
- ✅ `infrastructure/DEPLOYMENT_CHECKLIST_DETAILED.md`
- ✅ `infrastructure/QUICK_DEPLOY.md`
- ✅ `infrastructure/PRODUCTION_DEPLOYMENT.md`

---

## Issue 6: Ansible SSH Connection Failed ❌ → ✅ Fixed

### Problem
```bash
ansible all -i inventory/aws_ec2.yml -m ping
```
**Error:** `Failed to connect to the host via ssh: Connection closed by UNKNOWN port 65535`

### Root Cause
The `ansible.cfg` file had a hardcoded bastion IP (`13.61.194.178`) from a previous deployment, but the actual bastion IP was `51.20.93.11`.

### Solution
Update `ansible.cfg` with the correct bastion IP:
```ini
[ssh_connection]
ssh_args = -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -o ProxyCommand="ssh -W %h:%p -q ubuntu@51.20.93.11 -i ~/.ssh/k8-SecurityKey.pem"
```

### Additional Step Required
Accept the bastion host key on first connection:
```bash
ssh -i ~/.ssh/k8-SecurityKey.pem ubuntu@51.20.93.11 "echo 'Bastion connection successful'"
# Type 'yes' when prompted
```

### Verification
```bash
ansible all -i inventory/aws_ec2.yml -m ping --limit ansible_postgresql
# Should return: SUCCESS => "ping": "pong"
```

### Files Updated
- ✅ `ansible/ansible.cfg`

### Recommendation for Future
Add a step in deployment documentation to dynamically update the bastion IP:
```bash
BASTION_IP=$(cd ../terraform && terraform output -raw bastion_public_ip)
sed -i.bak "s/ubuntu@[0-9.]\+/ubuntu@$BASTION_IP/" ansible.cfg
```

---

## Issue 7: EKS Pods Cannot Connect to Databases ❌ → ✅ Fixed

### Problem
```bash
kubectl logs -l app=tribetalk
```
**Error:** `org.postgresql.util.PSQLException: The connection attempt failed.`  
**Error:** `java.net.SocketTimeoutException: Connect timed out`  
**Pod Status:** `CrashLoopBackOff`

### Root Cause
The database security groups (PostgreSQL, MongoDB, Redis, Kafka) didn't have inbound rules allowing traffic from the EKS cluster security group. Even though:
- PostgreSQL was configured to listen on all interfaces (`listen_addresses = '*'`)
- pg_hba.conf allowed connections from the VPC (`10.0.0.0/16`)
- The database service was running

The AWS security groups were blocking the connection at the network level.

### Solution
Add security group ingress rules to allow EKS cluster to access all databases:

```bash
# Get EKS cluster security group
EKS_SG=$(cd terraform && terraform output -raw eks_cluster_security_group_id)

# Get database security groups
POSTGRES_SG=$(aws ec2 describe-security-groups --filters "Name=group-name,Values=tribetalk-postgresql-sg" --region eu-north-1 --query 'SecurityGroups[0].GroupId' --output text)
MONGODB_SG=$(aws ec2 describe-security-groups --filters "Name=group-name,Values=tribetalk-mongodb-sg" --region eu-north-1 --query 'SecurityGroups[0].GroupId' --output text)
REDIS_SG=$(aws ec2 describe-security-groups --filters "Name=group-name,Values=tribetalk-redis-sg" --region eu-north-1 --query 'SecurityGroups[0].GroupId' --output text)
KAFKA_SG=$(aws ec2 describe-security-groups --filters "Name=group-name,Values=tribetalk-kafka-sg" --region eu-north-1 --query 'SecurityGroups[0].GroupId' --output text)

# Add ingress rules
aws ec2 authorize-security-group-ingress --group-id $POSTGRES_SG --protocol tcp --port 5432 --source-group $EKS_SG --region eu-north-1
aws ec2 authorize-security-group-ingress --group-id $MONGODB_SG --protocol tcp --port 27017 --source-group $EKS_SG --region eu-north-1
aws ec2 authorize-security-group-ingress --group-id $REDIS_SG --protocol tcp --port 6379 --source-group $EKS_SG --region eu-north-1
aws ec2 authorize-security-group-ingress --group-id $KAFKA_SG --protocol tcp --port 9092 --source-group $EKS_SG --region eu-north-1
```

### Verification
```bash
# Restart the deployment to pick up the new security group rules
kubectl rollout restart deployment/tribetalk

# Watch the pod status
kubectl get pods -l app=tribetalk -w

# Check logs for successful startup
kubectl logs -l app=tribetalk --tail=20 | grep "Started TribetalkApplication"
```

### Files Updated
- ✅ `infrastructure/DEPLOYMENT_CHECKLIST_DETAILED.md` - Added Phase 3.7
- ✅ `infrastructure/QUICK_DEPLOY.md` - Added security group commands
- ✅ `infrastructure/TROUBLESHOOTING.md` - Documented Issue #7

### Result
✅ TribeTalk pod started successfully  
✅ Connected to PostgreSQL database  
✅ Application running on port 8080

---

## Summary of All Fixes

| Issue | Impact | Status | Files Updated |
|-------|--------|--------|---------------|
| Kafka IP extraction | Blocked environment variable setup | ✅ Fixed | 3 files |
| ALB Controller CRD URL | Blocked ALB controller installation | ✅ Fixed | 5 files |
| ALB Controller region config | Controller crashed on startup | ✅ Fixed | 3 files |
| External Secrets grep command | Minor verification issue | ✅ Fixed | 2 files |
| Incorrect secret names | Documentation mismatch | ✅ Fixed | 3 files |
| Ansible bastion IP | Blocked database setup | ✅ Fixed | 1 file |
| **Security group rules** | **Pods couldn't connect to databases** | **✅ Fixed** | **3 files** |

**Total Files Updated:** 20 files across documentation and configuration

---

## Deployment Status

### ✅ Completed Phases
1. **Infrastructure** - Terraform deployed successfully
2. **Kubernetes Setup** - kubectl configured, nodes ready
3. **External Secrets Operator** - Installed and running
4. **AWS Load Balancer Controller** - Installed with correct configuration
5. **External Secrets** - Successfully synced from AWS Secrets Manager
6. **Ansible Connectivity** - SSH through bastion working
7. **Database Setup** - PostgreSQL, MongoDB, Redis, Kafka configured
8. **Security Groups** - EKS to database connectivity enabled

### 🔄 Current Phase
**Phase 4: Build and Deploy Applications**
- Docker images built and pushed to ECR
- TribeTalk deployment successful and running
- Next: Deploy remaining services (ChatService, Notification Service, Frontend)

---

## Lessons Learned

1. **Always verify Terraform output types** before using `-raw` flag
2. **Pin specific versions** for Helm charts and CRD URLs to avoid breaking changes
3. **Explicitly configure cloud provider parameters** (region, VPC) for controllers
4. **Use actual resource names** in documentation, not assumed names
5. **Dynamic configuration** is better than hardcoded IPs for infrastructure
6. **Test SSH connectivity** to bastion before running Ansible playbooks

---

## Quick Reference Commands

```bash
# Get all Terraform outputs
cd terraform && terraform output

# Get specific output (string/number)
terraform output -raw <output_name>

# Get list/map output
terraform output <output_name>

# Test Ansible connectivity
ansible all -i inventory/aws_ec2.yml -m ping

# Check Kubernetes resources
kubectl get pods -A
kubectl get externalsecrets
kubectl get secrets

# Verify ALB Controller
kubectl get deployment -n kube-system aws-load-balancer-controller
kubectl logs -n kube-system -l app.kubernetes.io/name=aws-load-balancer-controller
```

---

**All issues resolved! Deployment can proceed to database setup phase.** ✅
