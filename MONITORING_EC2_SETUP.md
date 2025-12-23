# Monitoring Stack on Separate EC2 Instance

## Overview
Move Prometheus, Grafana, and Loki from EKS to a dedicated t3.small EC2 instance to free up ~2GB of cluster memory.

---

## Step 1: Launch EC2 Instance

### Via AWS Console
1. Go to EC2 Dashboard
2. Click "Launch Instance"
3. Configure:
   - **Name**: `tribetalk-monitoring`
   - **AMI**: Amazon Linux 2023
   - **Instance type**: t3.small (2GB RAM)
   - **Key pair**: Select or create new
   - **VPC**: Same VPC as EKS cluster
   - **Subnet**: Public subnet (for easy access)
   - **Security Group**: Create new (see below)
   - **Storage**: 20GB gp3

### Security Group Rules
| Type | Protocol | Port | Source | Description |
|------|----------|------|--------|-------------|
| SSH | TCP | 22 | Your IP | SSH access |
| Custom TCP | TCP | 3000 | Your IP | Grafana UI |
| Custom TCP | TCP | 9090 | EKS VPC CIDR | Prometheus |
| Custom TCP | TCP | 3100 | EKS VPC CIDR | Loki |

**EKS VPC CIDR**: Typically `10.0.0.0/16` (check your VPC)

### Via AWS CLI
```bash
# Create security group
aws ec2 create-security-group \
  --group-name tribetalk-monitoring-sg \
  --description "Monitoring stack security group" \
  --vpc-id <your-vpc-id> \
  --region eu-north-1

# Add rules
aws ec2 authorize-security-group-ingress \
  --group-id <sg-id> \
  --protocol tcp --port 22 --cidr <your-ip>/32

aws ec2 authorize-security-group-ingress \
  --group-id <sg-id> \
  --protocol tcp --port 3000 --cidr <your-ip>/32

aws ec2 authorize-security-group-ingress \
  --group-id <sg-id> \
  --protocol tcp --port 9090 --cidr 10.0.0.0/16

aws ec2 authorize-security-group-ingress \
  --group-id <sg-id> \
  --protocol tcp --port 3100 --cidr 10.0.0.0/16

# Launch instance
aws ec2 run-instances \
  --image-id ami-0014ce3e52359afbd \
  --instance-type t3.small \
  --key-name <your-key> \
  --security-group-ids <sg-id> \
  --subnet-id <subnet-id> \
  --tag-specifications 'ResourceType=instance,Tags=[{Key=Name,Value=tribetalk-monitoring}]' \
  --region eu-north-1
```

---

## Step 2: Install Docker on EC2

```bash
# SSH into instance
ssh -i <your-key>.pem ec2-user@<instance-public-ip>

# Update system
sudo yum update -y

# Install Docker
sudo yum install -y docker

# Start Docker
sudo systemctl start docker
sudo systemctl enable docker

# Add user to docker group
sudo usermod -a -G docker ec2-user

# Logout and login again for group changes
exit
ssh -i <your-key>.pem ec2-user@<instance-public-ip>

# Verify Docker
docker --version
```

---

## Step 3: Create Docker Compose Configuration

```bash
# Create directory
mkdir -p ~/monitoring
cd ~/monitoring

# Create docker-compose.yml
cat > docker-compose.yml << 'EOF'
version: '3.8'

services:
  prometheus:
    image: prom/prometheus:latest
    container_name: prometheus
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus-data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
      - '--storage.tsdb.retention.time=15d'
    restart: unless-stopped
    networks:
      - monitoring

  grafana:
    image: grafana/grafana:latest
    container_name: grafana
    ports:
      - "3000:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin123
      - GF_USERS_ALLOW_SIGN_UP=false
    volumes:
      - grafana-data:/var/lib/grafana
    restart: unless-stopped
    networks:
      - monitoring
    depends_on:
      - prometheus

  loki:
    image: grafana/loki:latest
    container_name: loki
    ports:
      - "3100:3100"
    volumes:
      - ./loki-config.yml:/etc/loki/local-config.yaml
      - loki-data:/loki
    command: -config.file=/etc/loki/local-config.yaml
    restart: unless-stopped
    networks:
      - monitoring

  promtail:
    image: grafana/promtail:latest
    container_name: promtail
    volumes:
      - /var/log:/var/log
      - ./promtail-config.yml:/etc/promtail/config.yml
    command: -config.file=/etc/promtail/config.yml
    restart: unless-stopped
    networks:
      - monitoring
    depends_on:
      - loki

volumes:
  prometheus-data:
  grafana-data:
  loki-data:

networks:
  monitoring:
    driver: bridge
EOF
```

---

## Step 4: Create Configuration Files

### Prometheus Configuration
```bash
cat > prometheus.yml << 'EOF'
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  # Prometheus itself
  - job_name: 'prometheus'
    static_configs:
      - targets: ['localhost:9090']

  # TribeTalk services (configure after removing from EKS)
  - job_name: 'tribetalk'
    kubernetes_sd_configs:
      - role: pod
        api_server: https://<eks-api-server>
        tls_config:
          ca_file: /var/run/secrets/kubernetes.io/serviceaccount/ca.crt
        bearer_token_file: /var/run/secrets/kubernetes.io/serviceaccount/token
    relabel_configs:
      - source_labels: [__meta_kubernetes_pod_label_app]
        action: keep
        regex: tribetalk|chatservice|notification-service
EOF
```

### Loki Configuration
```bash
cat > loki-config.yml << 'EOF'
auth_enabled: false

server:
  http_listen_port: 3100

ingester:
  lifecycler:
    address: 127.0.0.1
    ring:
      kvstore:
        store: inmemory
      replication_factor: 1
  chunk_idle_period: 5m
  chunk_retain_period: 30s

schema_config:
  configs:
    - from: 2020-05-15
      store: boltdb
      object_store: filesystem
      schema: v11
      index:
        prefix: index_
        period: 168h

storage_config:
  boltdb:
    directory: /loki/index
  filesystem:
    directory: /loki/chunks

limits_config:
  enforce_metric_name: false
  reject_old_samples: true
  reject_old_samples_max_age: 168h

chunk_store_config:
  max_look_back_period: 0s

table_manager:
  retention_deletes_enabled: false
  retention_period: 0s
EOF
```

### Promtail Configuration
```bash
cat > promtail-config.yml << 'EOF'
server:
  http_listen_port: 9080
  grpc_listen_port: 0

positions:
  filename: /tmp/positions.yaml

clients:
  - url: http://loki:3100/loki/api/v1/push

scrape_configs:
  - job_name: system
    static_configs:
      - targets:
          - localhost
        labels:
          job: varlogs
          __path__: /var/log/*log
EOF
```

---

## Step 5: Start Monitoring Stack

```bash
# Install docker-compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Start services
cd ~/monitoring
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f
```

---

## Step 6: Remove Monitoring from EKS

```bash
# From your local machine
kubectl delete namespace monitoring

# Or delete specific resources
kubectl delete deployment prometheus-monitoring-kube-prometheus-prometheus -n monitoring
kubectl delete deployment monitoring-grafana -n monitoring
kubectl delete statefulset loki -n monitoring
kubectl delete daemonset promtail -n monitoring

# Verify removal
kubectl get pods --all-namespaces | grep -E "prometheus|grafana|loki|promtail"
```

**Memory freed in EKS**: ~2-2.5GB

---

## Step 7: Access Monitoring

### Grafana
- **URL**: `http://<ec2-public-ip>:3000`
- **Username**: `admin`
- **Password**: `admin123`

### Prometheus
- **URL**: `http://<ec2-private-ip>:9090`
- Access from EKS pods or via SSH tunnel

### Loki
- **URL**: `http://<ec2-private-ip>:3100`
- Access via Grafana as data source

---

## Step 8: Configure Grafana Data Sources

1. Login to Grafana
2. Go to Configuration → Data Sources
3. Add Prometheus:
   - URL: `http://prometheus:9090`
   - Click "Save & Test"
4. Add Loki:
   - URL: `http://loki:3100`
   - Click "Save & Test"

---

## Step 9: Configure EKS to Send Metrics (Optional)

If you want to scrape metrics from EKS pods:

### Option A: Use Prometheus Remote Write
Configure in-cluster Prometheus agent to send to external Prometheus

### Option B: Expose Metrics Endpoints
Expose application `/metrics` endpoints via LoadBalancer or NodePort

---

## Cost Estimate

| Resource | Monthly Cost |
|----------|--------------|
| t3.small EC2 (730 hours) | ~$15 |
| 20GB EBS storage | ~$2 |
| Data transfer (minimal) | ~$1 |
| **Total** | **~$18/month** |

**vs keeping in EKS**: $0 but uses 2GB of cluster memory

---

## Maintenance

### Auto-start on reboot
```bash
# Docker is already set to start on boot
# Docker Compose services will auto-restart

# Optional: Create systemd service
sudo cat > /etc/systemd/system/monitoring.service << 'EOF'
[Unit]
Description=Monitoring Stack
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/home/ec2-user/monitoring
ExecStart=/usr/local/bin/docker-compose up -d
ExecStop=/usr/local/bin/docker-compose down

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl enable monitoring
```

### Backup
```bash
# Backup Grafana dashboards
docker exec grafana grafana-cli admin export > grafana-backup.json

# Backup Prometheus data
docker exec prometheus tar czf /prometheus-backup.tar.gz /prometheus
docker cp prometheus:/prometheus-backup.tar.gz .
```

---

## Troubleshooting

### Check container status
```bash
docker-compose ps
docker-compose logs <service-name>
```

### Restart services
```bash
docker-compose restart
```

### Check disk space
```bash
df -h
docker system df
```

### Clean up old data
```bash
docker system prune -a
```

---

## Next Steps

1. Launch EC2 instance
2. Install Docker and Docker Compose
3. Deploy monitoring stack
4. Remove monitoring from EKS
5. Configure Grafana dashboards
6. Set up alerting (optional)

This will free up ~2GB in your EKS cluster immediately!
