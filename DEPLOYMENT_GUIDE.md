# TribeTalk Complete Deployment Guide

**A Step-by-Step Guide for Deploying TribeTalk to AWS**

This guide is written for team members with no prior deployment experience. Follow each step carefully, and you'll have TribeTalk running in production.

---

## Table of Contents

1. [What is TribeTalk?](#what-is-tribetalk)
2. [Architecture Overview](#architecture-overview)
3. [Prerequisites](#prerequisites)
4. [Phase 1: AWS Account Setup](#phase-1-aws-account-setup)
5. [Phase 2: Install Required Tools](#phase-2-install-required-tools)
6. [Phase 3: Infrastructure Deployment](#phase-3-infrastructure-deployment)
7. [Phase 4: Application Deployment](#phase-4-application-deployment)
8. [Phase 5: Verification](#phase-5-verification)
9. [Common Issues & Solutions](#common-issues--solutions)
10. [Maintenance & Updates](#maintenance--updates)

---

## What is TribeTalk?

TribeTalk is a Twitter-like social media application with:
- **Frontend**: React-based web application
- **Backend**: Spring Boot Java microservices
- **Databases**: PostgreSQL, MongoDB, Redis
- **Message Broker**: Apache Kafka
- **Infrastructure**: AWS EKS (Kubernetes)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    Internet Users                       │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│              AWS Application Load Balancer              │
└────────────────────┬────────────────────────────────────┘
                     │
        ┌────────────┴────────────┐
        ▼                         ▼
┌──────────────┐          ┌──────────────┐
│   Frontend   │          │   Backend    │
│   (React)    │          │ (Spring Boot)│
└──────────────┘          └──────┬───────┘
                                 │
                    ┌────────────┼────────────┐
                    ▼            ▼            ▼
              ┌──────────┐ ┌─────────┐ ┌─────────┐
              │PostgreSQL│ │ MongoDB │ │  Redis  │
              └──────────┘ └─────────┘ └─────────┘
                                 │
                                 ▼
                            ┌─────────┐
                            │  Kafka  │
                            └─────────┘
```

**All running on AWS EKS (Kubernetes)**

---

## Prerequisites

### What You Need:

1. **AWS Account** (with admin access)
2. **Computer** (Mac, Windows, or Linux)
3. **Credit Card** (for AWS - ~$280/month)
4. **2-3 hours** of time for initial setup

### Skills Required:
- Basic command line knowledge
- Ability to copy/paste commands
- Patience! 😊

---

## Phase 1: AWS Account Setup

### Step 1.1: Create AWS Account

1. Go to https://aws.amazon.com
2. Click **"Create an AWS Account"**
3. Follow the signup process
4. Add payment method
5. Verify your email and phone

### Step 1.2: Create IAM User

> ⚠️ **Don't use root account for deployment!**

1. Log into AWS Console
2. Go to **IAM** service
3. Click **Users** → **Add User**
4. Username: `tribetalk-deployer`
5. Select: **Programmatic access** ✅
6. Click **Next: Permissions**
7. Click **Attach existing policies directly**
8. Select: **AdministratorAccess** ✅
9. Click **Next** → **Create User**
10. **IMPORTANT**: Download the CSV with credentials
    - Access Key ID
    - Secret Access Key

### Step 1.3: Choose AWS Region

We'll use **eu-north-1** (Stockholm) for this guide.

> 💡 You can use any region, but update all commands accordingly.

---

## Phase 2: Install Required Tools

### For Mac Users:

#### Step 2.1: Install Homebrew
```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

#### Step 2.2: Install AWS CLI
```bash
brew install awscli
```

#### Step 2.3: Install Terraform
```bash
brew install terraform
```

#### Step 2.4: Install kubectl
```bash
brew install kubectl
```

#### Step 2.5: Install Docker Desktop
1. Download from: https://www.docker.com/products/docker-desktop
2. Install and start Docker Desktop

### For Windows Users:

#### Step 2.1: Install Chocolatey (Package Manager)
Open PowerShell as Administrator:
```powershell
Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
```

#### Step 2.2: Install Tools
```powershell
choco install awscli terraform kubectl docker-desktop -y
```

### For Linux Users:

```bash
# AWS CLI
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install

# Terraform
wget https://releases.hashicorp.com/terraform/1.6.0/terraform_1.6.0_linux_amd64.zip
unzip terraform_1.6.0_linux_amd64.zip
sudo mv terraform /usr/local/bin/

# kubectl
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
sudo install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl

# Docker
sudo apt-get update
sudo apt-get install docker.io -y
```

### Step 2.6: Verify Installations

Run these commands to verify:

```bash
aws --version
# Expected: aws-cli/2.x.x

terraform --version
# Expected: Terraform v1.x.x

kubectl version --client
# Expected: Client Version: v1.x.x

docker --version
# Expected: Docker version 24.x.x
```

---

## Phase 3: Infrastructure Deployment

### Step 3.1: Configure AWS Credentials

```bash
aws configure
```

Enter when prompted:
- **AWS Access Key ID**: (from Step 1.2)
- **AWS Secret Access Key**: (from Step 1.2)
- **Default region**: `eu-north-1`
- **Default output format**: `json`

Verify:
```bash
aws sts get-caller-identity
```

You should see your account details.

### Step 3.2: Clone the Repository

```bash
cd ~
git clone <your-tribetalk-repo-url>
cd ITC_Java_Batch2
```

### Step 3.3: Deploy Infrastructure with Terraform

```bash
# Navigate to infrastructure directory
cd infrastructure

# Initialize Terraform
terraform init
# This downloads AWS provider plugins (~30 seconds)

# Review what will be created
terraform plan
# This shows ~50+ resources that will be created

# Deploy infrastructure
terraform apply
# Type 'yes' when prompted
# ⏱️ This takes 15-20 minutes - grab a coffee! ☕
```

**What's being created:**
- VPC with public/private subnets
- EKS Kubernetes cluster
- 2 worker nodes (t3.medium)
- Load balancer controller
- 4 EC2 instances (PostgreSQL, MongoDB, Redis, Kafka)
- Security groups
- IAM roles

### Step 3.4: Save Terraform Outputs

```bash
terraform output > terraform-outputs.txt
cat terraform-outputs.txt
```

**Important outputs:**
- `eks_cluster_name`: Name of your Kubernetes cluster
- `postgresql_private_ip`: Database IP
- `mongodb_private_ip`: MongoDB IP
- `redis_private_ip`: Redis IP
- `kafka_private_ip`: Kafka IP

### Step 3.5: Configure kubectl

```bash
aws eks update-kubeconfig --region eu-north-1 --name tribetalk-eks-cluster
```

Verify:
```bash
kubectl get nodes
```

You should see 2 nodes in "Ready" status.

---

## Phase 4: Application Deployment

### Step 4.1: Create Kubernetes Secrets

First, get the database IPs from terraform outputs:

```bash
cd ../  # Back to project root

# Create database secrets
kubectl create secret generic tribetalk-database-secrets \
  --from-literal=postgres_url="jdbc:postgresql://10.0.10.109:5432/tribetalk" \
  --from-literal=postgres_username="admin" \
  --from-literal=postgres_password="admin123" \
  --from-literal=mongodb_uri="mongodb://10.0.10.138:27017/tribetalk" \
  --from-literal=redis_host="10.0.10.142" \
  --from-literal=redis_port="6379" \
  --from-literal=kafka_bootstrap_servers="10.0.10.95:9092"

# Create JWT secret
kubectl create secret generic tribetalk-jwt-secret \
  --from-literal=jwt_secret="your-super-secret-jwt-key-change-this-in-production"
```

> 💡 Replace the IPs with your actual IPs from terraform outputs

### Step 4.2: Deploy Kubernetes Resources

```bash
# Deploy ConfigMaps
kubectl apply -f k8s/configmaps/

# Deploy Services
kubectl apply -f k8s/deployments/

# Deploy Ingress
kubectl apply -f k8s/ingress.yaml
```

Wait for pods to be ready:
```bash
kubectl get pods -w
# Press Ctrl+C when all pods show "Running"
```

### Step 4.3: Build and Push Docker Images

#### Login to AWS ECR

```bash
# Get ECR login command
aws ecr get-login-password --region eu-north-1 | docker login --username AWS --password-stdin 430006376054.dkr.ecr.eu-north-1.amazonaws.com
```

#### Create ECR Repositories

```bash
aws ecr create-repository --repository-name tribetalk-service --region eu-north-1
aws ecr create-repository --repository-name tribe-talk-frontend --region eu-north-1
aws ecr create-repository --repository-name chatservice --region eu-north-1
aws ecr create-repository --repository-name notification-service --region eu-north-1
```

#### Build and Push Backend

```bash
cd tribetalk

# Build JAR
./mvnw clean package -DskipTests

# Build Docker image
docker build --platform linux/amd64 -t 430006376054.dkr.ecr.eu-north-1.amazonaws.com/tribetalk-service:v1.2 .

# Push to ECR
docker push 430006376054.dkr.ecr.eu-north-1.amazonaws.com/tribetalk-service:v1.2
```

#### Build and Push Frontend

```bash
cd ../tribe-talk-frontend

# Get ALB DNS name
ALB_DNS=$(kubectl get ingress tribetalk-ingress -o jsonpath='{.status.loadBalancer.ingress[0].hostname}')
echo "ALB DNS: $ALB_DNS"

# Build Docker image
docker build --platform linux/amd64 \
  --build-arg VITE_API_BASE_URL=http://$ALB_DNS \
  --build-arg VITE_GITHUB_CLIENT_ID=placeholder \
  -t 430006376054.dkr.ecr.eu-north-1.amazonaws.com/tribe-talk-frontend:v1.5 .

# Push to ECR
docker push 430006376054.dkr.ecr.eu-north-1.amazonaws.com/tribe-talk-frontend:v1.5
```

#### Build and Push Other Services

```bash
# Chat Service
cd ../chatservice
./mvnw clean package -DskipTests
docker build --platform linux/amd64 -t 430006376054.dkr.ecr.eu-north-1.amazonaws.com/chatservice:v1.0 .
docker push 430006376054.dkr.ecr.eu-north-1.amazonaws.com/chatservice:v1.0

# Notification Service
cd ../notification-service
./mvnw clean package -DskipTests
docker build --platform linux/amd64 -t 430006376054.dkr.ecr.eu-north-1.amazonaws.com/notification-service:v1.0 .
docker push 430006376054.dkr.ecr.eu-north-1.amazonaws.com/notification-service:v1.0
```

### Step 4.4: Update Deployments

```bash
cd ../

# Update backend
kubectl set image deployment/tribetalk tribetalk=430006376054.dkr.ecr.eu-north-1.amazonaws.com/tribetalk-service:v1.2

# Update frontend
kubectl set image deployment/tribe-talk-frontend tribe-talk-frontend=430006376054.dkr.ecr.eu-north-1.amazonaws.com/tribe-talk-frontend:v1.5

# Update chat service
kubectl set image deployment/chatservice chatservice=430006376054.dkr.ecr.eu-north-1.amazonaws.com/chatservice:v1.0

# Update notification service
kubectl set image deployment/notification-service notification-service=430006376054.dkr.ecr.eu-north-1.amazonaws.com/notification-service:v1.0
```

Wait for rollouts:
```bash
kubectl rollout status deployment/tribetalk
kubectl rollout status deployment/tribe-talk-frontend
kubectl rollout status deployment/chatservice
kubectl rollout status deployment/notification-service
```

### Step 4.5: Create Kafka Topics

```bash
# SSH to Kafka EC2 instance (get IP from terraform outputs)
ssh -i your-key.pem ubuntu@<kafka-ip>

# Create topics
/opt/kafka/bin/kafka-topics.sh --bootstrap-server localhost:9092 --create --topic notifications-topic --partitions 3 --replication-factor 1
/opt/kafka/bin/kafka-topics.sh --bootstrap-server localhost:9092 --create --topic notifications-topic-retry-5000 --partitions 1 --replication-factor 1
/opt/kafka/bin/kafka-topics.sh --bootstrap-server localhost:9092 --create --topic notifications-topic-retry-10000 --partitions 1 --replication-factor 1
/opt/kafka/bin/kafka-topics.sh --bootstrap-server localhost:9092 --create --topic notifications-topic.DLT --partitions 1 --replication-factor 1

# Exit SSH
exit
```

---

## Phase 5: Verification

### Step 5.1: Get Application URL

```bash
kubectl get ingress tribetalk-ingress
```

Look for the **ADDRESS** column - this is your application URL.

Example: `k8s-default-tribetal-089de13287-2004909155.eu-north-1.elb.amazonaws.com`

### Step 5.2: Access the Application

Open your browser and go to:
```
http://<your-alb-dns>
```

You should see the TribeTalk login/register page!

### Step 5.3: Test Registration

1. Click **"Create account"**
2. Fill in:
   - Display Name: `Test User`
   - Username: `testuser`
   - Email: `test@example.com`
   - Password: `Test123!@#`
3. Click **Submit**
4. You should see "Successfully Registered"

### Step 5.4: Test Login

1. Enter:
   - Username: `testuser`
   - Password: `Test123!@#`
2. Click **Sign In**
3. You should be redirected to the main feed!

### Step 5.5: Verify All Pods

```bash
kubectl get pods
```

All pods should show `STATUS: Running` and `READY: 1/1`

### Step 5.6: Check Logs

```bash
# Backend logs
kubectl logs -l app=tribetalk --tail=50

# Frontend logs
kubectl logs -l app=tribe-talk-frontend --tail=50
```

---

## Common Issues & Solutions

### Issue 1: Pods Not Starting

**Symptom**: Pods stuck in `Pending` or `CrashLoopBackOff`

**Solution**:
```bash
# Check pod details
kubectl describe pod <pod-name>

# Check logs
kubectl logs <pod-name>

# Common fixes:
# - Check if images are pushed to ECR
# - Verify secrets are created
# - Check resource limits
```

### Issue 2: Can't Access Application

**Symptom**: Browser shows "This site can't be reached"

**Solution**:
```bash
# Check ingress
kubectl get ingress

# Check load balancer
kubectl get svc

# Wait 5-10 minutes for ALB to provision
```

### Issue 3: Database Connection Errors

**Symptom**: Backend logs show "Connection refused"

**Solution**:
```bash
# Verify database IPs in secrets
kubectl get secret tribetalk-database-secrets -o yaml

# Test database connectivity from a pod
kubectl run test-db --rm -it --image=postgres:14 --restart=Never -- psql -h 10.0.10.109 -U admin -d tribetalk
```

### Issue 4: Image Pull Errors

**Symptom**: `ErrImagePull` or `ImagePullBackOff`

**Solution**:
```bash
# Re-login to ECR
aws ecr get-login-password --region eu-north-1 | docker login --username AWS --password-stdin 430006376054.dkr.ecr.eu-north-1.amazonaws.com

# Verify image exists
aws ecr describe-images --repository-name tribetalk-service --region eu-north-1
```

---

## Maintenance & Updates

### Updating Application Code

1. **Make code changes**
2. **Build new image** with new version tag (e.g., v1.3)
3. **Push to ECR**
4. **Update deployment**:
   ```bash
   kubectl set image deployment/tribetalk tribetalk=430006376054.dkr.ecr.eu-north-1.amazonaws.com/tribetalk-service:v1.3
   ```

### Scaling Application

```bash
# Scale backend to 3 replicas
kubectl scale deployment/tribetalk --replicas=3

# Scale frontend to 2 replicas
kubectl scale deployment/tribe-talk-frontend --replicas=2
```

### Viewing Logs

```bash
# Real-time logs
kubectl logs -f deployment/tribetalk

# Last 100 lines
kubectl logs deployment/tribetalk --tail=100

# Logs from all pods
kubectl logs -l app=tribetalk --all-containers=true
```

### Database Backup

```bash
# PostgreSQL backup
kubectl run pg-backup --rm -it --image=postgres:14 --restart=Never -- pg_dump -h 10.0.10.109 -U admin tribetalk > backup.sql
```

### Monitoring Resources

```bash
# Pod resource usage
kubectl top pods

# Node resource usage
kubectl top nodes

# Describe deployment
kubectl describe deployment tribetalk
```

---

## Cost Management

### Monthly Cost Breakdown

| Resource | Cost (USD/month) |
|----------|------------------|
| EKS Cluster | $73 |
| 2x t3.medium nodes | $60 |
| NAT Gateways | $65 |
| EC2 instances (databases) | $60 |
| Load Balancer | $20 |
| Data Transfer | $10-20 |
| **Total** | **~$288** |

### Cost Optimization Tips

1. **Stop non-production environments** when not in use
2. **Use Spot Instances** for worker nodes (50-70% savings)
3. **Right-size instances** based on actual usage
4. **Delete unused resources** regularly
5. **Set up billing alerts** in AWS Console

---

## Cleanup (Destroying Everything)

> ⚠️ **WARNING**: This deletes EVERYTHING including data!

```bash
# Delete Kubernetes resources
kubectl delete -f k8s/

# Destroy infrastructure
cd infrastructure
terraform destroy
# Type 'yes' when prompted
```

---

## Getting Help

### Useful Commands

```bash
# Check cluster status
kubectl cluster-info

# List all resources
kubectl get all

# Describe a resource
kubectl describe <resource-type> <resource-name>

# Get events
kubectl get events --sort-by='.lastTimestamp'

# Shell into a pod
kubectl exec -it <pod-name> -- /bin/bash
```

### Documentation Links

- [Kubernetes Docs](https://kubernetes.io/docs/)
- [AWS EKS Docs](https://docs.aws.amazon.com/eks/)
- [Terraform AWS Provider](https://registry.terraform.io/providers/hashicorp/aws/latest/docs)
- [Docker Docs](https://docs.docker.com/)

### Support Channels

- Check `TROUBLESHOOTING.md` in the infrastructure folder
- Review application logs
- Check AWS CloudWatch for infrastructure issues
- Consult with senior team members

---

## Glossary

- **EKS**: Amazon Elastic Kubernetes Service - Managed Kubernetes
- **Pod**: Smallest deployable unit in Kubernetes (container wrapper)
- **Deployment**: Manages pod replicas and updates
- **Service**: Exposes pods to network traffic
- **Ingress**: Routes external traffic to services
- **ALB**: Application Load Balancer
- **ECR**: Elastic Container Registry (Docker image storage)
- **VPC**: Virtual Private Cloud (isolated network)
- **IAM**: Identity and Access Management

---

## Checklist

Use this checklist to track your progress:

- [ ] AWS account created
- [ ] IAM user created with credentials
- [ ] All tools installed (AWS CLI, Terraform, kubectl, Docker)
- [ ] AWS credentials configured
- [ ] Repository cloned
- [ ] Terraform infrastructure deployed
- [ ] kubectl configured
- [ ] Kubernetes secrets created
- [ ] ECR repositories created
- [ ] Docker images built and pushed
- [ ] Deployments updated
- [ ] Kafka topics created
- [ ] Application accessible in browser
- [ ] Registration tested
- [ ] Login tested

---

**Congratulations!** 🎉

If you've completed all steps, you now have TribeTalk running in production on AWS!

---

**Last Updated**: December 2025  
**Version**: 1.0  
**Maintained by**: TribeTalk Team
