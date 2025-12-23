# Running Monitoring Stack Outside EKS

## Options for External Monitoring

### Option 1: AWS Managed Services (Recommended)

#### Amazon Managed Prometheus (AMP)
- **What**: Fully managed Prometheus service
- **Benefits**: No infrastructure to manage, auto-scaling, HA
- **Cost**: Pay per metrics ingested and queried
- **Setup**: Configure Prometheus remote write from your apps

#### Amazon Managed Grafana (AMG)
- **What**: Fully managed Grafana service
- **Benefits**: No maintenance, built-in auth, integrates with AMP
- **Cost**: Pay per active user
- **Setup**: Connect to AMP as data source

#### CloudWatch Logs (Alternative to Loki)
- **What**: AWS native log aggregation
- **Benefits**: Integrated with AWS services
- **Cost**: Pay per GB ingested and stored

**Estimated Cost**: $50-150/month (vs $0 for self-hosted but uses cluster resources)

---

### Option 2: Separate EC2 Instance

Run monitoring stack on a dedicated EC2 instance outside EKS:

**Instance**: t3.medium or t3.large
- **Memory**: 4-8GB (enough for all monitoring tools)
- **Cost**: ~$30-60/month

**Setup**:
```bash
# On EC2 instance
docker-compose up -d prometheus grafana loki
```

**Pros**:
- Frees up ~2GB in EKS cluster
- Monitoring survives cluster restarts
- Cheaper than managed services

**Cons**:
- Need to manage the EC2 instance
- Need to configure networking/security groups

---

### Option 3: Remove Monitoring (Simplest)

If you don't need monitoring in production:

```bash
# Remove monitoring stack
kubectl delete namespace monitoring
kubectl delete -f k8s/monitoring/  # if you have monitoring manifests
```

**Frees up**: ~2-2.5GB of memory immediately

**Use instead**:
- CloudWatch for basic metrics (free tier)
- Application logs to CloudWatch Logs
- AWS X-Ray for tracing

---

## Recommended Approach

### For Production
**Use AWS Managed Services**:
1. Amazon Managed Prometheus (AMP)
2. Amazon Managed Grafana (AMG)
3. CloudWatch Logs

### For Development/Learning
**Remove monitoring from EKS**:
- Use CloudWatch for basic monitoring
- Add monitoring back later when you upgrade to t3.medium

---

## How to Remove Current Monitoring

### 1. Check what's installed
```bash
kubectl get all -n monitoring
kubectl get pods --all-namespaces | grep -E "prometheus|grafana|loki"
```

### 2. Delete monitoring resources
```bash
# If using Helm
helm list --all-namespaces
helm uninstall monitoring -n monitoring
helm uninstall loki -n monitoring

# If using kubectl
kubectl delete namespace monitoring
```

### 3. Verify cleanup
```bash
kubectl get pods --all-namespaces | grep -E "prometheus|grafana|loki|promtail"
```

**Memory freed**: ~2-2.5GB across your cluster

---

## Migration to AWS Managed Services

### Step 1: Setup Amazon Managed Prometheus
```bash
# Create AMP workspace
aws amp create-workspace --alias tribetalk-metrics --region eu-north-1
```

### Step 2: Configure Remote Write
Update your application Prometheus config to send metrics to AMP:
```yaml
remote_write:
  - url: https://aps-workspaces.eu-north-1.amazonaws.com/workspaces/<workspace-id>/api/v1/remote_write
    sigv4:
      region: eu-north-1
```

### Step 3: Setup Amazon Managed Grafana
```bash
# Create AMG workspace via AWS Console
# Connect to AMP as data source
```

### Step 4: Remove in-cluster monitoring
```bash
kubectl delete namespace monitoring
```

---

## Cost Comparison

| Option | Monthly Cost | Memory in EKS | Maintenance |
|--------|--------------|---------------|-------------|
| In-cluster (current) | $0 | Uses 2-2.5GB | High |
| AWS Managed | $50-150 | 0GB | None |
| Separate EC2 | $30-60 | 0GB | Medium |
| Remove monitoring | $0 | 0GB | None |

---

## Immediate Action

**Quick fix to free memory NOW**:
```bash
# Delete monitoring stack
kubectl delete namespace monitoring --ignore-not-found=true
kubectl delete pods -l app.kubernetes.io/name=prometheus --all-namespaces
kubectl delete pods -l app.kubernetes.io/name=grafana --all-namespaces
kubectl delete pods -l app.kubernetes.io/name=loki --all-namespaces
kubectl delete pods -l app.kubernetes.io/name=promtail --all-namespaces
```

This will immediately free up ~2GB and solve your memory issues!

---

## Recommendation

**For now**: Remove monitoring from EKS to free memory
**Later**: Either upgrade to t3.medium OR use AWS Managed Services

This will solve your "Insufficient memory" errors immediately.
