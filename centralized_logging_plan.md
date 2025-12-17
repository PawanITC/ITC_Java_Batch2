# Centralized Logging Implementation Plan for TribeTalk

## Overview

Implement centralized logging for all TribeTalk microservices using the **EFK Stack** (Elasticsearch, Fluentd, Kibana) on Kubernetes.

**Benefits**:
- Single location for all application logs
- Real-time log search and analysis
- Log retention and archival
- Troubleshooting and debugging
- Performance monitoring
- Compliance and audit trails

---

## Architecture Options

### Option 1: EFK Stack (Recommended for Kubernetes)
```
┌─────────────────────────────────────────────────┐
│              Kibana (UI)                        │
│         http://kibana.tribetalk.com             │
└────────────────┬────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────┐
│         Elasticsearch Cluster                   │
│    (3 nodes for HA - master, data, ingest)     │
└────────────────▲────────────────────────────────┘
                 │
┌────────────────┴────────────────────────────────┐
│            Fluentd DaemonSet                    │
│   (Runs on every node, collects logs)          │
└────────────────▲────────────────────────────────┘
                 │
┌────────────────┴────────────────────────────────┐
│         Application Pods                        │
│  tribetalk | chatservice | notification-service │
│           tribe-talk-frontend                   │
└─────────────────────────────────────────────────┘
```

### Option 2: AWS CloudWatch Logs
```
Application Pods → Fluentd → CloudWatch Logs → CloudWatch Insights
```

### Option 3: Grafana Loki (Lightweight)
```
Application Pods → Promtail → Loki → Grafana
```

---

## Recommended: EFK Stack Implementation

### Phase 1: Install Elasticsearch

#### 1.1 Create Namespace

```yaml
# k8s/logging/namespace.yaml
apiVersion: v1
kind: Namespace
metadata:
  name: logging
```

#### 1.2 Elasticsearch StatefulSet

```yaml
# k8s/logging/elasticsearch.yaml
apiVersion: v1
kind: Service
metadata:
  name: elasticsearch
  namespace: logging
  labels:
    app: elasticsearch
spec:
  selector:
    app: elasticsearch
  clusterIP: None
  ports:
  - port: 9200
    name: rest
  - port: 9300
    name: inter-node
---
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: elasticsearch
  namespace: logging
spec:
  serviceName: elasticsearch
  replicas: 3
  selector:
    matchLabels:
      app: elasticsearch
  template:
    metadata:
      labels:
        app: elasticsearch
    spec:
      containers:
      - name: elasticsearch
        image: docker.elastic.co/elasticsearch/elasticsearch:8.11.0
        resources:
          limits:
            cpu: 1000m
            memory: 2Gi
          requests:
            cpu: 500m
            memory: 1Gi
        ports:
        - containerPort: 9200
          name: rest
          protocol: TCP
        - containerPort: 9300
          name: inter-node
          protocol: TCP
        volumeMounts:
        - name: data
          mountPath: /usr/share/elasticsearch/data
        env:
        - name: cluster.name
          value: tribetalk-logs
        - name: node.name
          valueFrom:
            fieldRef:
              fieldPath: metadata.name
        - name: discovery.seed_hosts
          value: "elasticsearch-0.elasticsearch,elasticsearch-1.elasticsearch,elasticsearch-2.elasticsearch"
        - name: cluster.initial_master_nodes
          value: "elasticsearch-0,elasticsearch-1,elasticsearch-2"
        - name: ES_JAVA_OPTS
          value: "-Xms1g -Xmx1g"
        - name: xpack.security.enabled
          value: "false"
  volumeClaimTemplates:
  - metadata:
      name: data
    spec:
      accessModes: [ "ReadWriteOnce" ]
      storageClassName: gp3
      resources:
        requests:
          storage: 30Gi
```

### Phase 2: Install Fluentd

#### 2.1 Fluentd ConfigMap

```yaml
# k8s/logging/fluentd-config.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: fluentd-config
  namespace: logging
data:
  fluent.conf: |
    # Input: Kubernetes container logs
    <source>
      @type tail
      @id in_tail_container_logs
      path /var/log/containers/*.log
      pos_file /var/log/fluentd-containers.log.pos
      tag kubernetes.*
      read_from_head true
      <parse>
        @type json
        time_format %Y-%m-%dT%H:%M:%S.%NZ
      </parse>
    </source>

    # Filter: Add Kubernetes metadata
    <filter kubernetes.**>
      @type kubernetes_metadata
      @id filter_kube_metadata
    </filter>

    # Filter: Parse application logs
    <filter kubernetes.var.log.containers.tribetalk-**.log>
      @type parser
      key_name log
      reserve_data true
      <parse>
        @type multi_format
        <pattern>
          format json
          time_key timestamp
          time_format %Y-%m-%d %H:%M:%S
        </pattern>
        <pattern>
          format regexp
          expression /^(?<timestamp>\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\.\d{3})\s+(?<level>\w+)\s+(?<thread>[\w-]+)\s+(?<logger>[\w.]+)\s+:\s+(?<message>.*)$/
          time_key timestamp
          time_format %Y-%m-%d %H:%M:%S.%L
        </pattern>
      </parse>
    </filter>

    # Filter: Add custom fields
    <filter kubernetes.**>
      @type record_transformer
      <record>
        cluster_name tribetalk-cluster
        environment production
      </record>
    </filter>

    # Output: Elasticsearch
    <match kubernetes.**>
      @type elasticsearch
      @id out_es
      @log_level info
      include_tag_key true
      host elasticsearch.logging.svc.cluster.local
      port 9200
      logstash_format true
      logstash_prefix tribetalk
      <buffer>
        @type file
        path /var/log/fluentd-buffers/kubernetes.system.buffer
        flush_mode interval
        retry_type exponential_backoff
        flush_thread_count 2
        flush_interval 5s
        retry_forever false
        retry_max_interval 30
        chunk_limit_size 2M
        queue_limit_length 8
        overflow_action block
      </buffer>
    </match>
```

#### 2.2 Fluentd DaemonSet

```yaml
# k8s/logging/fluentd-daemonset.yaml
apiVersion: v1
kind: ServiceAccount
metadata:
  name: fluentd
  namespace: logging
---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: fluentd
rules:
- apiGroups:
  - ""
  resources:
  - pods
  - namespaces
  verbs:
  - get
  - list
  - watch
---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: fluentd
roleRef:
  kind: ClusterRole
  name: fluentd
  apiGroup: rbac.authorization.k8s.io
subjects:
- kind: ServiceAccount
  name: fluentd
  namespace: logging
---
apiVersion: apps/v1
kind: DaemonSet
metadata:
  name: fluentd
  namespace: logging
  labels:
    app: fluentd
spec:
  selector:
    matchLabels:
      app: fluentd
  template:
    metadata:
      labels:
        app: fluentd
    spec:
      serviceAccount: fluentd
      serviceAccountName: fluentd
      tolerations:
      - key: node-role.kubernetes.io/master
        effect: NoSchedule
      containers:
      - name: fluentd
        image: fluent/fluentd-kubernetes-daemonset:v1-debian-elasticsearch
        env:
        - name: FLUENT_ELASTICSEARCH_HOST
          value: "elasticsearch.logging.svc.cluster.local"
        - name: FLUENT_ELASTICSEARCH_PORT
          value: "9200"
        - name: FLUENT_ELASTICSEARCH_SCHEME
          value: "http"
        - name: FLUENTD_SYSTEMD_CONF
          value: disable
        resources:
          limits:
            memory: 512Mi
          requests:
            cpu: 100m
            memory: 200Mi
        volumeMounts:
        - name: varlog
          mountPath: /var/log
        - name: varlibdockercontainers
          mountPath: /var/lib/docker/containers
          readOnly: true
        - name: fluentd-config
          mountPath: /fluentd/etc/fluent.conf
          subPath: fluent.conf
      terminationGracePeriodSeconds: 30
      volumes:
      - name: varlog
        hostPath:
          path: /var/log
      - name: varlibdockercontainers
        hostPath:
          path: /var/lib/docker/containers
      - name: fluentd-config
        configMap:
          name: fluentd-config
```

### Phase 3: Install Kibana

```yaml
# k8s/logging/kibana.yaml
apiVersion: v1
kind: Service
metadata:
  name: kibana
  namespace: logging
  labels:
    app: kibana
spec:
  ports:
  - port: 5601
  selector:
    app: kibana
  type: LoadBalancer
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: kibana
  namespace: logging
  labels:
    app: kibana
spec:
  replicas: 1
  selector:
    matchLabels:
      app: kibana
  template:
    metadata:
      labels:
        app: kibana
    spec:
      containers:
      - name: kibana
        image: docker.elastic.co/kibana/kibana:8.11.0
        resources:
          limits:
            cpu: 1000m
            memory: 1Gi
          requests:
            cpu: 500m
            memory: 512Mi
        env:
        - name: ELASTICSEARCH_URL
          value: http://elasticsearch:9200
        - name: ELASTICSEARCH_HOSTS
          value: http://elasticsearch:9200
        ports:
        - containerPort: 5601
```

---

## Phase 4: Configure Application Logging

### 4.1 Update Spring Boot Applications (tribetalk, chatservice, notification-service)

**application.yml**:
```yaml
logging:
  pattern:
    console: "%d{yyyy-MM-dd HH:mm:ss.SSS} %5p ${PID:- } --- [%t] %-40.40logger{39} : %m%n"
  level:
    root: INFO
    com.learning.tribetalk: DEBUG
    org.springframework.web: DEBUG
    org.hibernate.SQL: DEBUG
```

**logback-spring.xml** (optional for JSON logging):
```xml
<?xml version="1.0" encoding="UTF-8"?>
<configuration>
    <appender name="CONSOLE" class="ch.qos.logback.core.ConsoleAppender">
        <encoder class="net.logstash.logback.encoder.LogstashEncoder">
            <customFields>{"service":"tribetalk"}</customFields>
        </encoder>
    </appender>

    <root level="INFO">
        <appender-ref ref="CONSOLE" />
    </root>
</configuration>
```

**Add dependency** (pom.xml):
```xml
<dependency>
    <groupId>net.logstash.logback</groupId>
    <artifactId>logstash-logback-encoder</artifactId>
    <version>7.4</version>
</dependency>
```

### 4.2 Frontend Logging (Optional)

For frontend logs, you can send to a logging endpoint:

```javascript
// tribe-talk-frontend/src/utils/logger.js
export const logger = {
  info: (message, meta = {}) => {
    console.log(message, meta);
    sendToBackend('INFO', message, meta);
  },
  error: (message, error, meta = {}) => {
    console.error(message, error, meta);
    sendToBackend('ERROR', message, { ...meta, error: error.message, stack: error.stack });
  }
};

const sendToBackend = async (level, message, meta) => {
  try {
    await fetch('/api/logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ level, message, meta, timestamp: new Date().toISOString() })
    });
  } catch (e) {
    // Ignore logging errors
  }
};
```

---

## Phase 5: Deploy and Verify

### 5.1 Deploy EFK Stack

```bash
# Create namespace
kubectl apply -f k8s/logging/namespace.yaml

# Deploy Elasticsearch
kubectl apply -f k8s/logging/elasticsearch.yaml

# Wait for Elasticsearch to be ready
kubectl wait --for=condition=ready pod -l app=elasticsearch -n logging --timeout=300s

# Deploy Fluentd
kubectl apply -f k8s/logging/fluentd-config.yaml
kubectl apply -f k8s/logging/fluentd-daemonset.yaml

# Deploy Kibana
kubectl apply -f k8s/logging/kibana.yaml
```

### 5.2 Verify Installation

```bash
# Check Elasticsearch
kubectl get pods -n logging -l app=elasticsearch
kubectl logs -n logging elasticsearch-0

# Check Fluentd
kubectl get pods -n logging -l app=fluentd
kubectl logs -n logging -l app=fluentd --tail=50

# Check Kibana
kubectl get svc -n logging kibana
```

### 5.3 Access Kibana

```bash
# Get Kibana URL
kubectl get svc -n logging kibana

# Or port-forward
kubectl port-forward -n logging svc/kibana 5601:5601

# Access: http://localhost:5601
```

---

## Alternative: AWS CloudWatch Logs

### CloudWatch Container Insights

**Install CloudWatch agent**:
```bash
# Create IAM policy for CloudWatch
aws iam create-policy \
  --policy-name TribeTalkCloudWatchPolicy \
  --policy-document file://cloudwatch-policy.json

# Attach to EKS node role
aws iam attach-role-policy \
  --role-name tribetalk-eks-node-role \
  --policy-arn arn:aws:iam::ACCOUNT_ID:policy/TribeTalkCloudWatchPolicy

# Install CloudWatch agent
kubectl apply -f https://raw.githubusercontent.com/aws-samples/amazon-cloudwatch-container-insights/latest/k8s-deployment-manifest-templates/deployment-mode/daemonset/container-insights-monitoring/quickstart/cwagent-fluentd-quickstart.yaml
```

**Benefits**:
- Native AWS integration
- No infrastructure to manage
- Pay-as-you-go pricing
- CloudWatch Insights for queries

---

## Alternative: Grafana Loki

### Loki Stack (Lightweight)

```bash
# Add Grafana Helm repo
helm repo add grafana https://grafana.github.io/helm-charts
helm repo update

# Install Loki stack
helm install loki grafana/loki-stack \
  --namespace logging \
  --create-namespace \
  --set grafana.enabled=true \
  --set prometheus.enabled=true \
  --set promtail.enabled=true
```

**Benefits**:
- Lightweight (less resource-intensive than Elasticsearch)
- Integrates with Grafana
- Cost-effective
- Good for smaller deployments

---

## Log Retention and Archival

### Elasticsearch Index Lifecycle Management

```yaml
# Create ILM policy
PUT _ilm/policy/tribetalk-logs-policy
{
  "policy": {
    "phases": {
      "hot": {
        "actions": {
          "rollover": {
            "max_age": "7d",
            "max_size": "50GB"
          }
        }
      },
      "warm": {
        "min_age": "7d",
        "actions": {
          "shrink": {
            "number_of_shards": 1
          }
        }
      },
      "delete": {
        "min_age": "30d",
        "actions": {
          "delete": {}
        }
      }
    }
  }
}
```

---

## Monitoring and Alerts

### Kibana Alerts

Create alerts for:
- Error rate spikes
- Service downtime
- High response times
- Failed authentication attempts

### Example Alert

```json
{
  "name": "High Error Rate",
  "schedule": {
    "interval": "5m"
  },
  "condition": {
    "script": {
      "source": "ctx.results[0].hits.total.value > 100"
    }
  },
  "actions": {
    "slack": {
      "webhook": "https://hooks.slack.com/...",
      "message": "High error rate detected: {{ctx.results[0].hits.total.value}} errors in 5 minutes"
    }
  }
}
```

---

## Summary

### Recommended: EFK Stack

**Pros**:
- Complete control
- Rich querying capabilities
- Excellent visualization
- Industry standard

**Cons**:
- Resource intensive
- Requires management

**Estimated Resources**:
- Elasticsearch: 3 nodes × 2GB RAM = 6GB
- Fluentd: ~200MB per node
- Kibana: 512MB-1GB

**Estimated Cost** (AWS):
- ~$150-200/month for Elasticsearch nodes
- Minimal for Fluentd (DaemonSet)
- ~$30/month for Kibana

### Quick Start Commands

```bash
# 1. Create logging namespace
kubectl create namespace logging

# 2. Deploy Elasticsearch
kubectl apply -f k8s/logging/elasticsearch.yaml

# 3. Deploy Fluentd
kubectl apply -f k8s/logging/fluentd-config.yaml
kubectl apply -f k8s/logging/fluentd-daemonset.yaml

# 4. Deploy Kibana
kubectl apply -f k8s/logging/kibana.yaml

# 5. Access Kibana
kubectl port-forward -n logging svc/kibana 5601:5601
# Open: http://localhost:5601
```

**Total Implementation Time**: 4-6 hours
