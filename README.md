# TribeTalk - Social Media Platform

A production-grade Twitter-like social media platform built with Spring Boot microservices, React frontend, and deployed on AWS EKS using Kubernetes.

## 🏗️ Architecture Overview

### Backend Services
- **TribeTalk Service** (Port 8080) - Main API service for posts, users, authentication
- **Chat Service** (Port 8081) - Real-time messaging with WebSocket (STOMP over SockJS)
- **Notification Service** (Port 8082) - Push notifications via Kafka with WebSocket delivery

### Frontend
- **React SPA** - Modern UI with Vite, TailwindCSS, served via Nginx
- **Features**: Real-time messaging, notifications, posts, likes, bookmarks, user profiles

### Infrastructure
- **AWS EKS** - Kubernetes 1.31 cluster (3x t3.small nodes)
- **PostgreSQL** - Relational database for user data, posts
- **MongoDB** - NoSQL database for notifications, chat history
- **Redis** - Caching and session management
- **Kafka (KRaft)** - Event streaming for notifications
- **AWS ALB** - Application Load Balancer with Ingress Controller
- **AWS ECR** - Container registry for Docker images
- **AWS Secrets Manager** - Secure credential storage via External Secrets Operator

### Current Deployment
- **ALB URL**: `http://k8s-default-tribetal-089de13287-2075252521.eu-north-1.elb.amazonaws.com`
- **Region**: eu-north-1 (Stockholm)
- **Cluster**: tribetalk-eks-cluster
- **Nodes**: 3x t3.small (2 vCPU, 2GB RAM each)

---

## 📁 Project Structure

```
ITC_Java_Batch2/
├── tribetalk/                    # Main Spring Boot service
├── ChatService/                  # Chat microservice  
├── notification-service/         # Notification microservice
├── tribe-talk-frontend/          # React frontend
├── terraform/                    # Infrastructure as Code
│   ├── vpc.tf                   # VPC, subnets, NAT gateway
│   ├── eks.tf                   # EKS cluster configuration
│   ├── ec2-infrastructure.tf    # EC2 instances for databases
│   ├── ecr.tf                   # ECR repositories
│   ├── security-groups.tf       # Security group rules
│   ├── secrets-manager.tf       # AWS Secrets Manager
│   └── outputs.tf               # Terraform outputs
├── ansible/                      # Configuration management
│   ├── roles/
│   │   ├── postgresql/          # PostgreSQL installation
│   │   ├── mongodb/             # MongoDB installation
│   │   ├── redis/               # Redis installation
│   │   └── kafka-kraft/         # Kafka KRaft mode setup
│   └── playbooks/
│       ├── setup-infrastructure.yml
│       └── setup-kafka-kraft.yml
├── k8s/                          # Kubernetes manifests
│   ├── deployments/             # Service deployments
│   ├── ingress.yaml             # ALB Ingress configuration
│   ├── external-secrets.yaml    # External Secrets Operator
│   └── monitoring/              # Grafana monitoring stack
└── scripts/                      # Deployment scripts
```

---

## 🚀 Quick Start

### Prerequisites

- **AWS Account** with appropriate permissions
- **AWS CLI** configured (`aws configure`)
- **Terraform** >= 1.5
- **Ansible** >= 2.9
- **kubectl** configured
- **Docker** Desktop
- **Node.js** 18+ (for frontend)
- **Java 21** (for backend services)
- **Maven** 3.9+
- **Helm** 3.x

---

## 📦 Part 1: Terraform Infrastructure

### What Terraform Creates

1. **VPC & Networking**
   - VPC with CIDR 10.0.0.0/16
   - 2 Public subnets (for ALB, NAT)
   - 2 Private subnets (for EKS nodes, databases)
   - Internet Gateway
   - NAT Gateway for private subnet internet access

2. **EKS Cluster**
   - Kubernetes version 1.31
   - Managed node group (t3.small instances)
   - Auto-scaling: 2-4 nodes
   - IAM roles and policies

3. **EC2 Instances**
   - Database server (t3.medium) for PostgreSQL, MongoDB, Redis, Kafka
   - Security groups with proper ingress/egress rules

4. **ECR Repositories**
   - `tribetalk-service`
   - `tribe-talk-frontend`
   - `chatservice`
   - `notification-service`

5. **AWS Secrets Manager**
   - Database credentials
   - Application secrets
   - JWT secrets

### Terraform Commands

```bash
# Navigate to terraform directory
cd terraform

# Initialize Terraform
terraform init

# Review the infrastructure plan
terraform plan -out=tfplan

# Apply the infrastructure
terraform apply tfplan

# View outputs
terraform output

# Configure kubectl for EKS
aws eks update-kubeconfig --region eu-north-1 --name tribetalk-eks-cluster

# Verify connection
kubectl get nodes
```

---

## 🔧 Part 2: Ansible Configuration

### What Ansible Installs

1. **PostgreSQL 15**
   - Database: `tribetalk`
   - Port: 5432
   - Configured for remote connections

2. **MongoDB 7.0**
   - Database: `tribetalknosqldb`
   - Port: 27017
   - Authentication enabled

3. **Redis 7.2**
   - Port: 6379
   - Persistence enabled

4. **Kafka (KRaft Mode)**
   - Port: 9092
   - No Zookeeper required
   - Topics: `notifications-topic`

### Ansible Commands

```bash
cd ansible

# Update inventory with EC2 instance IP
# Edit: ansible/inventory/hosts
[database_servers]
db-server ansible_host=<DATABASE_INSTANCE_PUBLIC_IP> ansible_user=ubuntu

# Test connectivity
ansible -i inventory/hosts database_servers -m ping

# Run infrastructure setup
ansible-playbook -i inventory/hosts playbooks/setup-infrastructure.yml

# Run Kafka setup
ansible-playbook -i inventory/hosts playbooks/setup-kafka-kraft.yml

# Verify services
ansible -i inventory/hosts database_servers -a "systemctl status postgresql"
ansible -i inventory/hosts database_servers -a "systemctl status mongod"
ansible -i inventory/hosts database_servers -a "systemctl status redis"
ansible -i inventory/hosts database_servers -a "systemctl status kafka"
```

---

## 🐳 Part 3: Build and Push Docker Images

### Backend Services

```bash
# 1. Build TribeTalk Service
cd tribetalk
mvn clean package -DskipTests
docker buildx build --no-cache --platform linux/amd64 \
  -t 430006376054.dkr.ecr.eu-north-1.amazonaws.com/tribetalk-service:v1.1 \
  --push .

# 2. Build Chat Service
cd ../ChatService
mvn clean package -DskipTests
docker buildx build --no-cache --platform linux/amd64 \
  -t 430006376054.dkr.ecr.eu-north-1.amazonaws.com/chatservice:v1.0 \
  --push .

# 3. Build Notification Service
cd ../notification-service
mvn clean package -DskipTests
docker buildx build --no-cache --platform linux/amd64 \
  -t 430006376054.dkr.ecr.eu-north-1.amazonaws.com/notification-service:v3.4-bulk-update \
  --push .
```

### Frontend

```bash
cd tribe-talk-frontend

# Build production bundle
npm run build

# Build and push Docker image
docker buildx build --no-cache --platform linux/amd64 \
  --build-arg VITE_API_BASE_URL=http://k8s-default-tribetal-089de13287-2075252521.eu-north-1.elb.amazonaws.com \
  -t 430006376054.dkr.ecr.eu-north-1.amazonaws.com/tribe-talk-frontend:v2.3-feather-icons \
  --push .
```

### ECR Login

```bash
# Login to ECR
aws ecr get-login-password --region eu-north-1 | \
  docker login --username AWS --password-stdin \
  430006376054.dkr.ecr.eu-north-1.amazonaws.com
```

---

## ☸️ Part 4: Kubernetes Deployment

### Install AWS Load Balancer Controller

```bash
# Create IAM policy
curl -o iam_policy.json https://raw.githubusercontent.com/kubernetes-sigs/aws-load-balancer-controller/v2.7.0/docs/install/iam_policy.json

aws iam create-policy \
    --policy-name AWSLoadBalancerControllerIAMPolicy \
    --policy-document file://iam_policy.json

# Create IAM role and service account
eksctl create iamserviceaccount \
  --cluster=tribetalk-eks-cluster \
  --namespace=kube-system \
  --name=aws-load-balancer-controller \
  --attach-policy-arn=arn:aws:iam::430006376054:policy/AWSLoadBalancerControllerIAMPolicy \
  --override-existing-serviceaccounts \
  --region eu-north-1 \
  --approve

# Install controller via Helm
helm repo add eks https://aws.github.io/eks-charts
helm repo update

helm install aws-load-balancer-controller eks/aws-load-balancer-controller \
  -n kube-system \
  --set clusterName=tribetalk-eks-cluster \
  --set serviceAccount.create=false \
  --set serviceAccount.name=aws-load-balancer-controller
```

### Deploy External Secrets Operator

```bash
# Install External Secrets Operator
helm repo add external-secrets https://charts.external-secrets.io
helm install external-secrets external-secrets/external-secrets \
  -n external-secrets-system \
  --create-namespace

# Create IAM role for External Secrets
eksctl create iamserviceaccount \
  --name tribetalk-sa \
  --namespace default \
  --cluster tribetalk-eks-cluster \
  --attach-policy-arn arn:aws:iam::aws:policy/SecretsManagerReadWrite \
  --approve \
  --region eu-north-1

# Apply External Secrets configuration
kubectl apply -f k8s/external-secrets.yaml
```

### Deploy Application Services

```bash
# Deploy services
kubectl apply -f k8s/deployments/tribetalk.yaml
kubectl apply -f k8s/deployments/chatservice.yaml
kubectl apply -f k8s/deployments/notification-service.yaml
kubectl apply -f k8s/deployments/tribe-talk-frontend.yaml

# Deploy ingress
kubectl apply -f k8s/ingress.yaml

# Check deployment status
kubectl get pods
kubectl get svc
kubectl get ingress

# Get ALB DNS name
kubectl get ingress tribetalk-ingress -o jsonpath='{.status.loadBalancer.ingress[0].hostname}'
```

---

## 🔄 Update Deployment

### Update Backend Service

```bash
# Example: Update TribeTalk service
cd tribetalk
mvn clean package -DskipTests

docker buildx build --no-cache --platform linux/amd64 \
  -t 430006376054.dkr.ecr.eu-north-1.amazonaws.com/tribetalk-service:v1.2 \
  --push .

# Update deployment
kubectl set image deployment/tribetalk \
  tribetalk=430006376054.dkr.ecr.eu-north-1.amazonaws.com/tribetalk-service:v1.2

# Watch rollout
kubectl rollout status deployment/tribetalk
```

### Update Frontend

```bash
cd tribe-talk-frontend
npm run build

docker buildx build --no-cache --platform linux/amd64 \
  --build-arg VITE_API_BASE_URL=http://k8s-default-tribetal-089de13287-2075252521.eu-north-1.elb.amazonaws.com \
  -t 430006376054.dkr.ecr.eu-north-1.amazonaws.com/tribe-talk-frontend:v2.4 \
  --push .

kubectl set image deployment/tribe-talk-frontend \
  tribe-talk-frontend=430006376054.dkr.ecr.eu-north-1.amazonaws.com/tribe-talk-frontend:v2.4

kubectl rollout status deployment/tribe-talk-frontend
```

---

## 📊 Monitoring & Observability

### Grafana Monitoring Stack

Self-hosted Grafana deployed on EKS for metrics visualization.

**Access Grafana:**
```bash
kubectl port-forward -n default svc/grafana 3000:80
```
Open: **http://localhost:3000**

**Default Credentials:**
- Username: `admin`
- Password: Retrieve with `kubectl get secret grafana -o jsonpath="{.data.admin-password}" | base64 --decode`

**Import Dashboards:**
1. Navigate to Dashboards → Import
2. Import dashboard IDs:
   - **7249** - Kubernetes Cluster Monitoring
   - **12900** - Spring Boot Statistics
   - **1860** - Node Exporter Full

### View Application Logs

```bash
# TribeTalk logs
kubectl logs -f deployment/tribetalk --tail=100

# Chat Service logs
kubectl logs -f deployment/chatservice --tail=100

# Notification Service logs
kubectl logs -f deployment/notification-service --tail=100

# Frontend logs
kubectl logs -f deployment/tribe-talk-frontend --tail=100

# All pods
kubectl logs --all-containers=true --tail=100 -n default
```

---

## 🔐 AWS Secrets Manager Setup

### Create Secrets

```bash
# Database secrets
aws secretsmanager create-secret \
    --name tribetalk/database/credentials \
    --secret-string '{
        "postgres_url":"jdbc:postgresql://<DB_HOST>:5432/tribetalk",
        "postgres_username":"<DB_USERNAME>",
        "postgres_password":"<DB_PASSWORD>",
        "mongodb_uri":"mongodb://<MONGO_USER>:<MONGO_PASSWORD>@<DB_HOST>:27017/tribetalknosqldb?authSource=admin"
    }' \
    --region eu-north-1

# Application secrets
aws secretsmanager create-secret \
    --name tribetalk/app/config \
    --secret-string '{
        "github_client_id":"<YOUR_GITHUB_CLIENT_ID>",
        "github_client_secret":"<YOUR_GITHUB_CLIENT_SECRET>",
        "jwt_secret":"<RANDOM_256_BIT_SECRET>",
        "kafka_bootstrap_servers":"<KAFKA_HOST>:9092",
        "redis_host":"<REDIS_HOST>"
    }' \
    --region eu-north-1
```

---

## 🧪 Testing & Verification

### Verify Infrastructure

```bash
# Check EKS nodes
kubectl get nodes

# Check all pods
kubectl get pods --all-namespaces

# Check services
kubectl get svc

# Check ingress
kubectl get ingress
kubectl describe ingress tribetalk-ingress
```

### Test Application

```bash
# Access application
open http://k8s-default-tribetal-089de13287-2075252521.eu-north-1.elb.amazonaws.com

# Test API endpoints
curl http://k8s-default-tribetal-089de13287-2075252521.eu-north-1.elb.amazonaws.com/api/actuator/health

# Test OAuth2 flow
# Navigate to ALB URL and click "Sign in with GitHub"
```

---

## ✨ Recent Features & Improvements

### Frontend (v2.3-feather-icons)
- ✅ User profile images with FiUser icon fallback
- ✅ Bouncy animations on like/bookmark buttons
- ✅ Loading states for posts, bookmarks, messages, suggestions
- ✅ 1-on-1 chat support from SelectUser component
- ✅ WebSocket error handling for chat
- ✅ Enter key to send messages
- ✅ Logo clickable to redirect to home
- ✅ Follow button cursor pointer
- ✅ Color adjustments for better contrast
- ✅ Fixed icon display using Feather Icons only

### Backend
- ✅ Notification Service (v3.4-bulk-update): Fixed markAllAsRead MongoDB bulk update
- ✅ Async notification sending to prevent follow timeout
- ✅ WebSocket notifications with real-time delivery
- ✅ STOMP over SockJS for chat messaging

---

## 🧹 Cleanup

### Delete Kubernetes Resources

```bash
# Delete all deployments
kubectl delete -f k8s/deployments/
kubectl delete -f k8s/ingress.yaml
kubectl delete -f k8s/external-secrets.yaml

# Uninstall Helm charts
helm uninstall aws-load-balancer-controller -n kube-system
helm uninstall external-secrets -n external-secrets-system
```

### Destroy Terraform Infrastructure

```bash
cd terraform
terraform destroy
```

**⚠️ Warning:** This will delete:
- EKS cluster
- EC2 instances (databases will be lost!)
- VPC and networking
- ECR repositories
- Secrets Manager secrets

---

## 📝 Important Notes

### Current Infrastructure Specs

- **EKS Cluster**: tribetalk-eks-cluster (Kubernetes 1.31)
- **Nodes**: 3x t3.small (2 vCPU, 2GB RAM each)
- **Region**: eu-north-1 (Stockholm)
- **ALB**: k8s-default-tribetal-089de13287-2075252521.eu-north-1.elb.amazonaws.com

### Security Best Practices

1. Never commit secrets to Git
2. Use AWS Secrets Manager for production credentials
3. Enable HTTPS with ACM certificates for production
4. Implement CSRF protection for cookie-based auth
5. Use Security Groups to restrict database access

### Cost Optimization

- **EKS Cluster**: ~$73/month (control plane)
- **EC2 Instances**: ~$20/month per t3.small node (~$60 total)
- **NAT Gateway**: ~$32/month
- **ALB**: ~$16/month + data transfer
- **Total**: ~$180/month for dev environment

**Cost Saving Tips:**
- Use Spot Instances for EKS nodes
- Stop EC2 instances when not in use
- Use smaller instance types for dev
- Delete unused ALBs and EBS volumes

---

## 📚 Additional Resources

- [Terraform Documentation](https://www.terraform.io/docs)
- [Ansible Documentation](https://docs.ansible.com/)
- [Kubernetes Documentation](https://kubernetes.io/docs/)
- [AWS EKS Best Practices](https://aws.github.io/aws-eks-best-practices/)
- [Spring Boot Documentation](https://spring.io/projects/spring-boot)
- [React Documentation](https://react.dev/)
- [Vite Documentation](https://vitejs.dev/)

---

## 📄 License

This project is licensed under the MIT License.
