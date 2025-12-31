variable "aws_region" {
  description = "AWS region for infrastructure deployment"
  type        = string
  default     = "eu-north-1"
}

variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
  default     = "dev"
}

variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "availability_zones" {
  description = "Availability zones for subnet distribution"
  type        = list(string)
  default     = ["eu-north-1a", "eu-north-1b"]
}

variable "instance_type" {
  description = "EC2 instance type for all services"
  type        = string
  default     = "t3.small"
}

variable "key_pair_name" {
  description = "Name of the SSH key pair for EC2 instances"
  type        = string
  default     = "k8-SecurityKey"
}

variable "db_username" {
  description = "Database admin username"
  type        = string
  default     = "admin"
  sensitive   = true
}

variable "db_password" {
  description = "Database admin password"
  type        = string
  sensitive   = true
}

variable "allowed_ssh_cidr" {
  description = "CIDR block allowed to SSH into bastion host"
  type        = string
  default     = "0.0.0.0/0" # Restrict this in production
}

variable "kafka_cluster_size" {
  description = "Number of Kafka broker nodes"
  type        = number
  default     = 1  # Cost optimization: single node for dev/staging
}

variable "microservice_desired_count" {
  description = "Desired number of instances per microservice (EC2 only, not used with EKS)"
  type        = number
  default     = 1  # Cost optimization
}

variable "microservice_max_count" {
  description = "Maximum number of instances per microservice (EC2 only, not used with EKS)"
  type        = number
  default     = 2  # Cost optimization
}

variable "microservice_min_count" {
  description = "Minimum number of instances per microservice (EC2 only, not used with EKS)"
  type        = number
  default     = 1
}

# EKS Variables
variable "eks_cluster_version" {
  description = "Kubernetes version for EKS cluster"
  type        = string
  default     = "1.31"  # Latest supported version as of Dec 2024
}

variable "eks_node_instance_type" {
  description = "Instance type for EKS worker nodes"
  type        = string
  default     = "t3.small"
}

variable "eks_desired_nodes" {
  description = "Desired number of EKS worker nodes"
  type        = number
  default     = 4  # Increased from 2 to 4 for monitoring stack + future live streaming
}

variable "eks_min_nodes" {
  description = "Minimum number of EKS worker nodes"
  type        = number
  default     = 3  # Increased from 1 to 3 for stability
}

variable "eks_max_nodes" {
  description = "Maximum number of EKS worker nodes"
  type        = number
  default     = 6  # Increased from 4 to 6 for future live streaming scalability
}

variable "jenkins_instance_type" {
  description = "Instance type for Jenkins server"
  type        = string
  default     = "t3.small"
}

variable "enable_eks" {
  description = "Enable EKS deployment (set to false to use EC2 Auto Scaling Groups)"
  type        = bool
  default     = true
}

# Secrets Manager Variables
variable "jwt_secret" {
  description = "JWT secret for token signing"
  type        = string
  sensitive   = true
  default     = "change_this_to_a_long_random_secret_with_min_256_bits"
}

variable "github_client_id" {
  description = "GitHub OAuth2 client ID"
  type        = string
  default     = ""
}

variable "github_client_secret" {
  description = "GitHub OAuth2 client secret"
  type        = string
  sensitive   = true
  default     = ""
}

variable "google_client_id" {
  description = "Google OAuth2 client ID"
  type        = string
  default     = ""
}

variable "google_client_secret" {
  description = "Google OAuth2 client secret"
  type        = string
  sensitive   = true
  default     = ""
}

