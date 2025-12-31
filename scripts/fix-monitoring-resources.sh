#!/bin/bash
# Quick fix script for monitoring stack resource issues
# This script will reinstall Prometheus with optimized resource settings

set -e

echo "🔧 TribeTalk Monitoring Stack Optimization"
echo "=========================================="
echo ""

# Check if helm is installed
if ! command -v helm &> /dev/null; then
    echo "❌ Error: helm is not installed"
    exit 1
fi

# Check if kubectl is configured
if ! kubectl cluster-info &> /dev/null; then
    echo "❌ Error: kubectl is not configured or cluster is not accessible"
    exit 1
fi

echo "✅ Prerequisites check passed"
echo ""

# Step 1: Check current state
echo "📊 Current monitoring stack status:"
kubectl get pods -n monitoring 2>/dev/null || echo "No monitoring namespace found"
echo ""

# Step 2: Uninstall existing Prometheus
echo "🗑️  Uninstalling existing Prometheus stack..."
if helm list -n monitoring | grep -q prometheus; then
    helm uninstall prometheus -n monitoring
    echo "⏳ Waiting for pods to terminate..."
    sleep 10
    kubectl wait --for=delete pod -l app.kubernetes.io/instance=prometheus -n monitoring --timeout=120s 2>/dev/null || true
    echo "✅ Uninstall complete"
else
    echo "ℹ️  No existing Prometheus installation found"
fi
echo ""

# Step 3: Add Prometheus Helm repo
echo "📦 Adding Prometheus Helm repository..."
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts 2>/dev/null || true
helm repo update
echo "✅ Helm repo updated"
echo ""

# Step 4: Install optimized Prometheus
echo "🚀 Installing optimized Prometheus stack..."
helm install prometheus prometheus-community/kube-prometheus-stack \
  -n monitoring \
  --create-namespace \
  -f k8s/prometheus-values-optimized.yaml

echo "✅ Prometheus installed"
echo ""

# Step 5: Wait for pods to be ready
echo "⏳ Waiting for monitoring pods to be ready (this may take 2-3 minutes)..."
kubectl wait --for=condition=ready pod -l app.kubernetes.io/instance=prometheus -n monitoring --timeout=300s

echo ""
echo "✅ All monitoring pods are ready!"
echo ""

# Step 6: Show final status
echo "📊 Final monitoring stack status:"
kubectl get pods -n monitoring
echo ""

echo "🎉 Optimization complete!"
echo ""
echo "Next steps:"
echo "1. Verify metrics collection: kubectl port-forward -n monitoring svc/prometheus-kube-prometheus-prometheus 9090:9090"
echo "2. Check Grafana datasource configuration if needed"
echo "3. Monitor resource usage: kubectl top nodes (requires metrics-server)"
echo ""
