# TribeTalk Deployment Checklist

Complete step-by-step checklist for deploying TribeTalk from scratch. Follow this checklist to avoid common errors and ensure all components are properly configured.

---

## ✅ Pre-Deployment Checklist

### Prerequisites Verification

- [ ] AWS Account with admin access
- [ ] AWS CLI installed and configured (`aws configure`)
- [ ] Terraform >= 1.5 installed (`terraform --version`)
- [ ] Ansible >= 2.9 installed (`ansible --version`)
- [ ] kubectl installed (`kubectl version --client`)
- [ ] Docker Desktop running
- [ ] Node.js 18+ installed (`node --version`)
- [ ] Java 21 installed (`java --version`)
- [ ] Maven 3.9+ installed (`mvn --version`)
- [ ] Helm 3+ installed (`helm version`)
- [ ] eksctl installed (`eksctl version`)

### GitHub OAuth App Setup

- [ ] Create GitHub OAuth App at https://github.com/settings/developers
- [ ] Note down Client ID: `Ov23lizJ8kpXKzpZZi2P`
- [ ] Note down Client Secret
- [ ] Set Homepage URL: `http://localhost:5173` (will update later)
- [ ] Set Authorization callback URL: `http://localhost:8080/login/oauth2/code/github` (will update later)

---

## 📦 Phase 1: Terraform Infrastructure Deployment

### Step 1.1: Prepare Terraform Configuration

```bash
cd terraform

# Copy example variables
cp terraform.tfvars.example terraform.tfvars

# Edit terraform.tfvars with your values
nano terraform.tfvars
```

**Required Variables:**
```hcl
aws_region          = "eu-north-1"
project_name        = "tribetalk"
environment         = "prod"
vpc_cidr            = "10.0.0.0/16"
availability_zones  = ["eu-north-1a", "eu-north-1b"]
eks_cluster_version = "1.31"
```

- [ ] Variables file configured

### Step 1.2: Initialize and Plan

```bash
# Initialize Terraform
terraform init

# Validate configuration
terraform validate

# Create execution plan
terraform plan -out=tfplan

# Review the plan carefully
```

- [ ] Terraform initialized
- [ ] Plan reviewed (should create ~50-60 resources)

### Step 1.3: Apply Infrastructure

```bash
# Apply the plan
terraform apply tfplan

# Wait for completion (15-20 minutes)
```

- [ ] VPC created
- [ ] EKS cluster created
- [ ] EC2 instances created (database + Jenkins)
- [ ] ECR repositories created
- [ ] Secrets Manager secrets created

### Step 1.4: Capture Terraform Outputs

```bash
# Save all outputs
terraform output > ../terraform-outputs.txt

# Important outputs to note:
terraform output eks_cluster_name
terraform output database_instance_private_ip
terraform output database_instance_public_ip
terraform output ecr_tribetalk_url
terraform output ecr_frontend_url
```

**Record these values:**
- [ ] EKS Cluster Name: `_______________________`
- [ ] Database Private IP: `_______________________`
- [ ] Database Public IP: `_______________________`
- [ ] ECR URLs saved

---

## 🔧 Phase 2: Ansible Configuration

### Step 2.1: Update Ansible Inventory

```bash
cd ../ansible

# Edit inventory file
nano inventory/hosts
```

**Update with your database instance IP:**
```ini
[database_servers]
db-server ansible_host=<DATABASE_PUBLIC_IP> ansible_user=ubuntu ansible_ssh_private_key_file=~/.ssh/your-key.pem
```

- [ ] Inventory file updated with correct IP
- [ ] SSH key path configured

### Step 2.2: Test Connectivity

```bash
# Test SSH connection
ansible -i inventory/hosts database_servers -m ping

# Should return: SUCCESS
```

- [ ] Ansible can connect to database server

### Step 2.3: Run Infrastructure Playbook

```bash
# Install PostgreSQL, MongoDB, Redis
ansible-playbook -i inventory/hosts playbooks/setup-infrastructure.yml

# Wait for completion (10-15 minutes)
```

- [ ] PostgreSQL installed and running
- [ ] MongoDB installed and running
- [ ] Redis installed and running

### Step 2.4: Run Kafka Playbook

```bash
# Install and configure Kafka in KRaft mode
ansible-playbook -i inventory/hosts playbooks/setup-kafka-kraft.yml

# Wait for completion (5-10 minutes)
```

- [ ] Kafka installed and running

### Step 2.5: Verify Services

```bash
# Check all services are running
ansible -i inventory/hosts database_servers -a "systemctl status postgresql"
ansible -i inventory/hosts database_servers -a "systemctl status mongod"
ansible -i inventory/hosts database_servers -a "systemctl status redis"
ansible -i inventory/hosts database_servers -a "systemctl status kafka"
```

- [ ] All services showing "active (running)"

---

## ☸️ Phase 3: Kubernetes Setup

### Step 3.1: Configure kubectl

```bash
# Update kubeconfig
aws eks update-kubeconfig --region eu-north-1 --name tribetalk-eks-cluster

# Verify connection
kubectl get nodes

# Should show 2-4 nodes in Ready state
```

- [ ] kubectl configured
- [ ] EKS nodes are Ready

### Step 3.2: Install AWS Load Balancer Controller

```bash
cd ..

# Download IAM policy
curl -o iam_policy.json https://raw.githubusercontent.com/kubernetes-sigs/aws-load-balancer-controller/v2.7.0/docs/install/iam_policy.json

# Create IAM policy
aws iam create-policy \
    --policy-name AWSLoadBalancerControllerIAMPolicy \
    --policy-document file://iam_policy.json

# Create IAM service account
eksctl create iamserviceaccount \
  --cluster=tribetalk-eks-cluster \
  --namespace=kube-system \
  --name=aws-load-balancer-controller \
  --attach-policy-arn=arn:aws:iam::430006376054:policy/AWSLoadBalancerControllerIAMPolicy \
  --override-existing-serviceaccounts \
  --region eu-north-1 \
  --approve

# Add Helm repo
helm repo add eks https://aws.github.io/eks-charts
helm repo update

# Install controller
helm install aws-load-balancer-controller eks/aws-load-balancer-controller \
  -n kube-system \
  --set clusterName=tribetalk-eks-cluster \
  --set serviceAccount.create=false \
  --set serviceAccount.name=aws-load-balancer-controller

# Verify installation
kubectl get deployment -n kube-system aws-load-balancer-controller
```

- [ ] IAM policy created
- [ ] Service account created
- [ ] ALB Controller installed and running

### Step 3.3: Update ALB Controller IAM Permissions

**CRITICAL: This prevents ingress rule creation errors**

```bash
# Get the policy version
aws iam list-policy-versions \
    --policy-arn arn:aws:iam::430006376054:policy/AWSLoadBalancerControllerIAMPolicy

# Get current policy document
aws iam get-policy-version \
    --policy-arn arn:aws:iam::430006376054:policy/AWSLoadBalancerControllerIAMPolicy \
    --version-id v1 > alb-controller-policy.json

# Edit the policy to add SetRulePriorities permission
# Find the statement with CreateRule/DeleteRule and add:
# "elasticloadbalancing:SetRulePriorities"

# Update the policy
aws iam create-policy-version \
    --policy-arn arn:aws:iam::430006376054:policy/AWSLoadBalancerControllerIAMPolicy \
    --policy-document file://alb-controller-policy.json \
    --set-as-default
```

**Or use this complete policy document:**

```json
{
  "Effect": "Allow",
  "Action": [
    "elasticloadbalancing:CreateListener",
    "elasticloadbalancing:DeleteListener",
    "elasticloadbalancing:CreateRule",
    "elasticloadbalancing:DeleteRule",
    "elasticloadbalancing:SetRulePriorities"
  ],
  "Resource": "*"
}
```

- [ ] SetRulePriorities permission added to ALB Controller policy

### Step 3.4: Install External Secrets Operator

```bash
# Add Helm repo
helm repo add external-secrets https://charts.external-secrets.io
helm repo update

# Install External Secrets
helm install external-secrets external-secrets/external-secrets -n kube-system

# Create IAM service account for External Secrets
eksctl create iamserviceaccount \
  --name tribetalk-external-secrets \
  --namespace default \
  --cluster tribetalk-eks-cluster \
  --attach-policy-arn arn:aws:iam::aws:policy/SecretsManagerReadWrite \
  --approve \
  --region eu-north-1

# Verify installation
kubectl get pods -n kube-system | grep external-secrets
```

- [ ] External Secrets Operator installed
- [ ] Service account created

---

## 🔐 Phase 4: AWS Secrets Manager Configuration

### Step 4.1: Create Database Secrets

```bash
# Get database private IP from Terraform output
DB_PRIVATE_IP=$(terraform output -raw database_instance_private_ip)

# Create database credentials secret
aws secretsmanager create-secret \
    --name tribetalk/database/credentials \
    --secret-string "{
        \"postgres_url\":\"jdbc:postgresql://${DB_PRIVATE_IP}:5432/tribetalk\",
        \"postgres_username\":\"admin\",
        \"postgres_password\":\"admin123\",
        \"mongodb_uri\":\"mongodb://admin:admin123@${DB_PRIVATE_IP}:27017/tribetalknosqldb?authSource=admin\"
    }" \
    --region eu-north-1
```

- [ ] Database secrets created

### Step 4.2: Create Application Secrets

```bash
# Create application configuration secret
aws secretsmanager create-secret \
    --name tribetalk/app/config \
    --secret-string "{
        \"github_client_id\":\"Ov23lizJ8kpXKzpZZi2P\",
        \"github_client_secret\":\"<YOUR_GITHUB_CLIENT_SECRET>\",
        \"google_client_id\":\"\",
        \"google_client_secret\":\"\",
        \"jwt_secret\":\"change_this_to_a_long_random_secret_with_min_256_bits_for_production\",
        \"kafka_bootstrap_servers\":\"${DB_PRIVATE_IP}:9092\",
        \"redis_host\":\"${DB_PRIVATE_IP}\"
    }" \
    --region eu-north-1
```

- [ ] Application secrets created
- [ ] GitHub client secret added

### Step 4.3: Apply External Secrets Configuration

```bash
cd k8s

# Apply SecretStore and ExternalSecret
kubectl apply -f external-secrets.yaml

# Verify secrets are synced
kubectl get externalsecret
kubectl get secret tribetalk-database-secrets
kubectl get secret tribetalk-app-secrets
```

- [ ] External Secrets configured
- [ ] Kubernetes secrets created from AWS Secrets Manager

---

## 🐳 Phase 5: Build and Push Docker Images

### Step 5.1: Login to ECR

```bash
# Get ECR login
aws ecr get-login-password --region eu-north-1 | docker login --username AWS --password-stdin 430006376054.dkr.ecr.eu-north-1.amazonaws.com
```

- [ ] Logged into ECR

### Step 5.2: Build Backend Services

```bash
# Build TribeTalk Service
cd tribetalk
mvn clean package -DskipTests
docker build --platform linux/amd64 \
  -t 430006376054.dkr.ecr.eu-north-1.amazonaws.com/tribetalk-service:v1.1 \
  -t 430006376054.dkr.ecr.eu-north-1.amazonaws.com/tribetalk-service:latest .
docker push 430006376054.dkr.ecr.eu-north-1.amazonaws.com/tribetalk-service:v1.1
docker push 430006376054.dkr.ecr.eu-north-1.amazonaws.com/tribetalk-service:latest

# Build Chat Service
cd ../ChatService
mvn clean package -DskipTests
docker build --platform linux/amd64 \
  -t 430006376054.dkr.ecr.eu-north-1.amazonaws.com/chatservice:v1.0 \
  -t 430006376054.dkr.ecr.eu-north-1.amazonaws.com/chatservice:latest .
docker push 430006376054.dkr.ecr.eu-north-1.amazonaws.com/chatservice:v1.0
docker push 430006376054.dkr.ecr.eu-north-1.amazonaws.com/chatservice:latest

# Build Notification Service
cd ../notification-service
mvn clean package -DskipTests
docker build --platform linux/amd64 \
  -t 430006376054.dkr.ecr.eu-north-1.amazonaws.com/notification-service:v1.1 \
  -t 430006376054.dkr.ecr.eu-north-1.amazonaws.com/notification-service:latest .
docker push 430006376054.dkr.ecr.eu-north-1.amazonaws.com/notification-service:v1.1
docker push 430006376054.dkr.ecr.eu-north-1.amazonaws.com/notification-service:latest
```

- [ ] TribeTalk service built and pushed
- [ ] Chat service built and pushed
- [ ] Notification service built and pushed

### Step 5.3: Build Frontend (Placeholder URL First)

```bash
cd ../tribe-talk-frontend

# Build with placeholder URL (will rebuild later with actual ALB DNS)
docker build --platform linux/amd64 \
  --build-arg VITE_API_BASE_URL=http://PLACEHOLDER \
  --build-arg VITE_GITHUB_CLIENT_ID=Ov23lizJ8kpXKzpZZi2P \
  -t 430006376054.dkr.ecr.eu-north-1.amazonaws.com/tribe-talk-frontend:v1.9 \
  -t 430006376054.dkr.ecr.eu-north-1.amazonaws.com/tribe-talk-frontend:latest .

docker push 430006376054.dkr.ecr.eu-north-1.amazonaws.com/tribe-talk-frontend:v1.9
docker push 430006376054.dkr.ecr.eu-north-1.amazonaws.com/tribe-talk-frontend:latest
```

- [ ] Frontend built with placeholder URL
- [ ] Frontend pushed to ECR

---

## 🚀 Phase 6: Deploy to Kubernetes

### Step 6.1: Create Service Account

```bash
cd ../k8s

# Create service account for pods
kubectl create serviceaccount tribetalk-sa
```

- [ ] Service account created

### Step 6.2: Deploy Backend Services

```bash
# Deploy TribeTalk service
kubectl apply -f deployments/tribetalk.yaml

# Wait for deployment
kubectl rollout status deployment/tribetalk

# Deploy Chat service
kubectl apply -f deployments/chatservice.yaml
kubectl rollout status deployment/chatservice

# Deploy Notification service
kubectl apply -f deployments/notification-service.yaml
kubectl rollout status deployment/notification-service

# Verify all pods are running
kubectl get pods
```

- [ ] TribeTalk service deployed and running
- [ ] Chat service deployed and running
- [ ] Notification service deployed and running

### Step 6.3: Deploy Frontend (Initial)

```bash
# Deploy frontend with placeholder
kubectl apply -f deployments/tribe-talk-frontend.yaml
kubectl rollout status deployment/tribe-talk-frontend
```

- [ ] Frontend deployed

### Step 6.4: Deploy Ingress

```bash
# Apply ingress configuration
kubectl apply -f ingress.yaml

# Wait for ALB to be provisioned (5-10 minutes)
kubectl get ingress tribetalk-ingress -w

# Get ALB DNS name
ALB_DNS=$(kubectl get ingress tribetalk-ingress -o jsonpath='{.status.loadBalancer.ingress[0].hostname}')
echo "ALB DNS: $ALB_DNS"
```

**Record ALB DNS:**
- [ ] ALB DNS: `_______________________`

### Step 6.5: Verify ALB Listener Rules

```bash
# Get ALB ARN
ALB_ARN=$(aws elbv2 describe-load-balancers --region eu-north-1 \
  --query "LoadBalancers[?contains(DNSName, '${ALB_DNS}')].LoadBalancerArn" \
  --output text)

# Get Listener ARN
LISTENER_ARN=$(aws elbv2 describe-listeners --load-balancer-arn $ALB_ARN \
  --region eu-north-1 --query "Listeners[0].ListenerArn" --output text)

# Check listener rules
aws elbv2 describe-rules --listener-arn $LISTENER_ARN --region eu-north-1 \
  --query "Rules[*].[Priority,Conditions[0].Values[0]]" --output table
```

**Expected rules:**
- [ ] Priority 1: `/notification`
- [ ] Priority 2: `/actuator`
- [ ] Priority 3: `/oauth2`
- [ ] Priority 4: `/chat`
- [ ] Priority 5: `/auth`
- [ ] Priority 6: `/api`
- [ ] Priority 7: `/ws`
- [ ] Priority 8: `/*` (frontend catch-all)

---

## 🔄 Phase 7: Rebuild Frontend with Actual ALB DNS

### Step 7.1: Update GitHub OAuth App

- [ ] Go to https://github.com/settings/developers
- [ ] Update Homepage URL: `http://${ALB_DNS}`
- [ ] Update Authorization callback URL: `http://${ALB_DNS}/login/oauth2/code/github`
- [ ] Save changes

### Step 7.2: Rebuild and Redeploy Frontend

```bash
cd ../tribe-talk-frontend

# Rebuild with actual ALB DNS
docker build --platform linux/amd64 \
  --build-arg VITE_API_BASE_URL=http://${ALB_DNS} \
  --build-arg VITE_GITHUB_CLIENT_ID=Ov23lizJ8kpXKzpZZi2P \
  -t 430006376054.dkr.ecr.eu-north-1.amazonaws.com/tribe-talk-frontend:v1.9 .

docker push 430006376054.dkr.ecr.eu-north-1.amazonaws.com/tribe-talk-frontend:v1.9

# Restart frontend deployment to pull new image
kubectl rollout restart deployment/tribe-talk-frontend
kubectl rollout status deployment/tribe-talk-frontend
```

- [ ] Frontend rebuilt with correct ALB DNS
- [ ] Frontend redeployed

---

## ✅ Phase 8: Testing & Verification

### Step 8.1: Test Backend Endpoints

```bash
# Test health endpoint
curl http://${ALB_DNS}/actuator/health

# Expected: {"status":"UP"}

# Test OAuth2 endpoint
curl -I http://${ALB_DNS}/oauth2/authorization/github

# Expected: HTTP/1.1 302 (redirect to GitHub)

# Test notification endpoint
curl http://${ALB_DNS}/notification/api/notifications/unReadCount?recipientId=4

# Expected: 0 or 401 (if not authenticated)
```

- [ ] Health endpoint returns UP
- [ ] OAuth2 endpoint redirects to GitHub
- [ ] Notification endpoint responds

### Step 8.2: Test Frontend

```bash
# Open in browser
open http://${ALB_DNS}
```

**Manual checks:**
- [ ] Homepage loads without errors
- [ ] No console errors (check browser DevTools)
- [ ] Login form is visible
- [ ] "Sign in with GitHub" button works
- [ ] Redirects to GitHub authorization page
- [ ] No "redirect_uri is not associated" error

### Step 8.3: Test Complete OAuth Flow

- [ ] Click "Sign in with GitHub"
- [ ] Authorize the application on GitHub
- [ ] Redirected back to application
- [ ] Successfully logged in
- [ ] Can see main page/posts

### Step 8.4: Verify Database Connectivity

```bash
# Check TribeTalk logs for database connection
kubectl logs deployment/tribetalk | grep -i "database\|postgres"

# Should see successful connection messages
```

- [ ] Backend connected to PostgreSQL
- [ ] Backend connected to MongoDB
- [ ] Backend connected to Redis
- [ ] Backend connected to Kafka

---

## 🐛 Common Issues & Fixes

### Issue 1: ALB Not Creating Listener Rules

**Symptom:** Ingress shows no address, events show "AccessDenied" for SetRulePriorities

**Fix:**
```bash
# Already done in Step 3.3, but if missed:
# Update IAM policy to include elasticloadbalancing:SetRulePriorities
# Then delete and recreate ingress:
kubectl delete ingress tribetalk-ingress
kubectl apply -f ingress.yaml
```

### Issue 2: Frontend Shows "No routes matched" Error

**Symptom:** React Router warning in console

**Fix:** Already fixed in `Home.jsx` using `window.location.replace()`

### Issue 3: Backend Returns 500 on /api/users/loggedUser

**Symptom:** Frontend fails to load, 500 error

**Fix:** Already fixed in `UserController.java` with null check

### Issue 4: Notification Service 404 Error

**Symptom:** `/notification/api/notifications/unReadCount` returns 404

**Fix:** Already fixed - notification service has context-path `/notification`

### Issue 5: GitHub OAuth "redirect_uri not associated"

**Symptom:** GitHub shows error about redirect URI

**Fix:**
- Ensure GitHub OAuth App callback URL matches: `http://${ALB_DNS}/login/oauth2/code/github`
- Ensure correct client ID is used: `Ov23lizJ8kpXKzpZZi2P`
- Backend must have correct GitHub client ID in secrets

---

## 📊 Post-Deployment Monitoring

### Check Pod Status

```bash
# View all pods
kubectl get pods

# Check pod logs
kubectl logs -f deployment/tribetalk
kubectl logs -f deployment/chatservice
kubectl logs -f deployment/notification-service
kubectl logs -f deployment/tribe-talk-frontend
```

### Check Services

```bash
# View all services
kubectl get svc

# Check ingress
kubectl get ingress
kubectl describe ingress tribetalk-ingress
```

### Check ALB

```bash
# View ALB in AWS Console
# Or use CLI:
aws elbv2 describe-load-balancers --region eu-north-1
aws elbv2 describe-target-groups --region eu-north-1
```

---

## 🧹 Cleanup (When Needed)

### Delete Kubernetes Resources

```bash
kubectl delete -f k8s/deployments/
kubectl delete -f k8s/ingress.yaml
kubectl delete -f k8s/external-secrets.yaml
```

### Uninstall Helm Charts

```bash
helm uninstall aws-load-balancer-controller -n kube-system
helm uninstall external-secrets -n kube-system
```

### Destroy Terraform Infrastructure

```bash
cd terraform
terraform destroy
# Type: yes
```

---

## 📝 Important Notes

1. **Always update GitHub OAuth callback URL** after getting ALB DNS
2. **ALB Controller needs SetRulePriorities permission** - critical for ingress
3. **Frontend must be rebuilt** with actual ALB DNS, not placeholder
4. **Backend null checks** are essential for unauthenticated requests
5. **Notification service context-path** must be `/notification`
6. **External Secrets** must sync before pods start
7. **Database private IP** must be used in secrets, not public IP

---

## ✅ Final Checklist

- [ ] All infrastructure deployed via Terraform
- [ ] All services configured via Ansible
- [ ] All Docker images built and pushed
- [ ] All Kubernetes resources deployed
- [ ] ALB provisioned with correct listener rules
- [ ] Frontend rebuilt with actual ALB DNS
- [ ] GitHub OAuth configured correctly
- [ ] Application accessible at ALB DNS
- [ ] OAuth login flow working
- [ ] No console errors
- [ ] All backend services healthy

---

## 🎉 Success Criteria

Your deployment is successful when:

✅ Homepage loads at `http://${ALB_DNS}`  
✅ No JavaScript errors in browser console  
✅ "Sign in with GitHub" redirects to GitHub  
✅ After GitHub authorization, redirected back to app  
✅ Successfully logged in and can see main page  
✅ All backend services show "Running" status  
✅ All pods are in "Running" state  
✅ ALB health checks passing  

---

**Deployment Time Estimate:**
- Terraform: 15-20 minutes
- Ansible: 15-20 minutes
- Docker builds: 10-15 minutes
- Kubernetes deployment: 10-15 minutes
- **Total: ~60-90 minutes**

**Last Updated:** 2025-12-11  
**Version:** 1.9 (includes all fixes and optimizations)
