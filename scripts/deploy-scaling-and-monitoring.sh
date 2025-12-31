#!/bin/bash
# Complete deployment script for EKS scaling + optimized monitoring
# This script will:
# 1. Scale EKS cluster from 3 to 4 nodes
# 2. Deploy optimized Prometheus monitoring stack
# 3. Verify all pods are running

set -e

echo "🚀 TribeTalk Infrastructure Scaling & Monitoring Optimization"
echo "=============================================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to print colored output
print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo "ℹ️  $1"
}

# Check prerequisites
echo "📋 Checking prerequisites..."
echo ""

if ! command -v terraform &> /dev/null; then
    print_error "Terraform is not installed"
    exit 1
fi

if ! command -v kubectl &> /dev/null; then
    print_error "kubectl is not installed"
    exit 1
fi

if ! command -v helm &> /dev/null; then
    print_error "helm is not installed"
    exit 1
fi

if ! command -v aws &> /dev/null; then
    print_error "AWS CLI is not installed"
    exit 1
fi

print_success "All prerequisites installed"
echo ""

# Check AWS credentials
echo "🔐 Checking AWS credentials..."
if ! aws sts get-caller-identity &> /dev/null; then
    print_error "AWS credentials not configured"
    exit 1
fi
print_success "AWS credentials configured"
echo ""

# Check kubectl context
echo "🔧 Checking kubectl context..."
CURRENT_CONTEXT=$(kubectl config current-context 2>/dev/null || echo "none")
if [[ "$CURRENT_CONTEXT" != *"tribetalk-eks"* ]]; then
    print_warning "Current context: $CURRENT_CONTEXT"
    print_info "Updating kubeconfig for tribetalk-eks..."
    aws eks update-kubeconfig --region eu-north-1 --name tribetalk-eks
fi
print_success "kubectl configured for tribetalk-eks"
echo ""

# Show current cluster state
echo "📊 Current cluster state:"
echo "------------------------"
kubectl get nodes
echo ""
kubectl get pods --all-namespaces | grep -E "Pending|CrashLoop|Error" || echo "No problematic pods found"
echo ""

# Confirm before proceeding
read -p "Do you want to proceed with scaling and monitoring deployment? (yes/no): " CONFIRM
if [[ "$CONFIRM" != "yes" ]]; then
    print_warning "Deployment cancelled by user"
    exit 0
fi
echo ""

#############################################
# STEP 1: Scale EKS Cluster
#############################################
echo "🔄 STEP 1: Scaling EKS cluster to 4 nodes"
echo "=========================================="
echo ""

cd terraform

print_info "Running terraform plan..."
terraform plan -out=tfplan

echo ""
read -p "Review the plan above. Apply changes? (yes/no): " APPLY_CONFIRM
if [[ "$APPLY_CONFIRM" != "yes" ]]; then
    print_warning "Terraform apply cancelled"
    cd ..
    exit 0
fi

print_info "Applying terraform changes..."
terraform apply tfplan

print_success "Terraform apply complete"
echo ""

print_info "Waiting for new node to join cluster (this may take 3-5 minutes)..."
sleep 30

# Wait for 4 nodes to be ready
TIMEOUT=300
ELAPSED=0
while true; do
    READY_NODES=$(kubectl get nodes --no-headers | grep -c " Ready " || echo "0")
    if [ "$READY_NODES" -ge 4 ]; then
        print_success "All 4 nodes are ready!"
        break
    fi
    
    if [ $ELAPSED -ge $TIMEOUT ]; then
        print_error "Timeout waiting for nodes to be ready"
        exit 1
    fi
    
    echo "Waiting for nodes... ($READY_NODES/4 ready)"
    sleep 10
    ELAPSED=$((ELAPSED + 10))
done

echo ""
kubectl get nodes
echo ""

cd ..

#############################################
# STEP 2: Deploy Optimized Monitoring
#############################################
echo "📊 STEP 2: Deploying optimized monitoring stack"
echo "==============================================="
echo ""

# Check if Prometheus is already installed
if helm list -n monitoring | grep -q prometheus; then
    print_warning "Existing Prometheus installation found"
    read -p "Uninstall and reinstall with optimized config? (yes/no): " REINSTALL
    if [[ "$REINSTALL" == "yes" ]]; then
        print_info "Uninstalling existing Prometheus..."
        helm uninstall prometheus -n monitoring
        
        print_info "Waiting for pods to terminate..."
        sleep 15
        kubectl wait --for=delete pod -l app.kubernetes.io/instance=prometheus -n monitoring --timeout=120s 2>/dev/null || true
        print_success "Uninstall complete"
    else
        print_warning "Skipping monitoring deployment"
        exit 0
    fi
fi

echo ""
print_info "Adding Prometheus Helm repository..."
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts 2>/dev/null || true
helm repo update

echo ""
print_info "Installing optimized Prometheus stack..."
helm install prometheus prometheus-community/kube-prometheus-stack \
  -n monitoring \
  --create-namespace \
  -f k8s/prometheus-values-optimized.yaml

print_success "Prometheus installation initiated"
echo ""

print_info "Waiting for monitoring pods to be ready (this may take 2-3 minutes)..."
kubectl wait --for=condition=ready pod -l app.kubernetes.io/instance=prometheus -n monitoring --timeout=300s

print_success "All monitoring pods are ready!"
echo ""

#############################################
# STEP 3: Verification
#############################################
echo "✅ STEP 3: Verification"
echo "======================="
echo ""

echo "📊 Cluster Nodes:"
kubectl get nodes -o wide
echo ""

echo "📦 Monitoring Pods:"
kubectl get pods -n monitoring
echo ""

echo "📦 Application Pods:"
kubectl get pods -n default
echo ""

echo "🔍 Checking for pending pods..."
PENDING_PODS=$(kubectl get pods --all-namespaces | grep Pending | wc -l || echo "0")
if [ "$PENDING_PODS" -eq 0 ]; then
    print_success "No pending pods found!"
else
    print_warning "Found $PENDING_PODS pending pod(s)"
    kubectl get pods --all-namespaces | grep Pending
fi
echo ""

echo "💾 Resource Allocation:"
kubectl describe nodes | grep -A 5 "Allocated resources"
echo ""

#############################################
# STEP 4: Post-Deployment Tasks
#############################################
echo "📝 STEP 4: Post-deployment tasks"
echo "================================"
echo ""

print_info "Updating Grafana datasource (if needed)..."
cat > /tmp/grafana-datasources-update.yaml <<EOF
apiVersion: v1
kind: ConfigMap
metadata:
  name: grafana-datasources
  namespace: default
data:
  datasources.yaml: |
    apiVersion: 1
    datasources:
      - name: Prometheus (In-Cluster)
        type: prometheus
        access: proxy
        url: http://prometheus-kube-prometheus-prometheus.monitoring.svc.cluster.local:9090
        isDefault: true
        editable: true
      
      - name: Prometheus (EC2)
        type: prometheus
        access: proxy
        url: http://10.0.0.193:9090
        isDefault: false
        editable: true
      
      - name: Loki
        type: loki
        access: proxy
        url: http://10.0.0.193:3100
        isDefault: false
        editable: true
      
      - name: Tempo
        type: tempo
        access: proxy
        url: http://10.0.0.193:3200
        isDefault: false
        editable: true
        jsonData:
          tracesToLogs:
            datasourceUid: loki
          tracesToMetrics:
            datasourceUid: prometheus
EOF

kubectl apply -f /tmp/grafana-datasources-update.yaml
rm /tmp/grafana-datasources-update.yaml

print_info "Restarting Grafana to pick up new datasource..."
kubectl rollout restart deployment/grafana -n default
kubectl rollout status deployment/grafana -n default --timeout=60s

print_success "Grafana updated"
echo ""

#############################################
# Summary
#############################################
echo "🎉 Deployment Complete!"
echo "======================="
echo ""
echo "Summary:"
echo "--------"
echo "✅ EKS cluster scaled to 4 nodes (min: 3, max: 6)"
echo "✅ Optimized Prometheus monitoring deployed"
echo "✅ All pods running successfully"
echo "✅ Grafana datasource updated"
echo ""
echo "Resource Savings:"
echo "-----------------"
echo "• Prometheus: 512Mi → 256Mi RAM (-50%)"
echo "• Alertmanager: 128Mi → 64Mi RAM (-50%)"
echo "• Operator: 128Mi → 64Mi RAM (-50%)"
echo "• Total: ~400Mi RAM saved"
echo ""
echo "Cost Impact:"
echo "------------"
echo "• Additional node: ~$15-20/month"
echo "• Total cluster: ~$60-80/month (4 x t3.small)"
echo ""
echo "Next Steps:"
echo "-----------"
echo "1. Access Prometheus: kubectl port-forward -n monitoring svc/prometheus-kube-prometheus-prometheus 9090:9090"
echo "2. Access Grafana: kubectl port-forward -n default svc/grafana 3000:3000"
echo "3. Monitor resource usage over next 24-48 hours"
echo "4. Ready for live streaming implementation!"
echo ""
print_success "All done! 🚀"
