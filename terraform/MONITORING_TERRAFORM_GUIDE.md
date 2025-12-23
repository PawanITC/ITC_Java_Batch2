# Terraform Deployment Guide for Monitoring EC2

## Prerequisites

1. **Terraform installed** (v1.0+)
2. **AWS CLI configured** with credentials
3. **SSH key pair** created in AWS (default: `k8-SecurityKey`)

---

## Step 1: Review Configuration

### Check Variables
Edit `terraform/variables.tf` if needed:
```hcl
monitoring_instance_type = "t3.small"  # 2GB RAM, 2 vCPUs
key_name                 = "k8-SecurityKey"  # Your SSH key
project_name             = "tribetalk"
```

### What Gets Created
- **EC2 Instance**: t3.small with Amazon Linux 2023
- **Security Group**: Ports 22, 3000, 9090, 3100
- **Elastic IP**: Static public IP
- **IAM Role**: For CloudWatch access
- **Docker Compose Stack**: Prometheus, Grafana, Loki, Promtail

---

## Step 2: Initialize Terraform

```bash
cd terraform/

# Initialize Terraform
terraform init

# Review what will be created
terraform plan
```

---

## Step 3: Deploy Monitoring Instance

```bash
# Apply configuration
terraform apply

# Type 'yes' when prompted
```

**Deployment time**: ~3-5 minutes

---

## Step 4: Get Instance Details

```bash
# Get monitoring instance public IP
terraform output monitoring_public_ip

# Get Grafana URL
terraform output grafana_url

# Example output:
# monitoring_public_ip = "13.48.123.45"
# grafana_url = "http://13.48.123.45:3000"
```

---

## Step 5: Verify Deployment

### SSH into Instance
```bash
ssh -i ~/.ssh/k8-SecurityKey.pem ec2-user@<monitoring-public-ip>

# Check Docker containers
docker ps

# Should see: prometheus, grafana, loki, promtail
```

### Access Grafana
1. Open browser: `http://<monitoring-public-ip>:3000`
2. Login:
   - Username: `admin`
   - Password: `admin123`

---

## Step 6: Remove Monitoring from EKS

Now that monitoring is running externally, remove it from EKS:

```bash
# Delete monitoring namespace
kubectl delete namespace monitoring

# Or delete specific resources
kubectl delete deployment prometheus-monitoring-kube-prometheus-prometheus
kubectl delete deployment monitoring-grafana
kubectl delete statefulset loki
kubectl delete daemonset promtail

# Verify removal
kubectl get pods --all-namespaces | grep -E "prometheus|grafana|loki"
```

**Memory freed in EKS**: ~2-2.5GB

---

## Step 7: Configure Prometheus to Scrape EKS

### Option A: Via ALB (Simplest)
SSH into monitoring instance and update Prometheus config:

```bash
ssh -i ~/.ssh/k8-SecurityKey.pem ec2-user@<monitoring-public-ip>

cd ~/monitoring

# Edit prometheus.yml
nano prometheus.yml
```

Add your services:
```yaml
scrape_configs:
  - job_name: 'tribetalk'
    static_configs:
      - targets: ['k8s-default-tribetal-089de13287-2075252521.eu-north-1.elb.amazonaws.com:8080']
    metrics_path: '/actuator/prometheus'
    
  - job_name: 'chatservice'
    static_configs:
      - targets: ['k8s-default-tribetal-089de13287-2075252521.eu-north-1.elb.amazonaws.com:8081']
    metrics_path: '/actuator/prometheus'
```

Restart Prometheus:
```bash
docker-compose restart prometheus
```

---

## Terraform Commands Reference

```bash
# View current state
terraform show

# List all resources
terraform state list

# Get specific output
terraform output monitoring_public_ip

# Destroy monitoring instance (if needed)
terraform destroy -target=aws_instance.monitoring

# Destroy everything
terraform destroy
```

---

## Cost Estimate

| Resource | Monthly Cost |
|----------|--------------|
| t3.small EC2 (730 hours) | ~$15 |
| Elastic IP | $0 (attached) |
| 20GB EBS gp3 | ~$2 |
| Data transfer | ~$1 |
| **Total** | **~$18/month** |

---

## Troubleshooting

### Instance not starting
```bash
# Check instance status
aws ec2 describe-instances --instance-ids <instance-id>

# View user-data logs
ssh ec2-user@<ip>
sudo cat /var/log/cloud-init-output.log
```

### Docker containers not running
```bash
ssh ec2-user@<ip>
cd ~/monitoring
docker-compose ps
docker-compose logs
```

### Can't access Grafana
- Check security group allows port 3000
- Verify Elastic IP is attached
- Check if Docker container is running: `docker ps`

---

## Next Steps

1. **Deploy**: Run `terraform apply`
2. **Access Grafana**: `http://<ip>:3000`
3. **Remove EKS monitoring**: Free up ~2GB
4. **Configure data sources**: Add Prometheus and Loki in Grafana
5. **Import dashboards**: Use pre-built Grafana dashboards

---

## Updating Configuration

If you need to change instance type or other settings:

```bash
# Edit variables.tf
nano terraform/variables.tf

# Apply changes
terraform apply
```

Terraform will show what will change before applying.

---

## Cleanup

To remove the monitoring instance:

```bash
terraform destroy -target=aws_instance.monitoring
terraform destroy -target=aws_eip.monitoring
terraform destroy -target=aws_security_group.monitoring
```

Or destroy everything:
```bash
terraform destroy
```

---

**Your monitoring stack will be ready in ~5 minutes!**
