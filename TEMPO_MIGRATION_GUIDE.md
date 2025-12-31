# Tempo Migration Guide: EC2 → EKS

## What Changed

All three microservices have been updated to send traces to the **in-cluster Tempo** instead of EC2:

### Before
```
EC2 Tempo: http://10.0.0.193:4318/v1/traces
```

### After
```
In-Cluster Tempo: http://tempo.monitoring.svc.cluster.local:4318/v1/traces
```

---

## Files Updated

| Service | File | Line Changed |
|---------|------|--------------|
| **TribeTalk** | `tribetalk/src/main/resources/application.yml` | Line 117 |
| **ChatService** | `ChatService/src/main/resources/application.properties` | Line 22 |
| **NotificationService** | `notification-service/src/main/resources/application.yaml` | Line 49 |

---

## Deployment Steps

### Option 1: Rebuild and Redeploy All Services (Recommended)

```bash
cd /Users/rahissmac/Documents/dump\ files/ITCJavaBatch2_Antigravity/ITC_Java_Batch2

# 1. Build all services
mvn clean package -DskipTests -pl tribetalk
mvn clean package -DskipTests -pl ChatService
mvn clean package -DskipTests -pl notification-service

# 2. Build Docker images
docker build -t 430006376054.dkr.ecr.eu-north-1.amazonaws.com/tribetalk-service:v4.0-tempo-eks ./tribetalk
docker build -t 430006376054.dkr.ecr.eu-north-1.amazonaws.com/chatservice:v4.0-tempo-eks ./ChatService
docker build -t 430006376054.dkr.ecr.eu-north-1.amazonaws.com/notification-service:v4.0-tempo-eks ./notification-service

# 3. Login to ECR
aws ecr get-login-password --region eu-north-1 | docker login --username AWS --password-stdin 430006376054.dkr.ecr.eu-north-1.amazonaws.com

# 4. Push images
docker push 430006376054.dkr.ecr.eu-north-1.amazonaws.com/tribetalk-service:v4.0-tempo-eks
docker push 430006376054.dkr.ecr.eu-north-1.amazonaws.com/chatservice:v4.0-tempo-eks
docker push 430006376054.dkr.ecr.eu-north-1.amazonaws.com/notification-service:v4.0-tempo-eks

# 5. Update deployments
kubectl set image deployment/tribetalk tribetalk=430006376054.dkr.ecr.eu-north-1.amazonaws.com/tribetalk-service:v4.0-tempo-eks -n default
kubectl set image deployment/chatservice chatservice=430006376054.dkr.ecr.eu-north-1.amazonaws.com/chatservice:v4.0-tempo-eks -n default
kubectl set image deployment/notification-service notification-service=430006376054.dkr.ecr.eu-north-1.amazonaws.com/notification-service:v4.0-tempo-eks -n default

# 6. Wait for rollout
kubectl rollout status deployment/tribetalk -n default
kubectl rollout status deployment/chatservice -n default
kubectl rollout status deployment/notification-service -n default
```

---

### Option 2: Use Jenkins Pipeline (If Available)

If you have Jenkins configured:

1. Commit the changes to your repository
2. Trigger Jenkins build pipeline
3. Jenkins will automatically build, push, and deploy

---

### Option 3: Quick Test (One Service at a Time)

Test with TribeTalk first:

```bash
# Build and deploy just TribeTalk
cd tribetalk
mvn clean package -DskipTests
docker build -t 430006376054.dkr.ecr.eu-north-1.amazonaws.com/tribetalk-service:v4.0-tempo-eks .
aws ecr get-login-password --region eu-north-1 | docker login --username AWS --password-stdin 430006376054.dkr.ecr.eu-north-1.amazonaws.com
docker push 430006376054.dkr.ecr.eu-north-1.amazonaws.com/tribetalk-service:v4.0-tempo-eks
kubectl set image deployment/tribetalk tribetalk=430006376054.dkr.ecr.eu-north-1.amazonaws.com/tribetalk-service:v4.0-tempo-eks -n default
kubectl rollout status deployment/tribetalk -n default
```

Then verify traces are appearing in Tempo before deploying the others.

---

## Verification

### 1. Check Pods are Running

```bash
kubectl get pods -n default
```

All should show `1/1 Running`

### 2. Check Tempo is Receiving Traces

```bash
# Wait a few minutes for traces to accumulate, then:
kubectl exec -n monitoring tempo-0 -- wget -qO- 'http://localhost:3200/api/search/tags' 2>/dev/null
```

Should show tags like `service.name`, `http.method`, etc.

### 3. View Traces in Grafana

1. Go to Grafana: http://k8s-default-tribetal-089de13287-2075252521.eu-north-1.elb.amazonaws.com/grafana
2. Click **Explore** (compass icon)
3. Select **Tempo** datasource
4. Click **Search** tab
5. Select **Service Name**: `tribetalk`
6. Click **Run Query**

You should see traces! 🎉

---

## Rollback Plan

If something goes wrong, rollback to previous versions:

```bash
# Find previous image tags
kubectl describe deployment tribetalk -n default | grep Image

# Rollback
kubectl rollout undo deployment/tribetalk -n default
kubectl rollout undo deployment/chatservice -n default
kubectl rollout undo deployment/notification-service -n default
```

---

## Benefits of In-Cluster Tempo

✅ **Better Performance**: No network latency to EC2  
✅ **Easier Access**: Grafana can reach it directly  
✅ **Centralized**: All observability in one place  
✅ **Cost Efficient**: No EC2 bandwidth charges  
✅ **Simpler**: No security group configuration needed  

---

## Environment Variable Override

The configuration now supports environment variable override:

```yaml
endpoint: ${OTEL_EXPORTER_OTLP_ENDPOINT:http://tempo.monitoring.svc.cluster.local:4318/v1/traces}
```

This means you can override it in deployments if needed:

```yaml
env:
  - name: OTEL_EXPORTER_OTLP_ENDPOINT
    value: "http://custom-tempo:4318/v1/traces"
```

---

## Next Steps

1. **Build and deploy** the services (Option 1 recommended)
2. **Wait 5-10 minutes** for traces to accumulate
3. **Check Grafana** to see distributed traces
4. **Celebrate** - you now have full observability! 🎉

---

## Troubleshooting

### No traces appearing?

```bash
# Check if apps can reach Tempo
kubectl exec -n default deployment/tribetalk -- curl -s http://tempo.monitoring.svc.cluster.local:4318/v1/traces

# Check Tempo logs
kubectl logs -n monitoring tempo-0 --tail=50

# Check application logs for OTLP errors
kubectl logs -n default deployment/tribetalk --tail=50 | grep -i otlp
```

### Pods not starting?

```bash
# Check pod status
kubectl describe pod -n default <pod-name>

# Check logs
kubectl logs -n default <pod-name>
```

---

## Summary

✅ Configuration files updated  
⏳ Services need to be rebuilt and redeployed  
🎯 After deployment, traces will flow to in-cluster Tempo  
📊 View traces in Grafana Explore → Tempo  
