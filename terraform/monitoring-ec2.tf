# Monitoring EC2 Instance
# This instance runs Prometheus, Grafana, and Loki outside the EKS cluster
# to free up cluster memory resources

# Monitoring EC2 Instance uses existing data.aws_ami.ubuntu from ec2-infrastructure.tf

# Security Group for Monitoring Instance
resource "aws_security_group" "monitoring" {
  name        = "tribetalk-monitoring-sg"
  description = "Security group for monitoring instance (Prometheus, Grafana, Loki)"
  vpc_id      = aws_vpc.main.id

  # SSH access
  ingress {
    description = "SSH from anywhere"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # Grafana UI
  ingress {
    description = "Grafana UI"
    from_port   = 3000
    to_port     = 3000
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # Prometheus (from EKS VPC only)
  ingress {
    description = "Prometheus from EKS"
    from_port   = 9090
    to_port     = 9090
    protocol    = "tcp"
    cidr_blocks = [var.vpc_cidr]
  }

  # Loki (from EKS VPC only)
  ingress {
    description = "Loki from EKS"
    from_port   = 3100
    to_port     = 3100
    protocol    = "tcp"
    cidr_blocks = [var.vpc_cidr]
  }

  # Outbound traffic
  egress {
    description = "Allow all outbound"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "tribetalk-monitoring-sg"
  }
}

# IAM Role for Monitoring Instance (for CloudWatch, ECR access, etc.)
resource "aws_iam_role" "monitoring" {
  name = "tribetalk-monitoring-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ec2.amazonaws.com"
        }
      }
    ]
  })

  tags = {
    Name = "tribetalk-monitoring-role"
  }
}

# Attach CloudWatch policy for logs
resource "aws_iam_role_policy_attachment" "monitoring_cloudwatch" {
  role       = aws_iam_role.monitoring.name
  policy_arn = "arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy"
}

# Instance profile
resource "aws_iam_instance_profile" "monitoring" {
  name = "tribetalk-monitoring-profile"
  role = aws_iam_role.monitoring.name
}

# Monitoring EC2 Instance
resource "aws_instance" "monitoring" {
  ami                    = data.aws_ami.ubuntu.id
  instance_type          = var.instance_type  # Uses existing variable (t3.small)
  key_name               = var.key_pair_name  # Uses existing variable (k8-SecurityKey)
  subnet_id              = aws_subnet.public[0].id
  vpc_security_group_ids = [aws_security_group.monitoring.id]
  iam_instance_profile   = aws_iam_instance_profile.monitoring.name

  root_block_device {
    volume_size           = 20
    volume_type           = "gp3"
    delete_on_termination = true
    encrypted             = true
  }

  user_data = <<-EOF
              #!/bin/bash
              set -e
              
              # Update system
              apt-get update
              apt-get upgrade -y
              
              # Install Docker
              apt-get install -y docker.io
              systemctl start docker
              systemctl enable docker
              
              # Add ubuntu user to docker group
              usermod -a -G docker ubuntu
              
              # Install Docker Compose
              curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
              chmod +x /usr/local/bin/docker-compose
              
              # Create monitoring directory
              mkdir -p /home/ubuntu/monitoring
              cd /home/ubuntu/monitoring
              
              # Create docker-compose.yml
              cat > docker-compose.yml << 'COMPOSE_EOF'
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
              COMPOSE_EOF
              
              # Create Prometheus config
              cat > prometheus.yml << 'PROM_EOF'
              global:
                scrape_interval: 15s
                evaluation_interval: 15s
              
              scrape_configs:
                - job_name: 'prometheus'
                  static_configs:
                    - targets: ['localhost:9090']
              PROM_EOF
              
              # Create Loki config
              cat > loki-config.yml << 'LOKI_EOF'
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
              LOKI_EOF
              
              # Create Promtail config
              cat > promtail-config.yml << 'PROMTAIL_EOF'
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
              PROMTAIL_EOF
              
              # Set ownership
              chown -R ubuntu:ubuntu /home/ubuntu/monitoring
              
              # Start monitoring stack
              cd /home/ubuntu/monitoring
              docker-compose up -d
              
              # Create systemd service for auto-start
              cat > /etc/systemd/system/monitoring.service << 'SERVICE_EOF'
              [Unit]
              Description=Monitoring Stack
              Requires=docker.service
              After=docker.service
              
              [Service]
              Type=oneshot
              RemainAfterExit=yes
              WorkingDirectory=/home/ubuntu/monitoring
              ExecStart=/usr/local/bin/docker-compose up -d
              ExecStop=/usr/local/bin/docker-compose down
              User=ubuntu
              
              [Install]
              WantedBy=multi-user.target
              SERVICE_EOF
              
              systemctl enable monitoring
              EOF

  tags = {
    Name = "tribetalk-monitoring"
    Type = "Monitoring"
  }
}

# Elastic IP for monitoring instance (optional but recommended)
resource "aws_eip" "monitoring" {
  instance = aws_instance.monitoring.id
  domain   = "vpc"

  tags = {
    Name = "tribetalk-monitoring-eip"
  }
}
