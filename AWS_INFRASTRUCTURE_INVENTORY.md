# AWS Infrastructure Inventory

Complete list of all EC2 instances and resources currently running in AWS.

**Last Updated:** 2025-12-11  
**Region:** eu-north-1 (Stockholm)

---

## 📊 EC2 Instances Summary

**Total Instances:** 10  
**Total Monthly Cost:** ~$180-200/month

---

## 🗄️ TribeTalk Project Instances (7 instances)

### 1. Database Servers (4 instances)

#### PostgreSQL Server
- **Name:** `tribetalk-postgresql`
- **Instance ID:** `i-0ae740d492ea16aec`
- **Type:** t3.small
- **Status:** Running
- **AZ:** eu-north-1a
- **Network:** Private (no public IP)
- **Security Group:** tribetalk-postgresql-sg
- **Key Pair:** k8-SecurityKey
- **Launch Date:** 2025/12/10 09:34 GMT+0
- **Purpose:** PostgreSQL 15 database
- **Database:** `tribetalk`
- **Port:** 5432
- **Cost:** ~$15/month

#### MongoDB Server
- **Name:** `tribetalk-mongodb`
- **Instance ID:** `i-04e38cc8b8b88c86a`
- **Type:** t3.small
- **Status:** Running
- **AZ:** eu-north-1a
- **Network:** Private (no public IP)
- **Security Group:** tribetalk-mongodb-sg
- **Key Pair:** k8-SecurityKey
- **Launch Date:** 2025/12/10 09:34 GMT+0
- **Purpose:** MongoDB 7.0 database
- **Database:** `tribetalknosqldb`
- **Port:** 27017
- **Cost:** ~$15/month

#### Redis Server
- **Name:** `tribetalk-redis`
- **Instance ID:** `i-0f49d43c33b299c05`
- **Type:** t3.small
- **Status:** Running
- **AZ:** eu-north-1a
- **Network:** Private (no public IP)
- **Security Group:** tribetalk-redis-sg
- **Key Pair:** k8-SecurityKey
- **Launch Date:** 2025/12/10 09:34 GMT+0
- **Purpose:** Redis 7.2 cache
- **Port:** 6379
- **Cost:** ~$15/month

#### Kafka Server
- **Name:** `tribetalk-kafka-1`
- **Instance ID:** `i-04fc729aad7400216`
- **Type:** t3.small
- **Status:** Running
- **AZ:** eu-north-1a
- **Network:** Private (no public IP)
- **Security Group:** tribetalk-kafka-sg
- **Key Pair:** k8-SecurityKey
- **Launch Date:** 2025/12/10 09:34 GMT+0
- **Purpose:** Kafka KRaft mode (event streaming)
- **Port:** 9092
- **Cost:** ~$15/month

---

### 2. Management Servers (2 instances)

#### Bastion Host (Jump Server)
- **Name:** `tribetalk-bastion`
- **Instance ID:** `i-0eaf44cbfae2b6b85`
- **Type:** t3.micro
- **Status:** Running
- **AZ:** eu-north-1a
- **Public DNS:** ec2-51-20-93-11.eu-north-1.compute.amazonaws.com
- **Public IP:** 51.20.93.11
- **Network:** Public subnet
- **Security Group:** tribetalk-bastion-sg
- **Key Pair:** k8-SecurityKey
- **Launch Date:** 2025/12/10 09:34 GMT+0
- **Purpose:** SSH jump host to access private instances
- **SSH Access:** `ssh -i k8-SecurityKey.pem ubuntu@51.20.93.11`
- **Cost:** ~$7/month

#### Jenkins CI/CD Server
- **Name:** `tribetalk-jenkins`
- **Instance ID:** `i-0f4e163b35b86b280`
- **Type:** t3.small
- **Status:** Running
- **AZ:** eu-north-1a
- **Public DNS:** ec2-13-62-109-54.eu-north-1.compute.amazonaws.com
- **Public IP:** 13.62.109.54
- **Network:** Public subnet
- **Security Group:** tribetalk-jenkins-sg
- **Key Pair:** k8-SecurityKey
- **Launch Date:** 2025/12/10 09:34 GMT+0
- **Purpose:** Jenkins for CI/CD pipelines
- **Jenkins URL:** http://13.62.109.54:8080
- **Cost:** ~$15/month

---

### 3. EKS Worker Nodes (2 instances)

#### EKS Node 1
- **Instance ID:** `i-00efd68913e5d34b6`
- **Type:** t3.small
- **Status:** Running
- **AZ:** eu-north-1a
- **Network:** Private (no public IP)
- **Security Group:** eks-cluster-sg-tribetalk-eks-1894710554
- **Launch Date:** 2025/12/10 09:44 GMT+0
- **Purpose:** EKS worker node for TribeTalk cluster
- **Cluster:** tribetalk-eks
- **Cost:** ~$15/month

#### EKS Node 2
- **Instance ID:** `i-04ff48b594b6c1fcd`
- **Type:** t3.small
- **Status:** Running
- **AZ:** eu-north-1b
- **Network:** Private (no public IP)
- **Security Group:** eks-cluster-sg-tribetalk-eks-1894710554
- **Launch Date:** 2025/12/10 09:44 GMT+0
- **Purpose:** EKS worker node for TribeTalk cluster
- **Cluster:** tribetalk-eks
- **Cost:** ~$15/month

---

## 📚 Bookstore Project Instances (2 instances)

**Note:** These appear to be from a different project

#### Bookstore EKS Node 1
- **Instance ID:** `i-07c4eed3797224bc3`
- **Type:** t3.medium
- **Status:** Running
- **AZ:** eu-north-1a
- **Public DNS:** ec2-51-20-69-55.eu-north-1.compute.amazonaws.com
- **Public IP:** 51.20.69.55
- **Security Group:** eks-cluster-sg-bookstore-eks-2-1217382525
- **Launch Date:** 2025/12/10 20:56 GMT+0
- **Purpose:** EKS worker node for Bookstore cluster
- **Cost:** ~$30/month

#### Bookstore EKS Node 2
- **Instance ID:** `i-064f528bc694775be`
- **Type:** t3.medium
- **Status:** Running
- **AZ:** eu-north-1b
- **Public DNS:** ec2-13-60-58-116.eu-north-1.compute.amazonaws.com
- **Public IP:** 13.60.58.116
- **Security Group:** eks-cluster-sg-bookstore-eks-2-1217382525
- **Launch Date:** 2025/12/10 20:56 GMT+0
- **Purpose:** EKS worker node for Bookstore cluster
- **Cost:** ~$30/month

---

## 💰 Cost Breakdown

### TribeTalk Project
| Component | Instance Type | Count | Monthly Cost |
|-----------|--------------|-------|--------------|
| PostgreSQL | t3.small | 1 | ~$15 |
| MongoDB | t3.small | 1 | ~$15 |
| Redis | t3.small | 1 | ~$15 |
| Kafka | t3.small | 1 | ~$15 |
| Bastion | t3.micro | 1 | ~$7 |
| Jenkins | t3.small | 1 | ~$15 |
| EKS Nodes | t3.small | 2 | ~$30 |
| **Subtotal** | | **7** | **~$112/month** |

### Bookstore Project
| Component | Instance Type | Count | Monthly Cost |
|-----------|--------------|-------|--------------|
| EKS Nodes | t3.medium | 2 | ~$60 |
| **Subtotal** | | **2** | **~$60/month** |

### Additional AWS Costs
- **EKS Control Plane** (TribeTalk): ~$73/month
- **EKS Control Plane** (Bookstore): ~$73/month
- **NAT Gateway**: ~$32/month
- **ALB**: ~$16/month
- **EBS Volumes**: ~$10/month
- **Data Transfer**: Variable

### **Total Estimated Monthly Cost: ~$376/month**

---

## 🔌 Network Architecture

### Public Subnet (eu-north-1a)
- Bastion Host (51.20.93.11)
- Jenkins Server (13.62.109.54)

### Private Subnet (eu-north-1a)
- PostgreSQL Server
- MongoDB Server
- Redis Server
- Kafka Server
- EKS Node 1 (TribeTalk)
- Bookstore EKS Node 1

### Private Subnet (eu-north-1b)
- EKS Node 2 (TribeTalk)
- Bookstore EKS Node 2

---

## 🔐 Access Methods

### SSH to Private Instances (via Bastion)

```bash
# 1. SSH to bastion
ssh -i k8-SecurityKey.pem ubuntu@51.20.93.11

# 2. From bastion, SSH to private instances
ssh ubuntu@<private-ip>

# Or use SSH tunneling
ssh -i k8-SecurityKey.pem -J ubuntu@51.20.93.11 ubuntu@<private-ip>
```

### Database Access

```bash
# PostgreSQL (via bastion tunnel)
ssh -i k8-SecurityKey.pem -L 5432:<postgres-private-ip>:5432 ubuntu@51.20.93.11
psql -h localhost -U admin -d tribetalk

# MongoDB (via bastion tunnel)
ssh -i k8-SecurityKey.pem -L 27017:<mongodb-private-ip>:27017 ubuntu@51.20.93.11
mongosh mongodb://admin:admin123@localhost:27017/tribetalknosqldb?authSource=admin

# Redis (via bastion tunnel)
ssh -i k8-SecurityKey.pem -L 6379:<redis-private-ip>:6379 ubuntu@51.20.93.11
redis-cli -h localhost
```

### Jenkins Access

```bash
# Direct access (public IP)
http://13.62.109.54:8080
```

---

## 🛑 Shutdown Procedure

### To Stop TribeTalk Infrastructure (Save Costs)

```bash
# Stop database instances (data persists on EBS)
aws ec2 stop-instances --instance-ids \
  i-0ae740d492ea16aec \
  i-04e38cc8b8b88c86a \
  i-0f49d43c33b299c05 \
  i-04fc729aad7400216 \
  --region eu-north-1

# Stop management instances
aws ec2 stop-instances --instance-ids \
  i-0eaf44cbfae2b6b85 \
  i-0f4e163b35b86b280 \
  --region eu-north-1

# EKS nodes are managed by Auto Scaling Group
# Scale down EKS node group to 0
aws eks update-nodegroup-config \
  --cluster-name tribetalk-eks-cluster \
  --nodegroup-name tribetalk-node-group \
  --scaling-config minSize=0,maxSize=0,desiredSize=0 \
  --region eu-north-1
```

**Cost Savings When Stopped:**
- EC2 instances: ~$0/month (only pay for EBS storage ~$5/month)
- EKS control plane: Still ~$73/month (can't stop)
- NAT Gateway: Still ~$32/month (can delete to save)
- **Total savings: ~$112/month**

---

## 🔄 Startup Procedure

### To Restart TribeTalk Infrastructure

```bash
# Start database instances
aws ec2 start-instances --instance-ids \
  i-0ae740d492ea16aec \
  i-04e38cc8b8b88c86a \
  i-0f49d43c33b299c05 \
  i-04fc729aad7400216 \
  --region eu-north-1

# Start management instances
aws ec2 start-instances --instance-ids \
  i-0eaf44cbfae2b6b85 \
  i-0f4e163b35b86b280 \
  --region eu-north-1

# Scale up EKS node group
aws eks update-nodegroup-config \
  --cluster-name tribetalk-eks-cluster \
  --nodegroup-name tribetalk-node-group \
  --scaling-config minSize=2,maxSize=4,desiredSize=2 \
  --region eu-north-1

# Wait for instances to be running
aws ec2 wait instance-running --instance-ids \
  i-0ae740d492ea16aec i-04e38cc8b8b88c86a \
  i-0f49d43c33b299c05 i-04fc729aad7400216 \
  --region eu-north-1
```

---

## 🗑️ Complete Cleanup (Delete Everything)

### To Permanently Delete TribeTalk Infrastructure

```bash
# 1. Delete Kubernetes resources
kubectl delete -f k8s/deployments/
kubectl delete -f k8s/ingress.yaml

# 2. Delete EKS cluster (this will delete worker nodes)
eksctl delete cluster --name tribetalk-eks-cluster --region eu-north-1

# 3. Terminate EC2 instances
aws ec2 terminate-instances --instance-ids \
  i-0ae740d492ea16aec \
  i-04e38cc8b8b88c86a \
  i-0f49d43c33b299c05 \
  i-04fc729aad7400216 \
  i-0eaf44cbfae2b6b85 \
  i-0f4e163b35b86b280 \
  --region eu-north-1

# 4. Run Terraform destroy
cd terraform
terraform destroy

# This will delete:
# - All EC2 instances
# - VPC and networking
# - Security groups
# - IAM roles
# - ECR repositories
# - Secrets Manager secrets
```

⚠️ **WARNING:** This is irreversible! Make sure to backup data first (see DATA_PERSISTENCE_GUIDE.md)

---

## 📝 Notes

1. **Bookstore Instances**: You have 2 additional instances from a "bookstore" project. Consider terminating these if not needed to save ~$60/month.

2. **Instance Types**: All TribeTalk instances are t3.small (except bastion which is t3.micro). This is cost-effective for development but may need scaling for production.

3. **High Availability**: Current setup is single-AZ for databases. For production, consider multi-AZ deployment.

4. **Key Pair**: All instances use `k8-SecurityKey`. Make sure this key is backed up securely.

5. **Security Groups**: Each service has its own security group for network isolation.

6. **Private IPs**: Database instances don't have public IPs for security. Access via bastion host.

---

## 🔍 Quick Commands

```bash
# List all running instances
aws ec2 describe-instances \
  --filters "Name=instance-state-name,Values=running" \
  --query "Reservations[].Instances[].[InstanceId,InstanceType,Tags[?Key=='Name'].Value|[0],State.Name]" \
  --output table \
  --region eu-north-1

# Get instance costs
aws ce get-cost-and-usage \
  --time-period Start=2025-12-01,End=2025-12-11 \
  --granularity MONTHLY \
  --metrics BlendedCost \
  --group-by Type=SERVICE \
  --region eu-north-1

# Check EKS cluster status
kubectl get nodes
kubectl get pods --all-namespaces
```

---

**Managed by:** Terraform + Ansible  
**Documentation:** See README.md, DEPLOYMENT_CHECKLIST.md  
**Backup Strategy:** See DATA_PERSISTENCE_GUIDE.md
