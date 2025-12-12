# TribeTalk - Social Media Platform

A production-grade Twitter-like social media platform built with Spring Boot microservices, React frontend, and deployed on AWS EKS using Kubernetes.

## 🏗️ Architecture Overview

### Backend Services
- **TribeTalk Service** (Port 8080) - Main API service for posts, users, authentication
- **Chat Service** (Port 8081) - Real-time messaging with WebSocket
- **Notification Service** (Port 8082) - Push notifications via Kafka

### Frontend
- **React SPA** - Modern UI with Vite, served via Nginx

### Infrastructure
- **AWS EKS** - Kubernetes cluster for container orchestration
- **PostgreSQL** - Relational database for user data, posts
- **MongoDB** - NoSQL database for notifications, chat history
- **Redis** - Caching and session management
- **Kafka (KRaft)** - Event streaming for notifications
- **AWS ALB** - Application Load Balancer with Ingress Controller
- **AWS ECR** - Container registry for Docker images
- **AWS Secrets Manager** - Secure credential storage

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
│   └── external-secrets.yaml    # External Secrets Operator
└── scripts/                      # Deployment scripts
```

---

## 🚀 Infrastructure Setup

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

---

## 📦 Part 1: Terraform Infrastructure

Terraform provisions the following AWS resources:

### What Terraform Creates

1. **VPC & Networking**
   - VPC with CIDR 10.0.0.0/16
   - 2 Public subnets (for ALB, NAT)
   - 2 Private subnets (for EKS nodes, databases)
   - Internet Gateway
   - NAT Gateway for private subnet internet access
   - Route tables

2. **EKS Cluster**
   - Kubernetes version 1.31
   - Managed node group (t3.medium instances)
   - Auto-scaling: 2-4 nodes
   - IAM roles and policies
   - AWS Load Balancer Controller

3. **EC2 Instances**
   - Database server (t3.medium) for PostgreSQL, MongoDB, Redis, Kafka
   - Jenkins server (t3.medium) for CI/CD
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
   - Kafka/Redis connection strings

### Terraform Commands

```bash
# Navigate to terraform directory
cd terraform

# Initialize Terraform (download providers)
terraform init

# Review the infrastructure plan
terraform plan -out=tfplan

# Apply the infrastructure
terraform apply tfplan

# View outputs (EKS cluster name, ECR URLs, etc.)
terraform output

# Destroy infrastructure (when needed)
terraform destroy
```

### Important Terraform Outputs

After `terraform apply`, note these outputs:

```bash
# EKS Cluster Name
eks_cluster_name = "tribetalk-eks-cluster"

# ECR Repository URLs
ecr_tribetalk_url = "430006376054.dkr.ecr.eu-north-1.amazonaws.com/tribetalk-service"
ecr_frontend_url = "430006376054.dkr.ecr.eu-north-1.amazonaws.com/tribe-talk-frontend"

# Database EC2 Instance
database_instance_public_ip = "13.x.x.x"
database_instance_private_ip = "10.0.10.95"

# Jenkins Instance
jenkins_instance_public_ip = "13.x.x.x"
```

### Configure kubectl for EKS

```bash
# Update kubeconfig to connect to EKS cluster
aws eks update-kubeconfig --region eu-north-1 --name tribetalk-eks-cluster

# Verify connection
kubectl get nodes
```

---

## 🔧 Part 2: Ansible Configuration

Ansible configures the EC2 database instance with all required services.

### What Ansible Installs

1. **PostgreSQL 15**
   - Database: `tribetalk`
   - User: `admin` / Password: `admin123`
   - Port: 5432
   - Configured for remote connections

2. **MongoDB 7.0**
   - Database: `tribetalknosqldb`
   - User: `admin` / Password: `admin123`
   - Port: 27017
   - Authentication enabled

3. **Redis 7.2**
   - Port: 6379
   - No authentication (internal network)
   - Persistence enabled

4. **Kafka (KRaft Mode)**
   - Port: 9092
   - No Zookeeper required
   - Topics: `notifications-topic`
   - Configured for external access

### Ansible Commands

```bash
# Navigate to ansible directory
cd ansible

# Update inventory with EC2 instance IP
# Edit: ansible/inventory/hosts
[database_servers]
db-server ansible_host=<DATABASE_INSTANCE_PUBLIC_IP> ansible_user=ubuntu

# Test connectivity
ansible -i inventory/hosts database_servers -m ping

# Run infrastructure setup playbook
ansible-playbook -i inventory/hosts playbooks/setup-infrastructure.yml

# Run Kafka-specific setup
ansible-playbook -i inventory/hosts playbooks/setup-kafka-kraft.yml

# Verify services are running
ansible -i inventory/hosts database_servers -a "systemctl status postgresql"
ansible -i inventory/hosts database_servers -a "systemctl status mongod"
ansible -i inventory/hosts database_servers -a "systemctl status redis"
ansible -i inventory/hosts database_servers -a "systemctl status kafka"
```

### Ansible Playbook Details

**`setup-infrastructure.yml`**
- Installs PostgreSQL, MongoDB, Redis
- Configures databases with users and permissions
- Sets up firewall rules
- Enables services to start on boot

**`setup-kafka-kraft.yml`**
- Installs Java 17 (Kafka requirement)
- Downloads and configures Kafka in KRaft mode
- Creates systemd service
- Configures listeners for external access
- Creates notification topics

---

## 🐳 Part 3: Build and Push Docker Images

### Backend Services

```bash
# 1. Build TribeTalk Service
cd tribetalk
mvn clean package -DskipTests
docker build --platform linux/amd64 -t 430006376054.dkr.ecr.eu-north-1.amazonaws.com/tribetalk-service:v1.1 .

# 2. Build Chat Service
cd ../ChatService
mvn clean package -DskipTests
docker build --platform linux/amd64 -t 430006376054.dkr.ecr.eu-north-1.amazonaws.com/chatservice:v1.0 .

# 3. Build Notification Service
cd ../notification-service
mvn clean package -DskipTests
docker build --platform linux/amd64 -t 430006376054.dkr.ecr.eu-north-1.amazonaws.com/notification-service:v1.1 .
```

### Frontend

```bash
cd tribe-talk-frontend

# Build with production API URL
docker build --platform linux/amd64 \
  --build-arg VITE_API_BASE_URL=http://<ALB-DNS> \
  --build-arg VITE_GITHUB_CLIENT_ID=<YOUR_GITHUB_CLIENT_ID> \
  -t 430006376054.dkr.ecr.eu-north-1.amazonaws.com/tribe-talk-frontend:v1.9 .
```

### Push to ECR

```bash
# Login to ECR
aws ecr get-login-password --region eu-north-1 | docker login --username AWS --password-stdin 430006376054.dkr.ecr.eu-north-1.amazonaws.com

# Push all images
docker push 430006376054.dkr.ecr.eu-north-1.amazonaws.com/tribetalk-service:v1.1
docker push 430006376054.dkr.ecr.eu-north-1.amazonaws.com/chatservice:v1.0
docker push 430006376054.dkr.ecr.eu-north-1.amazonaws.com/notification-service:v1.1
docker push 430006376054.dkr.ecr.eu-north-1.amazonaws.com/tribe-talk-frontend:v1.9
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
helm install external-secrets external-secrets/external-secrets -n kube-system

# Create IAM role for External Secrets
eksctl create iamserviceaccount \
  --name tribetalk-external-secrets \
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
# Create Kubernetes secrets
kubectl apply -f k8s/secrets/

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
```

### Get Application URL

```bash
# Get ALB DNS name
kubectl get ingress tribetalk-ingress -o jsonpath='{.status.loadBalancer.ingress[0].hostname}'

# Example output:
# k8s-default-tribetal-089de13287-2075252521.eu-north-1.elb.amazonaws.com
```

---

## 🔐 AWS Secrets Manager Setup

### Create Secrets

```bash
# Database secrets
aws secretsmanager create-secret \
    --name tribetalk/database/credentials \
    --secret-string '{
        "postgres_url":"jdbc:postgresql://10.0.10.95:5432/tribetalk",
        "postgres_username":"admin",
        "postgres_password":"admin123",
        "mongodb_uri":"mongodb://admin:admin123@10.0.10.95:27017/tribetalknosqldb?authSource=admin"
    }' \
    --region eu-north-1

# Application secrets
aws secretsmanager create-secret \
    --name tribetalk/app/config \
    --secret-string '{
        "github_client_id":"Ov23lizJ8kpXKzpZZi2P",
        "github_client_secret":"<YOUR_SECRET>",
        "jwt_secret":"<RANDOM_256_BIT_SECRET>",
        "kafka_bootstrap_servers":"10.0.10.95:9092",
        "redis_host":"10.0.10.95"
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

# Check ingress and ALB
kubectl get ingress
kubectl describe ingress tribetalk-ingress
```

### Verify Database Connectivity

```bash
# SSH into database instance
ssh -i <your-key.pem> ubuntu@<DATABASE_INSTANCE_IP>

# Test PostgreSQL
psql -U admin -d tribetalk -h localhost

# Test MongoDB
mongosh mongodb://admin:admin123@localhost:27017/tribetalknosqldb?authSource=admin

# Test Redis
redis-cli ping

# Test Kafka
kafka-topics.sh --bootstrap-server localhost:9092 --list
```

### Test Application

```bash
# Access application
open http://<ALB-DNS>

# Test API endpoints
curl http://<ALB-DNS>/actuator/health
curl http://<ALB-DNS>/api/auth/validateUser

# Test OAuth2 flow
# Navigate to: http://<ALB-DNS> and click "Sign in with GitHub"
```

---

## 📊 Monitoring & Logs

### View Logs

```bash
# Application logs
kubectl logs -f deployment/tribetalk
kubectl logs -f deployment/chatservice
kubectl logs -f deployment/notification-service
kubectl logs -f deployment/tribe-talk-frontend

# Ingress controller logs
kubectl logs -n kube-system deployment/aws-load-balancer-controller
```

### Metrics

```bash
# Access Prometheus metrics
curl http://<ALB-DNS>/actuator/prometheus
```

---

## 🔄 Update Deployment

### Update Backend Service

```bash
# Build new version
cd tribetalk
mvn clean package -DskipTests
docker build --platform linux/amd64 -t 430006376054.dkr.ecr.eu-north-1.amazonaws.com/tribetalk-service:v1.2 .
docker push 430006376054.dkr.ecr.eu-north-1.amazonaws.com/tribetalk-service:v1.2

# Update deployment
kubectl set image deployment/tribetalk tribetalk=430006376054.dkr.ecr.eu-north-1.amazonaws.com/tribetalk-service:v1.2

# Or edit deployment YAML and apply
kubectl apply -f k8s/deployments/tribetalk.yaml

# Watch rollout
kubectl rollout status deployment/tribetalk
```

### Update Frontend

```bash
# Build new version
cd tribe-talk-frontend
docker build --platform linux/amd64 \
  --build-arg VITE_API_BASE_URL=http://<ALB-DNS> \
  --build-arg VITE_GITHUB_CLIENT_ID=<CLIENT_ID> \
  -t 430006376054.dkr.ecr.eu-north-1.amazonaws.com/tribe-talk-frontend:v2.0 .

docker push 430006376054.dkr.ecr.eu-north-1.amazonaws.com/tribe-talk-frontend:v2.0

# Update deployment
kubectl set image deployment/tribe-talk-frontend tribe-talk-frontend=430006376054.dkr.ecr.eu-north-1.amazonaws.com/tribe-talk-frontend:v2.0
```

---

## 🧹 Cleanup

### Delete Kubernetes Resources

```bash
# Delete all deployments
kubectl delete -f k8s/deployments/
kubectl delete -f k8s/ingress.yaml

# Delete External Secrets
kubectl delete -f k8s/external-secrets.yaml

# Uninstall Helm charts
helm uninstall aws-load-balancer-controller -n kube-system
helm uninstall external-secrets -n kube-system
```

### Destroy Terraform Infrastructure

```bash
cd terraform
terraform destroy

# Confirm with: yes
```

**⚠️ Warning:** This will delete:
- EKS cluster
- EC2 instances (databases will be lost!)
- VPC and networking
- ECR repositories
- Secrets Manager secrets

---

## 📝 Important Notes

### Security Best Practices

1. **Never commit secrets** to Git
2. Use **AWS Secrets Manager** for production credentials
3. Enable **HTTPS** with ACM certificates for production
4. Implement **CSRF protection** for cookie-based auth
5. Use **Security Groups** to restrict database access
6. Enable **VPC Flow Logs** for network monitoring

### Cost Optimization

- **EKS Cluster**: ~$73/month (control plane)
- **EC2 Instances**: ~$30/month per t3.medium
- **NAT Gateway**: ~$32/month
- **ALB**: ~$16/month + data transfer
- **Total**: ~$150-200/month for dev environment

**Cost Saving Tips:**
- Use Spot Instances for EKS nodes
- Stop EC2 instances when not in use
- Use smaller instance types for dev
- Delete unused ALBs and EBS volumes

### Production Considerations

1. **High Availability**
   - Multi-AZ deployment
   - RDS instead of EC2 PostgreSQL
   - Amazon MQ instead of self-hosted Kafka
   - ElastiCache instead of EC2 Redis

2. **Backup & Recovery**
   - Enable RDS automated backups
   - S3 backups for MongoDB
   - EBS snapshots for volumes

3. **Monitoring**
   - CloudWatch for metrics and logs
   - X-Ray for distributed tracing
   - Prometheus + Grafana for custom metrics

4. **CI/CD**
   - GitHub Actions or Jenkins pipeline
   - Automated testing
   - Blue-green deployments
   - Rollback strategies

---

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

---

## 📄 License

This project is licensed under the MIT License.

---

## 👥 Team

- **Backend Development**: Spring Boot microservices
- **Frontend Development**: React SPA
- **DevOps**: Terraform, Ansible, Kubernetes
- **Infrastructure**: AWS EKS, EC2, ALB

---

## 📚 Additional Resources

- [Terraform Documentation](https://www.terraform.io/docs)
- [Ansible Documentation](https://docs.ansible.com/)
- [Kubernetes Documentation](https://kubernetes.io/docs/)
- [AWS EKS Best Practices](https://aws.github.io/aws-eks-best-practices/)
- [Spring Boot Documentation](https://spring.io/projects/spring-boot)
- [React Documentation](https://react.dev/)
