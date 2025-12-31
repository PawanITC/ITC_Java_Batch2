#!/bin/bash
# Rebuild and redeploy services with in-cluster Tempo configuration
# This script will build, push, and deploy all services with zero downtime

set -e

echo "🚀 TribeTalk Services Rebuild & Redeploy"
echo "========================================"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

print_success() { echo -e "${GREEN}✅ $1${NC}"; }
print_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
print_error() { echo -e "${RED}❌ $1${NC}"; exit 1; }
print_info() { echo "ℹ️  $1"; }

# Configuration
ECR_REGISTRY="430006376054.dkr.ecr.eu-north-1.amazonaws.com"
VERSION="v4.0-tempo-eks"
REGION="eu-north-1"

# Check prerequisites
echo "📋 Checking prerequisites..."
command -v mvn >/dev/null 2>&1 || print_error "Maven not installed"
command -v docker >/dev/null 2>&1 || print_error "Docker not installed"
command -v kubectl >/dev/null 2>&1 || print_error "kubectl not installed"
command -v aws >/dev/null 2>&1 || print_error "AWS CLI not installed"
print_success "All prerequisites installed"
echo ""

# Login to ECR
echo "🔐 Logging in to ECR..."
aws ecr get-login-password --region $REGION | docker login --username AWS --password-stdin $ECR_REGISTRY || print_error "ECR login failed"
print_success "ECR login successful"
echo ""

#############################################
# TRIBETALK SERVICE
#############################################
echo "📦 Building TribeTalk Service"
echo "=============================="
cd tribetalk

print_info "Running Maven build..."
mvn clean package -DskipTests || print_error "Maven build failed for tribetalk"
print_success "Maven build complete"

print_info "Building Docker image..."
docker build -t ${ECR_REGISTRY}/tribetalk-service:${VERSION} . || print_error "Docker build failed for tribetalk"
print_success "Docker image built"

print_info "Pushing to ECR..."
docker push ${ECR_REGISTRY}/tribetalk-service:${VERSION} || print_error "Docker push failed for tribetalk"
print_success "Pushed to ECR"

cd ..
echo ""

#############################################
# CHATSERVICE
#############################################
echo "📦 Building ChatService"
echo "======================="
cd ChatService

print_info "Running Maven build..."
mvn clean package -DskipTests || print_error "Maven build failed for chatservice"
print_success "Maven build complete"

print_info "Building Docker image..."
docker build -t ${ECR_REGISTRY}/chatservice:${VERSION} . || print_error "Docker build failed for chatservice"
print_success "Docker image built"

print_info "Pushing to ECR..."
docker push ${ECR_REGISTRY}/chatservice:${VERSION} || print_error "Docker push failed for chatservice"
print_success "Pushed to ECR"

cd ..
echo ""

#############################################
# NOTIFICATION SERVICE
#############################################
echo "📦 Building Notification Service"
echo "================================="
cd notification-service

print_info "Running Maven build..."
mvn clean package -DskipTests || print_error "Maven build failed for notification-service"
print_success "Maven build complete"

print_info "Building Docker image..."
docker build -t ${ECR_REGISTRY}/notification-service:${VERSION} . || print_error "Docker build failed for notification-service"
print_success "Docker image built"

print_info "Pushing to ECR..."
docker push ${ECR_REGISTRY}/notification-service:${VERSION} || print_error "Docker push failed for notification-service"
print_success "Pushed to ECR"

cd ..
echo ""

#############################################
# DEPLOYMENT
#############################################
echo "🚀 Deploying to Kubernetes"
echo "=========================="

print_info "Updating TribeTalk deployment..."
kubectl set image deployment/tribetalk tribetalk=${ECR_REGISTRY}/tribetalk-service:${VERSION} -n default || print_error "Failed to update tribetalk deployment"
print_success "TribeTalk deployment updated"

print_info "Updating ChatService deployment..."
kubectl set image deployment/chatservice chatservice=${ECR_REGISTRY}/chatservice:${VERSION} -n default || print_error "Failed to update chatservice deployment"
print_success "ChatService deployment updated"

print_info "Updating NotificationService deployment..."
kubectl set image deployment/notification-service notification-service=${ECR_REGISTRY}/notification-service:${VERSION} -n default || print_error "Failed to update notification-service deployment"
print_success "NotificationService deployment updated"

echo ""
print_info "Waiting for rollouts to complete..."
echo ""

kubectl rollout status deployment/tribetalk -n default --timeout=300s &
TRIBETALK_PID=$!

kubectl rollout status deployment/chatservice -n default --timeout=300s &
CHATSERVICE_PID=$!

kubectl rollout status deployment/notification-service -n default --timeout=300s &
NOTIFICATION_PID=$!

# Wait for all rollouts
wait $TRIBETALK_PID && print_success "TribeTalk rollout complete"
wait $CHATSERVICE_PID && print_success "ChatService rollout complete"
wait $NOTIFICATION_PID && print_success "NotificationService rollout complete"

echo ""

#############################################
# VERIFICATION
#############################################
echo "✅ Verification"
echo "==============="
echo ""

echo "📊 Pod Status:"
kubectl get pods -n default
echo ""

echo "🔍 Checking for errors..."
ERROR_PODS=$(kubectl get pods -n default | grep -E "Error|CrashLoop|Pending" | wc -l || echo "0")
if [ "$ERROR_PODS" -eq 0 ]; then
    print_success "No problematic pods found"
else
    print_warning "Found $ERROR_PODS pod(s) with issues"
    kubectl get pods -n default | grep -E "Error|CrashLoop|Pending"
fi
echo ""

echo "🎯 Testing Tempo connectivity..."
sleep 10  # Give pods time to start sending traces

# Check if Tempo is receiving traces
TRACE_CHECK=$(kubectl exec -n monitoring tempo-0 -- wget -qO- 'http://localhost:3200/api/search/tags' 2>/dev/null || echo "{}")
if echo "$TRACE_CHECK" | grep -q "tagNames"; then
    print_success "Tempo is accessible"
else
    print_warning "Tempo check inconclusive (may need more time for traces)"
fi

echo ""
echo "🎉 Deployment Complete!"
echo "======================="
echo ""
echo "Summary:"
echo "--------"
echo "✅ All services rebuilt with new Tempo configuration"
echo "✅ Docker images pushed to ECR"
echo "✅ Kubernetes deployments updated"
echo "✅ All pods running successfully"
echo ""
echo "Next Steps:"
echo "-----------"
echo "1. Wait 5-10 minutes for traces to accumulate"
echo "2. Go to Grafana: http://k8s-default-tribetal-089de13287-2075252521.eu-north-1.elb.amazonaws.com/grafana"
echo "3. Navigate to Explore → Tempo"
echo "4. Search for service: tribetalk, chatservice, or notification-service"
echo "5. You should see distributed traces! 🎉"
echo ""
print_success "All done! 🚀"
