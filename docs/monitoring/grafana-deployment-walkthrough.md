# Grafana Monitoring Stack Deployment - Walkthrough

## Overview

Successfully deployed a self-hosted Grafana monitoring stack on the EKS cluster using the `kube-prometheus-stack` Helm chart.

## Challenge Encountered

### Initial Issue
The EKS cluster had insufficient pod capacity to deploy the full monitoring stack:
- **Cluster**: 2x t3.small nodes
- **Pod limit**: 11 pods per node (22 total)
- **Initial usage**: 22/22 pods (100% capacity)
- **Blocker**: Prometheus pod could not be scheduled

### Root Cause
- t3.small instances have a hard limit of 11 pods per node due to AWS ENI limitations
- Existing Grafana agent DaemonSet was consuming 2 pod slots
- No available capacity for new monitoring components

### Solution
Removed the existing Grafana agent DaemonSet from the `observability` namespace, freeing 2 pod slots and allowing Prometheus to deploy successfully.

## Deployment Steps

### 1. Created Lightweight Configuration
Created `k8s/monitoring/values-lightweight.yaml` with:
- Disabled persistence (no PVCs) to avoid storage provisioning issues
- Reduced resource limits to fit small cluster
- Disabled AlertManager to save resources
- Used NodePort instead of LoadBalancer

### 2. Deployed Monitoring Stack
```bash
helm install monitoring prometheus-community/kube-prometheus-stack \
  --namespace monitoring \
  --values k8s/monitoring/values-lightweight.yaml
```

### 3. Removed Grafana Agents
```bash
kubectl delete daemonset grafana-agent -n observability
```

### 4. Deployed TribeTalk ServiceMonitor
```bash
kubectl apply -f k8s/monitoring/servicemonitor-tribetalk.yaml
```

## Deployed Components

### ✅ Running Pods
- **Grafana**: 3/3 Running (visualization platform)
- **Prometheus**: 2/2 Running (metrics storage)
- **Prometheus Operator**: 1/1 Running (manages Prometheus)
- **Kube State Metrics**: 1/1 Running (Kubernetes metrics)
- **Node Exporters**: 2/2 Running (node-level metrics)

### 📊 Services
- `monitoring-grafana` - NodePort 30300
- `monitoring-kube-prometheus-prometheus` - ClusterIP 9090
- `monitoring-kube-state-metrics` - ClusterIP 8080
- `monitoring-prometheus-node-exporter` - ClusterIP 9100

## Access Information

### Grafana Dashboard

**Access via kubectl port-forward:**
```bash
kubectl port-forward -n monitoring svc/monitoring-grafana 3000:80
```
Then open: http://localhost:3000

**Access via NodePort (if nodes have public IPs):**
```
http://<NODE_IP>:30300
```

**Default Credentials:**
- Username: `admin`
- Password: `admin123`

> ⚠️ **IMPORTANT**: Change the default password after first login!

### Prometheus UI

**Access via kubectl port-forward:**
```bash
kubectl port-forward -n monitoring svc/monitoring-kube-prometheus-prometheus 9090:9090
```
Then open: http://localhost:9090

## Verification

### Check Pod Status
```bash
kubectl get pods -n monitoring
```

All pods should be in `Running` state.

### Check Prometheus Targets
1. Access Prometheus UI
2. Navigate to Status → Targets
3. Verify TribeTalk endpoint is discovered and UP

### Test Metrics Collection
In Grafana:
1. Go to Explore
2. Select Prometheus data source
3. Query: `up{job="tribetalk"}`
4. Should return `1` if metrics are being scraped

## Current Cluster Status

- **Total Pods**: 21/22 (1 slot available)
- **Node 1**: 11/11 pods
- **Node 2**: 10/11 pods
- **Monitoring Pods**: 7 pods total

## Next Steps

### 1. Import Dashboards
Import pre-built dashboards in Grafana:
- **Kubernetes Cluster Monitoring**: Dashboard ID 7249
- **Spring Boot Statistics**: Dashboard ID 12900
- **Node Exporter Full**: Dashboard ID 1860

### 2. Configure TribeTalk Metrics
Ensure TribeTalk application exposes metrics at `/actuator/prometheus`:
- Verify Micrometer Prometheus dependency is in pom.xml
- Check that actuator endpoints are enabled
- Test: `curl http://<tribetalk-service>/actuator/prometheus`

### 3. Create Custom Dashboards
Build custom dashboards for:
- Application-specific metrics (request rates, errors, latency)
- Business metrics (user registrations, posts, etc.)
- Database connection pools
- Kafka consumer lag

### 4. Set Up Alerts (Optional)
Configure AlertManager rules for:
- High error rates
- Pod restarts
- Resource usage thresholds
- Application-specific alerts

## Configuration Files

All configuration files are stored in:
- `k8s/monitoring/namespace.yaml`
- `k8s/monitoring/values-lightweight.yaml`
- `k8s/monitoring/servicemonitor-tribetalk.yaml`
- `docs/monitoring/grafana-stack-implementation.md` (full plan)

## Limitations

### Current Constraints
- **No persistence**: Metrics are stored in memory only (lost on pod restart)
- **7-day retention**: Metrics older than 7 days are automatically deleted
- **No AlertManager**: Alerting is disabled to save resources
- **Pod capacity**: Only 1 pod slot remaining in cluster

### Recommendations for Production
1. **Add more nodes** or upgrade to t3.medium for:
   - Persistent storage (EBS volumes)
   - Longer retention periods
   - AlertManager for notifications
   - Additional monitoring tools (Loki for logs, Tempo for traces)

2. **Enable persistence** when cluster has capacity:
   - Update values.yaml to enable PVCs
   - Configure appropriate storage sizes
   - Set up backup strategy

3. **Secure Grafana**:
   - Change default admin password
   - Configure OAuth2/LDAP authentication
   - Set up HTTPS with TLS certificates

## Troubleshooting

### Prometheus Not Scraping TribeTalk
1. Check ServiceMonitor: `kubectl get servicemonitor -n monitoring`
2. Verify service labels match: `kubectl get svc tribetalk -o yaml`
3. Check Prometheus logs: `kubectl logs -n monitoring prometheus-monitoring-kube-prometheus-prometheus-0`

### Grafana Not Accessible
1. Check pod status: `kubectl get pods -n monitoring | grep grafana`
2. Check service: `kubectl get svc -n monitoring monitoring-grafana`
3. Verify port-forward: `kubectl port-forward -n monitoring svc/monitoring-grafana 3000:80`

### Out of Pod Capacity
1. Check current usage: `kubectl get pods --all-namespaces | wc -l`
2. Remove unnecessary pods or scale cluster
3. Consider upgrading to larger instance types

## Cost Estimate

**Current Setup (No Persistence):**
- Compute overhead: ~$2-3/month (minimal CPU/memory usage)
- No additional storage costs

**With Persistence (Recommended):**
- EBS volumes (35GB): ~$3.50/month
- Total: ~$5-6/month

## Success Metrics

✅ Grafana dashboard accessible
✅ Prometheus collecting metrics
✅ All monitoring pods running
✅ TribeTalk ServiceMonitor deployed
✅ Cluster pod capacity optimized (21/22 used)
