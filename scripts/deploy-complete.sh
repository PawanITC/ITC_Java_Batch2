#!/bin/bash
set -e

#############################################
# TribeTalk Complete Deployment Script
# Automates the entire deployment process
#############################################

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Functions
print_header() {
    echo -e "\n${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}\n"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_info() {
    echo -e "${YELLOW}ℹ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

check_command() {
    if ! command -v $1 &> /dev/null; then
        print_error "$1 is not installed"
        exit 1
    fi
    print_success "$1 is installed"
}

# Configuration
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TERRAFORM_DIR="$PROJECT_ROOT/terraform"
ANSIBLE_DIR="$PROJECT_ROOT/ansible"
K8S_DIR="$PROJECT_ROOT/k8s"

print_header "TribeTalk Deployment Script"

# Check prerequisites
print_info "Checking prerequisites..."
check_command aws
check_command kubectl
check_command terraform
check_command helm
check_command docker

# Get AWS configuration
export AWS_REGION=${AWS_REGION:-"eu-north-1"}
export AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)

print_success "AWS Account ID: $AWS_ACCOUNT_ID"
print_success "AWS Region: $AWS_REGION"

# Phase 1: Deploy Infrastructure
print_header "Phase 1: Deploying Infrastructure with Terraform"

cd "$TERRAFORM_DIR"

if [ ! -f "terraform.tfvars" ]; then
    print_error "terraform.tfvars not found!"
    print_info "Please copy terraform.tfvars.example to terraform.tfvars and configure it"
    exit 1
fi

print_info "Initializing Terraform..."
terraform init

print_info "Planning infrastructure..."
terraform plan -out=tfplan

read -p "Do you want to apply this plan? (yes/no): " APPLY_CONFIRM
if [ "$APPLY_CONFIRM" != "yes" ]; then
    print_warning "Deployment cancelled"
    exit 0
fi

print_info "Applying infrastructure (this takes 15-20 minutes)..."
terraform apply tfplan

print_success "Infrastructure deployed!"

# Save outputs
terraform output > ../infrastructure/terraform-outputs.txt

# Export important variables
export POSTGRES_IP=$(terraform output -raw postgresql_private_ip)
export MONGODB_IP=$(terraform output -raw mongodb_private_ip)
export REDIS_IP=$(terraform output -raw redis_private_ip)
export KAFKA_IP=$(terraform output kafka_broker_ips | grep -o '[0-9]\+\.[0-9]\+\.[0-9]\+\.[0-9]\+' | head -1)
export BASTION_IP=$(terraform output -raw bastion_public_ip)
export JENKINS_IP=$(terraform output -raw jenkins_public_ip)

print_info "Database IPs:"
echo "  PostgreSQL: $POSTGRES_IP"
echo "  MongoDB: $MONGODB_IP"
echo "  Redis: $REDIS_IP"
echo "  Kafka: $KAFKA_IP"

# Phase 2: Configure Kubernetes
print_header "Phase 2: Configuring Kubernetes"

print_info "Updating kubeconfig..."
aws eks update-kubeconfig --name tribetalk-eks --region $AWS_REGION

print_info "Verifying cluster access..."
kubectl get nodes

print_info "Installing External Secrets Operator..."
helm repo add external-secrets https://charts.external-secrets.io
helm repo update
helm install external-secrets external-secrets/external-secrets \
  -n external-secrets-system --create-namespace --wait

print_success "External Secrets Operator installed"

print_info "Installing AWS Load Balancer Controller..."
helm repo add eks https://aws.github.io/eks-charts
kubectl apply -f https://raw.githubusercontent.com/aws/eks-charts/master/stable/aws-load-balancer-controller/crds/crds.yaml

# Get VPC ID
VPC_ID=$(cd "$TERRAFORM_DIR" && terraform output -raw vpc_id)

helm install aws-load-balancer-controller eks/aws-load-balancer-controller \
  -n kube-system \
  --set clusterName=tribetalk-eks \
  --set region=$AWS_REGION \
  --set vpcId=$VPC_ID

print_success "AWS Load Balancer Controller installed"

print_info "Configuring External Secrets..."
cd "$K8S_DIR"
ROLE_ARN=$(cd "$TERRAFORM_DIR" && terraform output -raw secrets_access_role_arn)
cp external-secrets.yaml external-secrets.yaml.bak
sed -i.tmp "s|<SECRETS_ACCESS_ROLE_ARN>|$ROLE_ARN|g" external-secrets.yaml
kubectl apply -f external-secrets.yaml
rm -f external-secrets.yaml.tmp

print_info "Waiting for secrets to sync..."
sleep 30

kubectl get secrets | grep tribetalk
print_success "Secrets configured"

# Phase 3: Setup Databases
print_header "Phase 3: Setting up Databases with Ansible"

cd "$ANSIBLE_DIR"

print_info "Installing Python dependencies..."
pip3 install -q boto3 botocore

print_info "Testing Ansible inventory..."
ansible-inventory -i inventory/aws_ec2.yml --list > /dev/null

print_info "Deploying databases (this takes 10-15 minutes)..."
ansible-playbook -i inventory/aws_ec2.yml playbooks/setup-infrastructure.yml

print_success "Databases configured"

# Phase 4: Build and Push Docker Images
print_header "Phase 4: Building and Pushing Docker Images"

cd "$PROJECT_ROOT"

print_info "Logging into ECR..."
aws ecr get-login-password --region $AWS_REGION | \
  docker login --username AWS --password-stdin \
  $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com

# Build TribeTalk
print_info "Building TribeTalk service..."
cd tribetalk
./mvnw clean package -DskipTests -q
docker build -q -t tribetalk-service:v1.0 .
docker tag tribetalk-service:v1.0 \
  $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/tribetalk-service:v1.0
docker push $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/tribetalk-service:v1.0
print_success "TribeTalk service built and pushed"
cd ..

# Build ChatService
print_info "Building ChatService..."
cd ChatService
./mvnw clean package -DskipTests -q
docker build -q -t chatservice:v1.0 .
docker tag chatservice:v1.0 \
  $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/chatservice:v1.0
docker push $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/chatservice:v1.0
print_success "ChatService built and pushed"
cd ..

# Build Notification Service
print_info "Building Notification Service..."
cd notification-service
./mvnw clean package -DskipTests -q
docker build -q -t notification-service:v1.0 .
docker tag notification-service:v1.0 \
  $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/notification-service:v1.0
docker push $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/notification-service:v1.0
print_success "Notification Service built and pushed"
cd ..

# Build Frontend (placeholder)
print_info "Building Frontend (initial)..."
cd tribe-talk-frontend
docker build -q --build-arg VITE_API_BASE_URL="http://PLACEHOLDER" \
  -t tribe-talk-frontend:v1.0 .
docker tag tribe-talk-frontend:v1.0 \
  $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/tribe-talk-frontend:v1.0
docker push $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/tribe-talk-frontend:v1.0
print_success "Frontend built and pushed"
cd ..

# Phase 5: Deploy to Kubernetes
print_header "Phase 5: Deploying to Kubernetes"

cd "$K8S_DIR/deployments"

print_info "Updating deployment YAMLs..."
for file in tribetalk.yaml chatservice.yaml notification-service.yaml tribe-talk-frontend.yaml; do
  cp $file $file.bak
  sed -i.tmp "s|<AWS_ACCOUNT_ID>|$AWS_ACCOUNT_ID|g" $file
  sed -i.tmp "s|<AWS_REGION>|$AWS_REGION|g" $file
  sed -i.tmp "s|:latest|:v1.0|g" $file
  rm -f $file.tmp
done

print_info "Deploying services..."
kubectl apply -f tribetalk.yaml
kubectl apply -f chatservice.yaml
kubectl apply -f notification-service.yaml
kubectl apply -f tribe-talk-frontend.yaml

print_info "Waiting for pods to be ready..."
kubectl wait --for=condition=ready pod --all --timeout=300s

print_success "Services deployed"

print_info "Deploying Ingress..."
cd "$K8S_DIR"
kubectl apply -f ingress.yaml

print_info "Waiting for ALB to be provisioned (2-3 minutes)..."
sleep 180

export ALB_DNS=$(kubectl get ingress tribetalk-ingress -o jsonpath='{.status.loadBalancer.ingress[0].hostname}')

if [ -z "$ALB_DNS" ]; then
    print_error "Failed to get ALB DNS"
    exit 1
fi

print_success "ALB DNS: $ALB_DNS"
echo "$ALB_DNS" > ../infrastructure/alb-dns.txt

# Phase 6: Rebuild Frontend with ALB
print_header "Phase 6: Rebuilding Frontend with ALB DNS"

cd "$PROJECT_ROOT/tribe-talk-frontend"

print_info "Rebuilding frontend with ALB DNS..."
docker build -q --build-arg VITE_API_BASE_URL="http://$ALB_DNS" \
  -t tribe-talk-frontend:v1.1 .
docker tag tribe-talk-frontend:v1.1 \
  $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/tribe-talk-frontend:v1.1
docker push $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/tribe-talk-frontend:v1.1

print_info "Updating frontend deployment..."
kubectl set image deployment/tribe-talk-frontend \
  tribe-talk-frontend=$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/tribe-talk-frontend:v1.1

kubectl rollout status deployment/tribe-talk-frontend

print_success "Frontend updated"

# Phase 7: Verification
print_header "Phase 7: Verification"

print_info "Testing endpoints..."

# Test frontend
if curl -sf -o /dev/null http://$ALB_DNS/; then
    print_success "Frontend is accessible"
else
    print_error "Frontend is not accessible"
fi

# Test backend
if curl -sf http://$ALB_DNS/api/actuator/health | grep -q "UP"; then
    print_success "TribeTalk API is healthy"
else
    print_error "TribeTalk API is not healthy"
fi

# Test ChatService
if curl -sf http://$ALB_DNS/chat/actuator/health | grep -q "UP"; then
    print_success "ChatService is healthy"
else
    print_error "ChatService is not healthy"
fi

# Test Notification Service
if curl -sf http://$ALB_DNS/notification/actuator/health | grep -q "UP"; then
    print_success "Notification Service is healthy"
else
    print_error "Notification Service is not healthy"
fi

# Final Summary
print_header "Deployment Complete!"

cat << EOF

${GREEN}✓ TribeTalk has been successfully deployed!${NC}

${BLUE}Application URLs:${NC}
  Frontend:            http://$ALB_DNS
  TribeTalk API:       http://$ALB_DNS/api
  ChatService:         http://$ALB_DNS/chat
  Notification:        http://$ALB_DNS/notification

${BLUE}Management URLs:${NC}
  Jenkins:             http://$JENKINS_IP:8080
  Bastion SSH:         ssh -i ~/.ssh/k8-SecurityKey.pem ubuntu@$BASTION_IP

${BLUE}Database IPs (private):${NC}
  PostgreSQL:          $POSTGRES_IP
  MongoDB:             $MONGODB_IP
  Redis:               $REDIS_IP
  Kafka:               $KAFKA_IP

${BLUE}Next Steps:${NC}
  1. Update OAuth redirect URIs to: http://$ALB_DNS/callback
  2. Test the application in your browser
  3. Configure monitoring and backups
  4. Setup custom domain (optional)

${YELLOW}Important:${NC}
  - Deployment info saved to: infrastructure/deployment-info.txt
  - ALB DNS saved to: infrastructure/alb-dns.txt
  - Terraform outputs saved to: infrastructure/terraform-outputs.txt

${BLUE}Useful Commands:${NC}
  kubectl get pods                    # Check pod status
  kubectl logs deployment/tribetalk   # View logs
  kubectl get ingress                 # Check Ingress
  kubectl get hpa                     # Check autoscaling

${BLUE}To destroy everything:${NC}
  cd terraform && terraform destroy

EOF

# Save deployment info
cat > "$PROJECT_ROOT/infrastructure/deployment-info.txt" <<EOF
Deployment Date: $(date)
Environment: Production
Region: $AWS_REGION
AWS Account: $AWS_ACCOUNT_ID

EKS Cluster: tribetalk-eks
ALB DNS: $ALB_DNS

Application URLs:
- Frontend: http://$ALB_DNS
- TribeTalk API: http://$ALB_DNS/api
- ChatService: http://$ALB_DNS/chat
- Notification: http://$ALB_DNS/notification

Management:
- Jenkins: http://$JENKINS_IP:8080
- Bastion: $BASTION_IP

Database IPs:
- PostgreSQL: $POSTGRES_IP
- MongoDB: $MONGODB_IP
- Redis: $REDIS_IP
- Kafka: $KAFKA_IP
EOF

print_success "Deployment information saved to infrastructure/deployment-info.txt"

exit 0
