# TribeTalk EKS + Jenkins Deployment Guide

This guide provides step-by-step instructions for deploying the TribeTalk microservices platform on Amazon EKS with Jenkins CI/CD.

## Prerequisites

- AWS CLI configured with appropriate credentials
- kubectl installed
- Terraform >= 1.5.0
- Helm 3.x (for AWS Load Balancer Controller)
- Docker (for local testing)

---

## Phase 1: Deploy Infrastructure with Terraform

### Step 1: Update Terraform Variables

```bash
cd terraform
cp terraform.tfvars.example terraform.tfvars
```

Edit `terraform.tfvars`:
```hcl
aws_region = "us-east-1"
environment = "dev"
key_pair_name = "tribetalk-key"
db_password = "YourSecurePassword123!"
kafka_cluster_size = 1  # Cost optimization
enable_eks = true
```

### Step 2: Deploy Infrastructure

```bash
terraform init
terraform plan
terraform apply

# Save outputs
terraform output > ../infrastructure/terraform-outputs.txt
```

**Resources Created**:
- EKS cluster with 2 t3.medium nodes
- ECR repositories for all microservices
- Jenkins EC2 instance
- PostgreSQL, MongoDB, Redis, Kafka (single node) on EC2
- VPC, subnets, security groups

**Time**: ~15-20 minutes

---

## Phase 2: Configure EKS Cluster

### Step 1: Update kubeconfig

```bash
aws eks update-kubeconfig --name tribetalk-eks --region us-east-1
kubectl get nodes
```

### Step 2: Install AWS Load Balancer Controller

```bash
# Add EKS Helm repository
helm repo add eks https://aws.github.io/eks-charts
helm repo update

# Install AWS Load Balancer Controller
kubectl apply -f https://raw.githubusercontent.com/aws/eks-charts/master/stable/aws-load-balancer-controller/crds/crds.yaml

helm install aws-load-balancer-controller eks/aws-load-balancer-controller \
  -n kube-system \
  --set clusterName=tribetalk-eks \
  --set serviceAccount.create=true \
  --set serviceAccount.name=aws-load-balancer-controller
```

### Step 3: Verify Installation

```bash
kubectl get deployment -n kube-system aws-load-balancer-controller
kubectl logs -n kube-system deployment/aws-load-balancer-controller
```

---

## Phase 3: Setup Databases with Ansible

```bash
cd ../ansible

# Setup PostgreSQL
ansible-playbook -i inventory/aws_ec2.yml roles/postgresql/tasks/main.yml

# Setup MongoDB
ansible-playbook -i inventory/aws_ec2.yml roles/mongodb/tasks/main.yml

# Setup Redis
ansible-playbook -i inventory/aws_ec2.yml roles/redis/tasks/main.yml

# Setup Kafka (single node)
ansible-playbook -i inventory/aws_ec2.yml playbooks/setup-kafka-kraft.yml
```

**Time**: ~15 minutes

---

## Phase 4: Configure Jenkins

### Step 1: Access Jenkins

```bash
# Get Jenkins public IP
terraform output jenkins_public_ip

# Get initial admin password
ssh -i ~/.ssh/tribetalk-key.pem ubuntu@<jenkins-ip> \
  "sudo cat /var/lib/jenkins/secrets/initialAdminPassword"
```

Access Jenkins: `http://<jenkins-ip>:8080`

### Step 2: Install Plugins

1. Complete initial setup wizard
2. Install suggested plugins
3. Install additional plugins from `jenkins/config/plugins.txt`:
   - AWS Credentials
   - Amazon ECR
   - Kubernetes CLI
   - Docker Pipeline

### Step 3: Configure AWS Credentials

1. Go to: Manage Jenkins → Manage Credentials
2. Add AWS credentials:
   - Kind: AWS Credentials
   - ID: `aws-credentials`
   - Access Key ID: (from IAM)
   - Secret Access Key: (from IAM)

### Step 4: Configure kubectl

```bash
# SSH into Jenkins server
ssh -i ~/.ssh/tribetalk-key.pem ubuntu@<jenkins-ip>

# Configure kubectl (already done via user data)
aws eks update-kubeconfig --name tribetalk-eks --region us-east-1
kubectl get nodes

# Test access
kubectl get pods -A
```

---

## Phase 5: Create Kubernetes Secrets and ConfigMap

### Step 1: Get Database IPs

```bash
cd terraform
terraform output postgresql_private_ip
terraform output mongodb_private_ip
terraform output redis_private_ip
terraform output kafka_broker_ips
```

### Step 2: Update ConfigMap

Edit `k8s/configmap.yaml` and replace placeholders:
```yaml
postgres.url: "jdbc:postgresql://10.0.10.x:5432/tribetalk"
mongodb.host: "10.0.10.y"
redis.host: "10.0.10.z"
kafka.bootstrap-servers: "10.0.10.w:9092"
```

Apply:
```bash
kubectl apply -f k8s/configmap.yaml
```

### Step 3: Create Secrets

```bash
# Copy template
cp k8s/secrets.yaml.template k8s/secrets.yaml

# Edit secrets.yaml with actual values
# Then apply
kubectl apply -f k8s/secrets.yaml

# Delete the file
rm k8s/secrets.yaml
```

Or create from command line:
```bash
kubectl create secret generic tribetalk-secrets \
  --from-literal=postgres.username=admin \
  --from-literal=postgres.password=YourPassword \
  --from-literal=mongodb.uri=mongodb://admin:YourPassword@10.0.10.y:27017/tribetalknosqldb?authSource=admin \
  --from-literal=jwt.secret=YourLongRandomSecret
```

---

## Phase 6: Build and Push Docker Images

### Option A: Using Jenkins Pipeline

1. Create pipeline jobs in Jenkins (or use JCasC)
2. Trigger builds for each service
3. Jenkins will automatically:
   - Build JAR
   - Build Docker image
   - Push to ECR
   - Deploy to EKS

### Option B: Manual Build

```bash
# Get ECR login
aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-east-1.amazonaws.com

# Build and push TribeTalk
cd tribetalk
docker build -t tribetalk-service:v1.0 .
docker tag tribetalk-service:v1.0 <account-id>.dkr.ecr.us-east-1.amazonaws.com/tribetalk-service:v1.0
docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/tribetalk-service:v1.0

# Repeat for ChatService and Notification Service
```

---

## Phase 7: Deploy to EKS

### Step 1: Update Image References

Edit deployment files in `k8s/deployments/` and replace:
```yaml
image: <AWS_ACCOUNT_ID>.dkr.ecr.<AWS_REGION>.amazonaws.com/tribetalk-service:v1.0
```

### Step 2: Deploy Microservices

```bash
kubectl apply -f k8s/deployments/tribetalk.yaml
kubectl apply -f k8s/deployments/chatservice.yaml
kubectl apply -f k8s/deployments/notification-service.yaml
```

### Step 3: Deploy Ingress

```bash
kubectl apply -f k8s/ingress.yaml
```

### Step 4: Verify Deployment

```bash
# Check pods
kubectl get pods

# Check services
kubectl get svc

# Check ingress
kubectl get ingress

# Get ALB DNS name
kubectl get ingress tribetalk-ingress -o jsonpath='{.status.loadBalancer.ingress[0].hostname}'
```

---

## Phase 8: Verify Application

### Test Endpoints

```bash
# Get ALB URL
ALB_URL=$(kubectl get ingress tribetalk-ingress -o jsonpath='{.status.loadBalancer.ingress[0].hostname}')

# Test TribeTalk
curl http://$ALB_URL/actuator/health

# Test ChatService
curl http://$ALB_URL/chat/actuator/health

# Test Notification Service
curl http://$ALB_URL/notification/actuator/health
```

---

## Cost Optimization Summary

**Monthly Costs** (us-east-1):

| Resource | Type | Quantity | Monthly Cost |
|----------|------|----------|--------------|
| EKS Control Plane | - | 1 | $73.00 |
| EKS Nodes | t3.medium | 2 | $60.48 |
| Jenkins | t3.medium | 1 | $15.18 |
| PostgreSQL | t3.small | 1 | $15.18 |
| MongoDB | t3.small | 1 | $15.18 |
| Redis | t3.small | 1 | $15.18 |
| Kafka | t3.small | 1 | $15.18 |
| NAT Gateway | - | 1 | $32.40 |
| ALB | - | 1 | $16.20 |
| **Total** | | | **~$258/month** |

**Further Optimization**:
- Use Spot Instances for EKS nodes: -$30/month
- Stop Jenkins when not in use: -$15/month
- **Optimized total**: ~$213/month

---

## Troubleshooting

### EKS Nodes Not Ready

```bash
kubectl get nodes
kubectl describe node <node-name>

# Check node group
aws eks describe-nodegroup --cluster-name tribetalk-eks --nodegroup-name tribetalk-node-group
```

### Pods Not Starting

```bash
kubectl get pods
kubectl describe pod <pod-name>
kubectl logs <pod-name>

# Check events
kubectl get events --sort-by='.lastTimestamp'
```

### Cannot Connect to Databases

```bash
# Test from a pod
kubectl run -it --rm debug --image=ubuntu --restart=Never -- bash
apt-get update && apt-get install -y postgresql-client mongodb-clients redis-tools
psql -h <postgres-ip> -U admin -d tribetalk
```

### Jenkins Cannot Push to ECR

```bash
# Verify IAM role
aws iam get-role --role-name tribetalk-jenkins-role

# Test ECR login from Jenkins
ssh -i ~/.ssh/tribetalk-key.pem ubuntu@<jenkins-ip>
aws ecr get-login-password --region us-east-1
```

### Ingress Not Creating ALB

```bash
# Check AWS Load Balancer Controller logs
kubectl logs -n kube-system deployment/aws-load-balancer-controller

# Verify IAM role for service account
kubectl describe sa aws-load-balancer-controller -n kube-system
```

---

## Next Steps

1. **Setup CI/CD**: Configure GitHub webhooks to trigger Jenkins builds
2. **Enable HTTPS**: Add ACM certificate to Ingress
3. **Monitoring**: Install Prometheus and Grafana
4. **Logging**: Configure Fluent Bit for CloudWatch Logs
5. **Auto Scaling**: Configure HPA (Horizontal Pod Autoscaler)
6. **Backup**: Implement database backup strategies

---

## Cleanup

```bash
# Delete Kubernetes resources
kubectl delete -f k8s/

# Destroy Terraform infrastructure
cd terraform
terraform destroy
```

**Warning**: This will delete all resources including databases!
