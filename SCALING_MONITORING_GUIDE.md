# EKS Scaling + Optimized Monitoring - Quick Reference

## What Changed

### 1. Terraform Configuration (`terraform/variables.tf`)
```diff
- eks_desired_nodes = 2
+ eks_desired_nodes = 4

- eks_min_nodes = 1
+ eks_min_nodes = 3

- eks_max_nodes = 4
+ eks_max_nodes = 6
```

### 2. Prometheus Configuration (`k8s/prometheus-values-optimized.yaml`)
- **Created new optimized configuration file**
- Reduced resource requests by ~50%
- Shorter retention (3 days vs 7 days)
- Less frequent scraping (30s vs 15s)

---

## Deployment Steps

### Option 1: Automated Deployment (RECOMMENDED)

```bash
cd /Users/rahissmac/Documents/dump\ files/ITCJavaBatch2_Antigravity/ITC_Java_Batch2

# Make script executable
chmod +x scripts/deploy-scaling-and-monitoring.sh

# Run deployment script
./scripts/deploy-scaling-and-monitoring.sh
```

The script will:
1. ✅ Check prerequisites
2. ✅ Scale EKS cluster to 4 nodes
3. ✅ Deploy optimized Prometheus
4. ✅ Update Grafana datasources
5. ✅ Verify everything is running

---

### Option 2: Manual Deployment

#### Step 1: Scale EKS Cluster

```bash
cd terraform

# Review changes
terraform plan

# Apply changes
terraform apply

# Wait for new node
kubectl get nodes -w
```

#### Step 2: Deploy Optimized Monitoring

```bash
cd ..

# Uninstall existing Prometheus
helm uninstall prometheus -n monitoring

# Wait for cleanup
kubectl wait --for=delete pod -l app.kubernetes.io/instance=prometheus -n monitoring --timeout=120s

# Add Helm repo
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo update

# Install optimized Prometheus
helm install prometheus prometheus-community/kube-prometheus-stack \
  -n monitoring \
  --create-namespace \
  -f k8s/prometheus-values-optimized.yaml

# Wait for pods to be ready
kubectl wait --for=condition=ready pod -l app.kubernetes.io/instance=prometheus -n monitoring --timeout=300s
```

#### Step 3: Update Grafana Datasource

```bash
# Edit Grafana datasource ConfigMap
kubectl edit configmap grafana-datasources -n default

# Change Prometheus URL to:
# url: http://prometheus-kube-prometheus-prometheus.monitoring.svc.cluster.local:9090

# Restart Grafana
kubectl rollout restart deployment/grafana -n default
```

---

## Verification

### Check Cluster Status

```bash
# View nodes
kubectl get nodes

# Should show 4 nodes, all Ready
```

### Check Pod Status

```bash
# Check monitoring namespace
kubectl get pods -n monitoring

# Check for pending pods
kubectl get pods --all-namespaces | grep Pending

# Should show no pending pods
```

### Check Resource Usage

```bash
# View resource allocation
kubectl describe nodes | grep -A 5 "Allocated resources"

# Should show lower utilization per node
```

### Test Prometheus

```bash
# Port-forward to Prometheus
kubectl port-forward -n monitoring svc/prometheus-kube-prometheus-prometheus 9090:9090

# Open browser to http://localhost:9090
# Run query: up{job="tribetalk"}
# Should return 1 (target is up)
```

### Test Grafana

```bash
# Port-forward to Grafana
kubectl port-forward -n default svc/grafana 3000:3000

# Open browser to http://localhost:3000
# Login: admin / admin
# Check that Prometheus datasource is working
```

---

## Resource Comparison

### Before Optimization (3 nodes)
```
Node 1: 89% memory, 40% CPU
Node 2: 62% memory, 35% CPU  
Node 3: 51% memory, 25% CPU
Status: 1 pending pod (node-exporter)
```

### After Optimization (4 nodes)
```
Node 1: ~45% memory, ~25% CPU
Node 2: ~45% memory, ~25% CPU
Node 3: ~45% memory, ~25% CPU
Node 4: ~45% memory, ~25% CPU
Status: All pods running
```

---

## Cost Impact

### Infrastructure Costs
- **Before**: 3 x t3.small = ~$45/month
- **After**: 4 x t3.small = ~$60/month
- **Increase**: ~$15/month

### Benefits
- ✅ No pending pods
- ✅ Room for monitoring stack
- ✅ Headroom for live streaming feature
- ✅ Better fault tolerance
- ✅ Improved performance

---

## Monitoring Stack Resources

### Before Optimization
| Component | CPU | Memory |
|-----------|-----|--------|
| Prometheus | 200m | 512Mi |
| Alertmanager | 50m | 128Mi |
| Operator | 100m | 128Mi |
| Kube-state | 50m | 64Mi |
| Node-exporters | 150m | 90Mi |
| **Total** | **550m** | **922Mi** |

### After Optimization
| Component | CPU | Memory |
|-----------|-----|--------|
| Prometheus | 100m | 256Mi |
| Alertmanager | 25m | 64Mi |
| Operator | 50m | 64Mi |
| Kube-state | 50m | 64Mi |
| Node-exporters | 150m | 90Mi |
| **Total** | **375m** | **538Mi** |

**Savings**: 175m CPU, 384Mi RAM (-42%)

---

## Troubleshooting

### Issue: Terraform apply fails

```bash
# Check AWS credentials
aws sts get-caller-identity

# Check current state
terraform state list

# Refresh state
terraform refresh
```

### Issue: New node not joining

```bash
# Check node group status
aws eks describe-nodegroup \
  --cluster-name tribetalk-eks \
  --nodegroup-name tribetalk-node-group \
  --region eu-north-1

# Check Auto Scaling Group
aws autoscaling describe-auto-scaling-groups \
  --region eu-north-1 | grep tribetalk
```

### Issue: Prometheus pods pending

```bash
# Describe pending pod
kubectl describe pod <pod-name> -n monitoring

# Check events
kubectl get events -n monitoring --sort-by='.lastTimestamp'

# Check node resources
kubectl describe nodes | grep -A 10 "Allocated resources"
```

### Issue: Metrics not appearing

```bash
# Check Prometheus targets
kubectl port-forward -n monitoring svc/prometheus-kube-prometheus-prometheus 9090:9090

# Visit http://localhost:9090/targets
# All should show "UP"

# Check service endpoints
kubectl get endpoints -n default tribetalk
kubectl get endpoints -n default chatservice
kubectl get endpoints -n default notification-service
```

---

## Rollback Plan

### If issues occur, rollback with:

```bash
# Rollback Terraform
cd terraform
terraform apply -var="eks_desired_nodes=3" -var="eks_min_nodes=2"

# Rollback Prometheus
helm uninstall prometheus -n monitoring
helm install prometheus prometheus-community/kube-prometheus-stack \
  -n monitoring \
  -f k8s/prometheus-values.yaml  # Original config
```

---

## Next Steps

1. **Monitor for 24-48 hours**
   - Check resource usage trends
   - Verify no OOM errors
   - Confirm metrics collection working

2. **Prepare for Live Streaming**
   - Cluster now has capacity for streaming service
   - Can proceed with live streaming implementation plan

3. **Consider Future Optimizations**
   - Implement Horizontal Pod Autoscaler (HPA)
   - Set up Vertical Pod Autoscaler (VPA)
   - Configure pod disruption budgets

---

## Useful Commands

```bash
# Watch nodes
kubectl get nodes -w

# Watch pods in monitoring namespace
kubectl get pods -n monitoring -w

# View logs
kubectl logs -f deployment/prometheus-kube-prometheus-operator -n monitoring

# Check resource usage (requires metrics-server)
kubectl top nodes
kubectl top pods -n monitoring

# Port-forward services
kubectl port-forward -n monitoring svc/prometheus-kube-prometheus-prometheus 9090:9090
kubectl port-forward -n default svc/grafana 3000:3000
kubectl port-forward -n monitoring svc/prometheus-kube-prometheus-alertmanager 9093:9093
```

---

## Success Criteria

- ✅ 4 nodes showing "Ready" status
- ✅ All monitoring pods in "Running" state
- ✅ No pending pods in cluster
- ✅ Prometheus scraping all targets successfully
- ✅ Grafana showing metrics from in-cluster Prometheus
- ✅ Memory usage < 70% on all nodes
- ✅ CPU usage < 60% on all nodes
