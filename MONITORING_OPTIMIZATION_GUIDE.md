# Monitoring Stack Resource Optimization Guide

## Problem Summary

Your EKS cluster is running out of resources when deploying the monitoring stack. Analysis shows:

- **3x t3.small nodes** (2 vCPU, 2GB RAM each)
- **Current utilization**: 89%, 62%, 51% memory requests
- **Issue**: `prometheus-prometheus-node-exporter-h224r` pod is **Pending** due to "Too many pods" on one node
- **Root cause**: Monitoring stack (Prometheus, Alertmanager, node-exporters, kube-state-metrics) consumes significant resources

## Current Resource Allocation

### Application Pods (Default Namespace)
| Service | CPU Request | Memory Request | CPU Limit | Memory Limit |
|---------|-------------|----------------|-----------|--------------|
| tribetalk | 250m | 256Mi | 500m | 1Gi |
| chatservice | 200m | 384Mi | 400m | 768Mi |
| notification-service | 100m | 256Mi | 300m | 512Mi |
| tribe-talk-frontend | 100m | 256Mi | 200m | 512Mi |
| grafana | 100m | 128Mi | 500m | 512Mi |
| **Total** | **750m** | **1280Mi** | **1900m** | **3.3Gi** |

### Monitoring Stack (Monitoring Namespace)
| Component | CPU Request | Memory Request | CPU Limit | Memory Limit |
|-----------|-------------|----------------|-----------|--------------|
| prometheus | 200m | 512Mi | 1000m | 2Gi |
| alertmanager | 50m | 128Mi | 200m | 256Mi |
| prometheus-operator | 100m | 128Mi | 500m | 512Mi |
| kube-state-metrics | ~50m | ~64Mi | ~100m | ~128Mi |
| node-exporter (x3) | 150m | 90Mi | 300m | 150Mi |
| **Total** | **~550m** | **~922Mi** | **~2100m** | **~3Gi** |

### Total Cluster Usage
- **CPU Requests**: ~1300m (65% of 2000m available per node)
- **Memory Requests**: ~2200Mi (76% of 6GB total)
- **Problem**: Pods are not evenly distributed, causing resource pressure on individual nodes

---

## Solution Options

### Option 1: Use Optimized Prometheus Configuration (RECOMMENDED)

**Pros**: 
- ✅ No infrastructure changes needed
- ✅ Maintains monitoring capabilities
- ✅ Reduces resource consumption by ~50%
- ✅ Quick to implement

**Cons**:
- ⚠️ Shorter retention (3 days vs 7 days)
- ⚠️ Less frequent scraping (30s vs 15s)

**Implementation**:

```bash
# 1. Uninstall current Prometheus stack
helm uninstall prometheus -n monitoring

# 2. Reinstall with optimized values
helm install prometheus prometheus-community/kube-prometheus-stack \
  -n monitoring \
  --create-namespace \
  -f k8s/prometheus-values-optimized.yaml

# 3. Verify all pods are running
kubectl get pods -n monitoring
```

**Resource Savings**:
- Prometheus: 512Mi → 256Mi (50% reduction)
- Alertmanager: 128Mi → 64Mi (50% reduction)
- Operator: 128Mi → 64Mi (50% reduction)
- **Total savings**: ~400Mi memory, ~200m CPU

---

### Option 2: Reduce Application Resource Requests

**Pros**:
- ✅ Frees up resources for monitoring
- ✅ More realistic resource allocation
- ✅ No monitoring compromise

**Cons**:
- ⚠️ Requires application redeployment
- ⚠️ Need to monitor for OOM issues

**Implementation**:

Reduce resource requests for applications (limits stay the same for burst capacity):

```yaml
# tribetalk: 256Mi → 192Mi
# chatservice: 384Mi → 256Mi
# notification-service: 256Mi → 192Mi
# frontend: 256Mi → 128Mi
```

**Total savings**: ~400Mi memory

---

### Option 3: Scale Up Node Group (LONG-TERM SOLUTION)

**Pros**:
- ✅ Solves resource constraints permanently
- ✅ Room for future growth (live streaming!)
- ✅ Better performance

**Cons**:
- ❌ Increased AWS costs (~$30-40/month for 1 additional t3.small)
- ❌ Requires Terraform changes

**Implementation**:

```bash
# Update Terraform configuration
# In terraform/main.tf, change:
# desired_size = 3 → 4
# max_size = 4 → 5

cd terraform
terraform apply
```

**Cost Impact**: +$15-20/month per additional t3.small node

---

### Option 4: Use External Monitoring (EC2-based)

**Pros**:
- ✅ Completely removes monitoring from EKS
- ✅ Frees up maximum resources
- ✅ Can use larger instance for monitoring

**Cons**:
- ❌ More complex setup
- ❌ Additional EC2 instance cost
- ❌ Requires network configuration

**Implementation**:

You already have Prometheus, Loki, and Tempo on EC2 (10.0.0.193). You could:
1. Remove in-cluster Prometheus
2. Configure remote_write from applications to EC2 Prometheus
3. Keep only lightweight exporters in EKS

---

### Option 5: Hybrid Approach (BEST BALANCE)

**Pros**:
- ✅ Combines benefits of multiple approaches
- ✅ Minimal cost increase
- ✅ Maintains full monitoring

**Cons**:
- ⚠️ Requires multiple changes

**Implementation**:

1. **Use optimized Prometheus config** (Option 1)
2. **Reduce application requests slightly** (Option 2)
3. **Add 1 node to cluster** (Option 3) - only if needed for live streaming later

**Total Resource Freed**: ~800Mi memory, ~300m CPU

---

## Immediate Action Plan (RECOMMENDED)

### Step 1: Apply Optimized Prometheus Configuration

```bash
# Navigate to k8s directory
cd /Users/rahissmac/Documents/dump\ files/ITCJavaBatch2_Antigravity/ITC_Java_Batch2/k8s

# Uninstall current Prometheus
helm uninstall prometheus -n monitoring

# Wait for pods to terminate
kubectl wait --for=delete pod -l app.kubernetes.io/instance=prometheus -n monitoring --timeout=120s

# Reinstall with optimized values
helm install prometheus prometheus-community/kube-prometheus-stack \
  -n monitoring \
  --create-namespace \
  -f prometheus-values-optimized.yaml

# Monitor the rollout
watch kubectl get pods -n monitoring
```

### Step 2: Verify All Pods Are Running

```bash
# Check monitoring namespace
kubectl get pods -n monitoring

# Check for pending pods
kubectl get pods --all-namespaces | grep Pending

# Check node resource usage
kubectl describe nodes | grep -A 5 "Allocated resources"
```

### Step 3: Verify Metrics Collection

```bash
# Port-forward to Prometheus
kubectl port-forward -n monitoring svc/prometheus-kube-prometheus-prometheus 9090:9090

# Open browser to http://localhost:9090
# Query: up{job="tribetalk"}
# Should show 1 (target is up)
```

### Step 4: Update Grafana Datasource (if needed)

```bash
# Update Grafana to point to in-cluster Prometheus
kubectl edit configmap grafana-datasources -n default

# Change Prometheus URL to:
# url: http://prometheus-kube-prometheus-prometheus.monitoring.svc.cluster.local:9090
```

---

## Resource Comparison

### Before Optimization
```
Prometheus:        200m CPU, 512Mi RAM
Alertmanager:       50m CPU, 128Mi RAM
Operator:          100m CPU, 128Mi RAM
Kube-state:         50m CPU,  64Mi RAM
Node-exporters:    150m CPU,  90Mi RAM
─────────────────────────────────────
Total:             550m CPU, 922Mi RAM
```

### After Optimization
```
Prometheus:        100m CPU, 256Mi RAM  (-50%)
Alertmanager:       25m CPU,  64Mi RAM  (-50%)
Operator:           50m CPU,  64Mi RAM  (-50%)
Kube-state:         50m CPU,  64Mi RAM  (same)
Node-exporters:    150m CPU,  90Mi RAM  (same)
─────────────────────────────────────
Total:             375m CPU, 538Mi RAM  (-42%)
```

**Savings**: 175m CPU, 384Mi RAM

---

## Long-Term Recommendations

1. **For Live Streaming Feature**: You'll need to add 1-2 nodes to the cluster
   - Streaming service will require significant resources
   - TURN server can run on existing EC2 database instance

2. **Consider t3.medium nodes** instead of t3.small for better headroom
   - t3.medium: 2 vCPU, 4GB RAM (~$30/month)
   - vs t3.small: 2 vCPU, 2GB RAM (~$15/month)
   - Better cost/performance ratio for production

3. **Implement Horizontal Pod Autoscaling (HPA)** for applications
   - Scale based on CPU/memory usage
   - Better resource utilization

4. **Use Vertical Pod Autoscaler (VPA)** to right-size resource requests
   - Automatically adjusts requests based on actual usage
   - Prevents over-provisioning

---

## Monitoring After Changes

After applying the optimized configuration, monitor these metrics:

1. **Pod Status**: All pods should be Running
2. **Memory Usage**: Should be < 80% on all nodes
3. **CPU Usage**: Should be < 70% on all nodes
4. **Prometheus Query Performance**: Queries should complete in < 5s
5. **Scrape Success Rate**: Should be > 99%

---

## Troubleshooting

### If Pods Still Pending

```bash
# Check which node has the issue
kubectl get pods -o wide --all-namespaces | grep Pending

# Describe the pending pod
kubectl describe pod <pod-name> -n <namespace>

# Check node capacity
kubectl describe nodes | grep -A 10 "Capacity:"
```

### If Prometheus OOM (Out of Memory)

```bash
# Increase memory limit temporarily
kubectl edit statefulset prometheus-prometheus-kube-prometheus-prometheus -n monitoring

# Or reduce retention further
# retention: 3d → 2d
# retentionSize: 5GB → 3GB
```

### If Metrics Not Appearing

```bash
# Check Prometheus targets
kubectl port-forward -n monitoring svc/prometheus-kube-prometheus-prometheus 9090:9090

# Visit http://localhost:9090/targets
# All targets should show "UP"
```

---

## Next Steps

1. **Immediate**: Apply optimized Prometheus configuration
2. **Short-term**: Monitor resource usage for 24-48 hours
3. **Medium-term**: Plan for cluster scaling before implementing live streaming
4. **Long-term**: Consider migrating to t3.medium nodes for better headroom
