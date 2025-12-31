# VPC Outputs
output "vpc_id" {
  description = "ID of the VPC"
  value       = aws_vpc.main.id
}

output "public_subnet_ids" {
  description = "IDs of public subnets"
  value       = aws_subnet.public[*].id
}

output "private_subnet_ids" {
  description = "IDs of private subnets"
  value       = aws_subnet.private[*].id
}

# Bastion Host
output "bastion_public_ip" {
  description = "Public IP of bastion host"
  value       = aws_instance.bastion.public_ip
}

output "bastion_ssh_command" {
  description = "SSH command to connect to bastion"
  value       = "ssh -i ~/.ssh/${var.key_pair_name}.pem ubuntu@${aws_instance.bastion.public_ip}"
}

# Database Instances
output "postgresql_private_ip" {
  description = "Private IP of PostgreSQL instance"
  value       = aws_instance.postgresql.private_ip
}

output "postgresql_connection_string" {
  description = "PostgreSQL connection string"
  value       = "postgresql://${var.db_username}@${aws_instance.postgresql.private_ip}:5432/tribetalk"
  sensitive   = true
}

output "mongodb_private_ip" {
  description = "Private IP of MongoDB instance"
  value       = aws_instance.mongodb.private_ip
}

output "mongodb_connection_string" {
  description = "MongoDB connection string"
  value       = "mongodb://${var.db_username}@${aws_instance.mongodb.private_ip}:27017/tribetalknosqldb?authSource=admin"
  sensitive   = true
}

output "redis_private_ip" {
  description = "Private IP of Redis instance"
  value       = aws_instance.redis.private_ip
}

output "redis_endpoint" {
  description = "Redis endpoint"
  value       = "${aws_instance.redis.private_ip}:6379"
}

# Kafka Cluster
output "kafka_broker_ips" {
  description = "Private IPs of Kafka brokers"
  value       = aws_instance.kafka[*].private_ip
}

output "kafka_bootstrap_servers" {
  description = "Kafka bootstrap servers"
  value       = join(",", [for ip in aws_instance.kafka[*].private_ip : "${ip}:9092"])
}

# EKS Cluster Outputs
output "eks_cluster_name" {
  description = "Name of the EKS cluster"
  value       = aws_eks_cluster.main.name
}

output "eks_cluster_endpoint" {
  description = "Endpoint for EKS cluster"
  value       = aws_eks_cluster.main.endpoint
}

output "eks_cluster_security_group_id" {
  description = "Security group ID attached to the EKS cluster"
  value       = aws_eks_cluster.main.vpc_config[0].cluster_security_group_id
}

output "eks_node_group_id" {
  description = "EKS node group ID"
  value       = aws_eks_node_group.main.id
}

# ECR Repository URLs
output "ecr_tribetalk_url" {
  description = "URL of TribeTalk ECR repository"
  value       = aws_ecr_repository.tribetalk.repository_url
}

output "ecr_chatservice_url" {
  description = "URL of ChatService ECR repository"
  value       = aws_ecr_repository.chatservice.repository_url
}

output "ecr_notification_url" {
  description = "URL of Notification Service ECR repository"
  value       = aws_ecr_repository.notification.repository_url
}

output "ecr_frontend_url" {
  description = "URL of Frontend ECR repository"
  value       = aws_ecr_repository.frontend.repository_url
}

# Jenkins Outputs
output "jenkins_public_ip" {
  description = "Public IP of Jenkins server"
  value       = aws_eip.jenkins.public_ip
}

output "jenkins_url" {
  description = "Jenkins URL"
  value       = "http://${aws_eip.jenkins.public_ip}:8080"
}

# Instance IDs
output "postgresql_instance_id" {
  description = "Instance ID of PostgreSQL server"
  value       = aws_instance.postgresql.id
}

output "mongodb_instance_id" {
  description = "Instance ID of MongoDB server"
  value       = aws_instance.mongodb.id
}

output "redis_instance_id" {
  description = "Instance ID of Redis server"
  value       = aws_instance.redis.id
}

output "kafka_instance_ids" {
  description = "Instance IDs of Kafka brokers"
  value       = aws_instance.kafka[*].id
}

# Summary
output "deployment_summary" {
  description = "Summary of deployed infrastructure"
  value = <<-EOT
    
    ========================================
    TribeTalk Infrastructure Deployment
    ========================================
    
    Bastion Host:
      - Public IP: ${aws_instance.bastion.public_ip}
      - SSH: ssh -i ~/.ssh/${var.key_pair_name}.pem ubuntu@${aws_instance.bastion.public_ip}
    
    Database Services:
      - PostgreSQL: ${aws_instance.postgresql.private_ip}:5432
      - MongoDB: ${aws_instance.mongodb.private_ip}:27017
      - Redis: ${aws_instance.redis.private_ip}:6379
    
    Kafka Cluster:
      - Brokers: ${join(", ", aws_instance.kafka[*].private_ip)}
      - Bootstrap: ${join(",", [for ip in aws_instance.kafka[*].private_ip : "${ip}:9092"])}
    
    EKS Cluster:
      - Name: ${aws_eks_cluster.main.name}
      - Endpoint: ${aws_eks_cluster.main.endpoint}
      - Update kubeconfig: aws eks update-kubeconfig --name ${aws_eks_cluster.main.name} --region ${var.aws_region}
    
    Jenkins:
      - Public IP: ${aws_eip.jenkins.public_ip}
      - URL: http://${aws_eip.jenkins.public_ip}:8080
    
    ECR Repositories:
      - TribeTalk: ${aws_ecr_repository.tribetalk.repository_url}
      - ChatService: ${aws_ecr_repository.chatservice.repository_url}
      - Notification: ${aws_ecr_repository.notification.repository_url}
    
    Secrets Manager:
      - Database Credentials: ${aws_secretsmanager_secret.database_credentials.name}
      - App Config: ${aws_secretsmanager_secret.app_config.name}
      - IAM Role for IRSA: ${aws_iam_role.secrets_access.arn}
    
    Next Steps:
      1. Install External Secrets Operator: helm install external-secrets external-secrets/external-secrets
      2. Update kubeconfig: aws eks update-kubeconfig --name ${aws_eks_cluster.main.name}
      3. Apply External Secrets: kubectl apply -f k8s/external-secrets.yaml
      4. Deploy microservices: kubectl apply -f k8s/deployments/
      5. Access Jenkins: http://${aws_eip.jenkins.public_ip}:8080
    
    ========================================
  EOT
}

# Monitoring Instance Outputs
output "monitoring_public_ip" {
  description = "Public IP of monitoring instance"
  value       = aws_eip.monitoring.public_ip
}

output "grafana_url" {
  description = "Grafana dashboard URL"
  value       = "http://${aws_eip.monitoring.public_ip}:3000"
}

output "prometheus_url" {
  description = "Prometheus URL (internal)"
  value       = "http://${aws_instance.monitoring.private_ip}:9090"
}

output "monitoring_ssh_command" {
  description = "SSH command to connect to monitoring instance"
  value       = "ssh -i ~/.ssh/${var.key_pair_name}.pem ubuntu@${aws_eip.monitoring.public_ip}"
}

