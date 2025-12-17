# TribeTalk Observability Implementation Guide

## Complete Step-by-Step Guide for Centralized Logging, Metrics, and Tracing

---

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Architecture](#architecture)
4. [Step 1: Grafana Cloud Setup](#step-1-grafana-cloud-setup)
5. [Step 2: Add Dependencies](#step-2-add-dependencies)
6. [Step 3: Deploy Grafana Agent](#step-3-deploy-grafana-agent)
7. [Step 4: Update Deployments](#step-4-update-deployments)
8. [Step 5: Rebuild and Deploy Services](#step-5-rebuild-and-deploy-services)
9. [Step 6: Verify Data Collection](#step-6-verify-data-collection)
10. [Step 7: Create Dashboards](#step-7-create-dashboards)
11. [Troubleshooting](#troubleshooting)
12. [Cost and Scaling](#cost-and-scaling)

---

## Overview

This guide implements a complete observability stack for TribeTalk using **Grafana Cloud** (free tier), providing:

- **Centralized Logging** (Loki) - All application logs in one place
- **Metrics Collection** (Prometheus) - Performance and health metrics
- **Distributed Tracing** (Tempo) - Request flow across microservices

**Services Covered**:
- tribetalk (main backend)
- chatservice (WebSocket chat)
- notification-service (Kafka notifications)

**Cost**: $0/month (Grafana Cloud free tier)

---

## Prerequisites

- Kubernetes cluster (EKS) running
- kubectl configured
- Maven installed (for rebuilding services)
- Docker access (for building images)
- AWS ECR access (for pushing images)

---

## Architecture

```
┌─────────────────────────────────────────────────┐
│           TribeTalk Services                    │
│  ┌──────────┐  ┌───────────┐  ┌──────────────┐│
│  │tribetalk │  │chatservice│  │notification- ││
│  │          │  │           │  │service       ││
│  └────┬─────┘  └─────┬─────┘  └──────┬───────┘│
│       │              │                │        │
│       └──────────────┼────────────────┘        │
│                      │                         │
│         ┌────────────▼──────────────┐          │
│         │   Grafana Agent           │          │
│         │   (DaemonSet)             │          │
│         │   Collects:               │          │
│         │   - Logs                  │          │
│         │   - Metrics               │          │
│         │   - Traces                │          │
│         └────────────┬──────────────┘          │
└──────────────────────┼─────────────────────────┘
                       │
                       ▼
          ┌────────────────────────┐
          │   Grafana Cloud        │
          │  ┌──────────────────┐  │
          │  │ Loki (Logs)      │  │
          │  │ Prometheus (Met) │  │
          │  │ Tempo (Traces)   │  │
          │  │ Grafana (Viz)    │  │
          │  └──────────────────┘  │
          └────────────────────────┘
```

---

## Step 1: Grafana Cloud Setup

### 1.1 Create Account

1. Go to: https://grafana.com/auth/sign-up/create-user
2. Select **"Free Forever"** plan
3. Complete registration (no credit card required)
4. Verify your email

### 1.2 Get Prometheus Credentials

1. In Grafana Cloud portal, navigate to **Connections** → **Add new connection**
2. Search for **"Hosted Prometheus metrics"** or **"Grafana Cloud Prometheus"**
3. Click **"Send Metrics"** or **"Via Grafana Alloy"**
4. Generate an API token:
   - Token name: `tribetalk-observability`
   - Expiration: No expiry (or 365 days)
   - Scopes: `set:alloy-data-write`
5. **Copy and save**:
   - Remote Write URL: `https://prometheus-prod-XX.grafana.net/api/prom/push`
   - Username: Your instance ID (e.g., `2865739`)
   - Password: The API token (starts with `glc_`)

### 1.3 Get Loki Credentials

1. Navigate to **Connections** → **Hosted Logs** (or search "Loki")
2. Click **"Send Logs"**
3. **Copy and save**:
   - URL: `https://logs-prod-XXX.grafana.net/loki/api/v1/push`
   - Username: Your instance ID (e.g., `1428546`)
   - Password: Same API token as Prometheus

### 1.4 Get Tempo Credentials

1. Navigate to **Connections** → **Hosted Traces** (or search "Tempo")
2. Click **"Send Traces"**
3. **Copy and save**:
   - Endpoint: `tempo-prod-XX.grafana.net:443`
   - Username: Your instance ID (e.g., `1422856`)
   - Password: Same API token

> **Note**: You can use the same API token for all three services!

---

## Step 2: Add Dependencies

### 2.1 Update chatservice

Edit `ChatService/pom.xml` and add before `</dependencies>`:

```xml
<!-- Observability Dependencies -->
<!-- Micrometer for Prometheus metrics -->
<dependency>
    <groupId>io.micrometer</groupId>
    <artifactId>micrometer-registry-prometheus</artifactId>
</dependency>

<!-- OpenTelemetry for distributed tracing -->
<dependency>
    <groupId>io.micrometer</groupId>
    <artifactId>micrometer-tracing-bridge-otel</artifactId>
</dependency>

<dependency>
    <groupId>io.opentelemetry</groupId>
    <artifactId>opentelemetry-exporter-otlp</artifactId>
</dependency>

<!-- Loki Logback Appender for centralized logging -->
<dependency>
    <groupId>com.github.loki4j</groupId>
    <artifactId>loki-logback-appender</artifactId>
    <version>1.4.2</version>
</dependency>
```

### 2.2 Update notification-service

Edit `notification-service/pom.xml` and add the same dependencies as above.

### 2.3 tribetalk

✅ Already has all required dependencies - no changes needed!

---

## Step 3: Deploy Grafana Agent

### 3.1 Create Observability Namespace

Create `k8s/observability/namespace.yaml`:

```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: observability
```

Apply:
```bash
kubectl apply -f k8s/observability/namespace.yaml
```

### 3.2 Create Grafana Cloud Secret

Create `k8s/observability/grafana-cloud-secret.yaml`:

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: grafana-cloud-credentials
  namespace: observability
type: Opaque
stringData:
  prometheus-url: "YOUR_PROMETHEUS_URL"
  prometheus-username: "YOUR_PROMETHEUS_USERNAME"
  prometheus-password: "YOUR_API_TOKEN"
  loki-url: "YOUR_LOKI_URL"
  loki-username: "YOUR_LOKI_USERNAME"
  loki-password: "YOUR_API_TOKEN"
  tempo-endpoint: "YOUR_TEMPO_ENDPOINT"
  tempo-username: "YOUR_TEMPO_USERNAME"
  tempo-password: "YOUR_API_TOKEN"
```

**Replace placeholders** with your actual credentials from Step 1.

Apply:
```bash
kubectl apply -f k8s/observability/grafana-cloud-secret.yaml
```

### 3.3 Create Grafana Agent ConfigMap

Create `k8s/observability/grafana-agent-config.yaml`:

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: grafana-agent-config
  namespace: observability
data:
  agent.yaml: |
    server:
      log_level: info

    metrics:
      global:
        scrape_interval: 15s
        remote_write:
          - url: ${PROMETHEUS_URL}
            basic_auth:
              username: ${PROMETHEUS_USERNAME}
              password: ${PROMETHEUS_PASSWORD}
      configs:
        - name: default
          scrape_configs:
            - job_name: 'kubernetes-pods'
              kubernetes_sd_configs:
                - role: pod
              relabel_configs:
                - source_labels: [__meta_kubernetes_pod_annotation_prometheus_io_scrape]
                  action: keep
                  regex: true
                - source_labels: [__meta_kubernetes_pod_annotation_prometheus_io_path]
                  action: replace
                  target_label: __metrics_path__
                  regex: (.+)
                - source_labels: [__address__, __meta_kubernetes_pod_annotation_prometheus_io_port]
                  action: replace
                  regex: ([^:]+)(?::\d+)?;(\d+)
                  replacement: $1:$2
                  target_label: __address__
                - action: labelmap
                  regex: __meta_kubernetes_pod_label_(.+)
                - source_labels: [__meta_kubernetes_namespace]
                  action: replace
                  target_label: kubernetes_namespace
                - source_labels: [__meta_kubernetes_pod_name]
                  action: replace
                  target_label: kubernetes_pod_name

    logs:
      configs:
        - name: default
          clients:
            - url: ${LOKI_URL}
              basic_auth:
                username: ${LOKI_USERNAME}
                password: ${LOKI_PASSWORD}
          positions:
            filename: /tmp/positions.yaml
          scrape_configs:
            - job_name: kubernetes-pods
              kubernetes_sd_configs:
                - role: pod
              pipeline_stages:
                - cri: {}
              relabel_configs:
                - source_labels: [__meta_kubernetes_pod_node_name]
                  target_label: __host__
                - action: labelmap
                  regex: __meta_kubernetes_pod_label_(.+)
                - action: replace
                  replacement: $1
                  separator: /
                  source_labels:
                    - __meta_kubernetes_namespace
                    - __meta_kubernetes_pod_name
                  target_label: job
                - action: replace
                  source_labels:
                    - __meta_kubernetes_namespace
                  target_label: namespace
                - action: replace
                  source_labels:
                    - __meta_kubernetes_pod_name
                  target_label: pod
                - action: replace
                  source_labels:
                    - __meta_kubernetes_pod_container_name
                  target_label: container

    traces:
      configs:
        - name: default
          receivers:
            otlp:
              protocols:
                grpc:
                  endpoint: 0.0.0.0:4317
                http:
                  endpoint: 0.0.0.0:4318
          remote_write:
            - endpoint: ${TEMPO_ENDPOINT}
              basic_auth:
                username: ${TEMPO_USERNAME}
                password: ${TEMPO_PASSWORD}
```

Apply:
```bash
kubectl apply -f k8s/observability/grafana-agent-config.yaml
```

### 3.4 Deploy Grafana Agent DaemonSet

Create `k8s/observability/grafana-agent.yaml`:

```yaml
apiVersion: v1
kind: ServiceAccount
metadata:
  name: grafana-agent
  namespace: observability
---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: grafana-agent
rules:
  - apiGroups: [""]
    resources:
      - nodes
      - nodes/proxy
      - services
      - endpoints
      - pods
    verbs: ["get", "list", "watch"]
  - apiGroups: [""]
    resources:
      - configmaps
    verbs: ["get"]
---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: grafana-agent
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: ClusterRole
  name: grafana-agent
subjects:
  - kind: ServiceAccount
    name: grafana-agent
    namespace: observability
---
apiVersion: v1
kind: Service
metadata:
  name: grafana-agent
  namespace: observability
spec:
  selector:
    app: grafana-agent
  ports:
    - name: otlp-grpc
      port: 4317
      targetPort: 4317
    - name: otlp-http
      port: 4318
      targetPort: 4318
---
apiVersion: apps/v1
kind: DaemonSet
metadata:
  name: grafana-agent
  namespace: observability
spec:
  selector:
    matchLabels:
      app: grafana-agent
  template:
    metadata:
      labels:
        app: grafana-agent
    spec:
      serviceAccountName: grafana-agent
      containers:
        - name: agent
          image: grafana/agent:latest
          imagePullPolicy: IfNotPresent
          args:
            - -config.file=/etc/agent/agent.yaml
            - -server.http.address=0.0.0.0:12345
          env:
            - name: HOSTNAME
              valueFrom:
                fieldRef:
                  fieldPath: spec.nodeName
            - name: PROMETHEUS_URL
              valueFrom:
                secretKeyRef:
                  name: grafana-cloud-credentials
                  key: prometheus-url
            - name: PROMETHEUS_USERNAME
              valueFrom:
                secretKeyRef:
                  name: grafana-cloud-credentials
                  key: prometheus-username
            - name: PROMETHEUS_PASSWORD
              valueFrom:
                secretKeyRef:
                  name: grafana-cloud-credentials
                  key: prometheus-password
            - name: LOKI_URL
              valueFrom:
                secretKeyRef:
                  name: grafana-cloud-credentials
                  key: loki-url
            - name: LOKI_USERNAME
              valueFrom:
                secretKeyRef:
                  name: grafana-cloud-credentials
                  key: loki-username
            - name: LOKI_PASSWORD
              valueFrom:
                secretKeyRef:
                  name: grafana-cloud-credentials
                  key: loki-password
            - name: TEMPO_ENDPOINT
              valueFrom:
                secretKeyRef:
                  name: grafana-cloud-credentials
                  key: tempo-endpoint
            - name: TEMPO_USERNAME
              valueFrom:
                secretKeyRef:
                  name: grafana-cloud-credentials
                  key: tempo-username
            - name: TEMPO_PASSWORD
              valueFrom:
                secretKeyRef:
                  name: grafana-cloud-credentials
                  key: tempo-password
          ports:
            - containerPort: 12345
              name: http-metrics
            - containerPort: 4317
              name: otlp-grpc
            - containerPort: 4318
              name: otlp-http
          volumeMounts:
            - name: config
              mountPath: /etc/agent
            - name: varlog
              mountPath: /var/log
            - name: varlibdockercontainers
              mountPath: /var/lib/docker/containers
              readOnly: true
      volumes:
        - name: config
          configMap:
            name: grafana-agent-config
        - name: varlog
          hostPath:
            path: /var/log
        - name: varlibdockercontainers
          hostPath:
            path: /var/lib/docker/containers
```

Apply:
```bash
kubectl apply -f k8s/observability/grafana-agent.yaml
```

Verify:
```bash
kubectl get pods -n observability
kubectl get daemonset -n observability
```

Expected output:
```
NAME                  READY   STATUS    RESTARTS   AGE
grafana-agent-xxxxx   1/1     Running   0          30s
grafana-agent-yyyyy   1/1     Running   0          30s
```

---

## Step 4: Update Deployments

Add Prometheus scraping annotations to all service deployments.

### 4.1 Update tribetalk Deployment

Edit `k8s/deployments/tribetalk.yaml` and add annotations to `spec.template.metadata`:

```yaml
spec:
  template:
    metadata:
      labels:
        app: tribetalk
        version: v1
      annotations:
        prometheus.io/scrape: "true"
        prometheus.io/port: "8080"
        prometheus.io/path: "/actuator/prometheus"
    spec:
      # ... rest of spec
```

### 4.2 Update chatservice Deployment

Edit `k8s/deployments/chatservice.yaml`:

```yaml
spec:
  template:
    metadata:
      labels:
        app: chatservice
        version: v1
      annotations:
        prometheus.io/scrape: "true"
        prometheus.io/port: "8081"
        prometheus.io/path: "/actuator/prometheus"
    spec:
      # ... rest of spec
```

### 4.3 Update notification-service Deployment

Edit `k8s/deployments/notification-service.yaml`:

```yaml
spec:
  template:
    metadata:
      labels:
        app: notification-service
        version: v1
      annotations:
        prometheus.io/scrape: "true"
        prometheus.io/port: "8082"
        prometheus.io/path: "/actuator/prometheus"
    spec:
      # ... rest of spec
```

Apply all changes:
```bash
kubectl apply -f k8s/deployments/tribetalk.yaml
kubectl apply -f k8s/deployments/chatservice.yaml
kubectl apply -f k8s/deployments/notification-service.yaml
```

---

## Step 5: Rebuild and Deploy Services

### 5.1 Rebuild chatservice

```bash
cd ChatService
mvn clean package -DskipTests
docker build -t 430006376054.dkr.ecr.eu-north-1.amazonaws.com/chatservice:v1.5 .
docker push 430006376054.dkr.ecr.eu-north-1.amazonaws.com/chatservice:v1.5
```

Update `k8s/deployments/chatservice.yaml` image tag to `v1.5` and apply:
```bash
kubectl apply -f k8s/deployments/chatservice.yaml
```

### 5.2 Rebuild notification-service

```bash
cd notification-service
mvn clean package -DskipTests
docker build -t 430006376054.dkr.ecr.eu-north-1.amazonaws.com/notification-service:v1.2 .
docker push 430006376054.dkr.ecr.eu-north-1.amazonaws.com/notification-service:v1.2
```

Update `k8s/deployments/notification-service.yaml` image tag to `v1.2` and apply:
```bash
kubectl apply -f k8s/deployments/notification-service.yaml
```

### 5.3 Verify Pods

```bash
kubectl get pods
kubectl logs <pod-name> --tail=50
```

Check for observability-related startup messages.

---

## Step 6: Verify Data Collection

### 6.1 Check Grafana Agent Logs

```bash
kubectl logs -n observability -l app=grafana-agent --tail=50
```

Look for:
- ✅ Successful connection to Grafana Cloud
- ✅ Pod discovery messages
- ✅ Metrics scraping logs
- ✅ Log shipping confirmations

### 6.2 Verify Metrics Endpoint

```bash
kubectl port-forward deployment/tribetalk 8080:8080
curl http://localhost:8080/actuator/prometheus
```

Should return Prometheus metrics in text format.

### 6.3 Access Grafana Cloud

Go to: `https://YOUR_INSTANCE.grafana.net/`

---

## Step 7: Create Dashboards

### 7.1 View Logs in Loki

1. Click **Explore** in left sidebar
2. Select **Loki** as data source
3. Try these queries:

```
{namespace="default"}
{namespace="default", app="tribetalk"}
{namespace="default", app="chatservice"} |= "error"
{namespace="default"} | json | level="ERROR"
```

### 7.2 View Metrics in Prometheus

1. Click **Explore**
2. Select **Prometheus** as data source
3. Try these queries:

```
# Check if services are up
up{job=~".*tribetalk.*"}

# HTTP request rate
rate(http_server_requests_seconds_count[5m])

# JVM memory usage
jvm_memory_used_bytes{area="heap"}

# Error rate
rate(http_server_requests_seconds_count{status=~"5.."}[5m])
```

### 7.3 View Traces in Tempo

1. Click **Explore**
2. Select **Tempo** as data source
3. Click **Search**
4. Select recent traces
5. Click on a trace to see the distributed request flow

### 7.4 Import Pre-built Dashboards

1. Go to **Dashboards** → **New** → **Import**
2. Import these dashboard IDs:
   - **4701** - JVM (Micrometer)
   - **11378** - Spring Boot Statistics
   - **12900** - Spring Boot Observability

---

## Troubleshooting

### Logs Not Appearing

**Check Grafana Agent**:
```bash
kubectl logs -n observability -l app=grafana-agent | grep -i error
```

**Verify Secret**:
```bash
kubectl get secret -n observability grafana-cloud-credentials -o yaml
```

**Check Loki URL**:
```bash
kubectl exec -n observability -it <grafana-agent-pod> -- sh
# Inside pod:
env | grep LOKI
```

### Metrics Not Appearing

**Verify Prometheus Endpoint**:
```bash
kubectl port-forward deployment/tribetalk 8080:8080
curl http://localhost:8080/actuator/prometheus | head -20
```

**Check Annotations**:
```bash
kubectl get pod <pod-name> -o yaml | grep -A 3 annotations
```

**Verify Agent is Scraping**:
```bash
kubectl logs -n observability -l app=grafana-agent | grep "tribetalk"
```

### Traces Not Appearing

**Check OTLP Receiver**:
```bash
kubectl logs -n observability -l app=grafana-agent | grep otlp
```

**Verify Tempo Endpoint**:
```bash
kubectl get secret -n observability grafana-cloud-credentials -o jsonpath='{.data.tempo-endpoint}' | base64 -d
```

**Test Trace Generation**:
Make a request to your application and check Tempo within 1-2 minutes.

### Agent Not Starting

**Check Pod Status**:
```bash
kubectl describe pod -n observability -l app=grafana-agent
```

**Check ConfigMap**:
```bash
kubectl get configmap -n observability grafana-agent-config -o yaml
```

---

## Cost and Scaling

### Free Tier Limits

- **Logs**: 50GB/month
- **Metrics**: 10,000 series
- **Traces**: 50GB/month
- **Retention**: 14 days
- **Users**: 3

### Monitoring Usage

1. Go to Grafana Cloud → **Billing**
2. View current usage for logs, metrics, traces
3. Set up alerts for approaching limits

### Scaling Beyond Free Tier

If you exceed free tier:
- **Grafana Cloud Pro**: $50/month (500GB logs, 100k metrics)
- **Self-hosted**: Deploy own Loki/Prometheus/Tempo stack

### Optimizing Costs

**Reduce Log Volume**:
- Filter out debug logs in production
- Sample high-volume logs
- Exclude health check logs

**Reduce Metrics**:
- Disable unused metrics
- Increase scrape interval
- Use metric relabeling

**Reduce Traces**:
- Lower sampling rate (e.g., 10% instead of 100%)
- Sample only slow requests
- Exclude health checks

---

## Summary

✅ **Complete observability stack deployed**
✅ **All 3 services instrumented**
✅ **Grafana Agent collecting data**
✅ **Data flowing to Grafana Cloud**
✅ **Dashboards and queries ready**

**Total Implementation Time**: ~1-2 hours
**Monthly Cost**: $0 (free tier)

### What You Have Now

- **Centralized Logging**: All logs searchable in one place
- **Performance Metrics**: Request rates, latencies, errors, JVM stats
- **Distributed Tracing**: Request flow across all microservices
- **Alerting**: Set up alerts for errors, high latency, etc.
- **Dashboards**: Pre-built and custom dashboards

### Next Steps

1. Set up alerts for critical errors
2. Create custom dashboards for business metrics
3. Configure log retention policies
4. Set up Slack/email notifications
5. Document common queries for your team

---

## Quick Reference

### Useful Commands

```bash
# Check agent status
kubectl get pods -n observability

# View agent logs
kubectl logs -n observability -l app=grafana-agent --tail=100

# Check service metrics
kubectl port-forward deployment/tribetalk 8080:8080
curl http://localhost:8080/actuator/prometheus

# Restart agent
kubectl rollout restart daemonset/grafana-agent -n observability

# View pod annotations
kubectl get pod <pod-name> -o yaml | grep -A 5 annotations
```

### Useful Queries

**Logs (Loki)**:
```
{namespace="default", app="tribetalk"} |= "error"
{namespace="default"} | json | level="ERROR"
{namespace="default", app="chatservice"} | logfmt | duration > 1s
```

**Metrics (Prometheus)**:
```
rate(http_server_requests_seconds_count[5m])
histogram_quantile(0.95, rate(http_server_requests_seconds_bucket[5m]))
jvm_memory_used_bytes / jvm_memory_max_bytes
```

---

**Documentation Version**: 1.0  
**Last Updated**: December 2025  
**Author**: TribeTalk DevOps Team

---

## Implementation Results & Lessons Learned

### ✅ Successfully Deployed Services

| Service | Version | Status | Notes |
|---------|---------|--------|-------|
| tribetalk | v1.1 | ✅ Running | Already had observability dependencies |
| chatservice | v1.5 | ✅ Running | Added observability dependencies |
| notification-service | v1.3 | ✅ Running | Added observability + WebSocket config |
| Grafana Agent | latest | ✅ Running | 2 pods (DaemonSet on each node) |

### Common Issues and Solutions

#### Issue #1: Platform Mismatch Error

**Symptom**:
```
Error: no match for platform in manifest: not found
ImagePullBackOff status
```

**Cause**: Docker images built on Mac (ARM64/Apple Silicon) cannot run on EKS nodes (AMD64/x86_64)

**Solution**: Always build with platform flag
```bash
docker build --platform linux/amd64 -t <image>:<tag> .
```

#### Issue #2: notification-service CrashLoopBackOff

**Symptom**:
```
Error creating bean with name 'notificationServiceImpl': 
Unsatisfied dependency: No qualifying bean of type 
'org.springframework.messaging.simp.SimpMessagingTemplate'
```

**Cause**: WebSocket dependency present in pom.xml but missing configuration class

**Solution**: Create WebSocket configuration

Create `notification-service/src/main/java/com/learning/notification_service/config/WebSocketConfig.java`:

```java
package com.learning.notification_service.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBroker Configurer;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        config.enableSimpleBroker("/topic", "/queue");
        config.setApplicationDestinationPrefixes("/app");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws-notifications")
                .setAllowedOriginPatterns("*")
                .withSockJS();
    }
}
```

### Verification Checklist

After deployment, verify:

- [ ] All pods running: `kubectl get pods`
- [ ] Grafana Agent discovering services: `kubectl logs -n observability -l app=grafana-agent | grep -E "(chatservice|notification|tribetalk)"`
- [ ] Metrics endpoints accessible: `kubectl port-forward deployment/tribetalk 8080:8080 && curl http://localhost:8080/actuator/prometheus`
- [ ] Data appearing in Grafana Cloud dashboard
- [ ] No error logs in services: `kubectl logs <pod-name> --tail=50`

### Build Commands Reference

**Complete rebuild and deploy workflow**:

```bash
# 1. Login to ECR
aws ecr get-login-password --region eu-north-1 | docker login --username AWS --password-stdin 430006376054.dkr.ecr.eu-north-1.amazonaws.com

# 2. Build chatservice
cd ChatService
mvn clean package -DskipTests
docker build --platform linux/amd64 -t 430006376054.dkr.ecr.eu-north-1.amazonaws.com/chatservice:v1.5 .
docker push 430006376054.dkr.ecr.eu-north-1.amazonaws.com/chatservice:v1.5

# 3. Build notification-service
cd ../notification-service
mvn clean package -DskipTests
docker build --platform linux/amd64 -t 430006376054.dkr.ecr.eu-north-1.amazonaws.com/notification-service:v1.3 .
docker push 430006376054.dkr.ecr.eu-north-1.amazonaws.com/notification-service:v1.3

# 4. Update deployments
cd ..
kubectl apply -f k8s/deployments/chatservice.yaml
kubectl apply -f k8s/deployments/notification-service.yaml

# 5. Verify rollout
kubectl rollout status deployment/chatservice
kubectl rollout status deployment/notification-service
```

### Grafana Agent Discovery

The Grafana Agent automatically discovers pods with Prometheus annotations:

```
✅ chatservice (v1.5) - Port 8081 - /actuator/prometheus
✅ tribetalk (v1.1) - Port 8080 - /actuator/prometheus  
✅ notification-service (v1.3) - Port 8082 - /actuator/prometheus
```

All services are being scraped every 15 seconds for metrics.

### Final Deployment Status

```bash
$ kubectl get pods
NAME                                    READY   STATUS    RESTARTS   AGE
chatservice-75ccc5f78c-bww27            1/1     Running   0          15m
notification-service-7f84768dc8-4dg9s   1/1     Running   0          5m
tribetalk-7b958c949b-r8txf              1/1     Running   0          40m
tribe-talk-frontend-77db754f98-cvb4l    1/1     Running   0          40h

$ kubectl get pods -n observability
NAME                  READY   STATUS    RESTARTS   AGE
grafana-agent-2qz2g   1/1     Running   0          45m
grafana-agent-tjjgz   1/1     Running   0          45m
```

### Access Your Observability Data

**Grafana Cloud Dashboard**: https://rahisrazak.grafana.net/

**Quick Queries to Try**:

1. **Logs**: `{namespace="default", app="tribetalk"} |= "error"`
2. **Metrics**: `up{job=~".*tribetalk.*"}`
3. **Traces**: Navigate to Explore → Tempo → Search

---

**Implementation Complete!** 🎉

All TribeTalk services now have complete observability with centralized logging, metrics, and distributed tracing at $0/month cost.

