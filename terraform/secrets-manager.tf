# AWS Secrets Manager for TribeTalk

# Database Credentials Secret
resource "aws_secretsmanager_secret" "database_credentials" {
  name                    = "tribetalk/database/credentials"
  description             = "Database credentials for PostgreSQL and MongoDB"
  recovery_window_in_days = 0

  tags = {
    Name        = "tribetalk-database-credentials"
    Environment = var.environment
  }
}

resource "aws_secretsmanager_secret_version" "database_credentials" {
  secret_id = aws_secretsmanager_secret.database_credentials.id
  secret_string = jsonencode({
    postgres_username = var.db_username
    postgres_password = var.db_password
    postgres_url      = "jdbc:postgresql://${aws_instance.postgresql.private_ip}:5432/tribetalk"
    mongodb_username  = var.db_username
    mongodb_password  = var.db_password
    mongodb_uri       = "mongodb://${var.db_username}:${var.db_password}@${aws_instance.mongodb.private_ip}:27017/tribetalknosqldb?authSource=admin"
  })
}

# Application Configuration Secret
resource "aws_secretsmanager_secret" "app_config" {
  name                    = "tribetalk/app/config"
  description             = "Application configuration including JWT and OAuth2"
  recovery_window_in_days = 0

  tags = {
    Name        = "tribetalk-app-config"
    Environment = var.environment
  }
}

resource "aws_secretsmanager_secret_version" "app_config" {
  secret_id = aws_secretsmanager_secret.app_config.id
  secret_string = jsonencode({
    jwt_secret            = var.jwt_secret
    github_client_id      = var.github_client_id
    github_client_secret  = var.github_client_secret
    google_client_id      = var.google_client_id
    google_client_secret  = var.google_client_secret
    redis_host            = aws_instance.redis.private_ip
    kafka_bootstrap_servers = join(",", [for ip in aws_instance.kafka[*].private_ip : "${ip}:9092"])
  })
}

# IAM Policy for EKS Pods to Access Secrets
resource "aws_iam_policy" "secrets_access" {
  name        = "tribetalk-secrets-access"
  description = "Allow EKS pods to access Secrets Manager"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue",
          "secretsmanager:DescribeSecret"
        ]
        Resource = [
          aws_secretsmanager_secret.database_credentials.arn,
          aws_secretsmanager_secret.app_config.arn
        ]
      }
    ]
  })

  tags = {
    Name = "tribetalk-secrets-access"
  }
}

# IAM Role for Service Account (IRSA)
resource "aws_iam_role" "secrets_access" {
  name = "tribetalk-secrets-access-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRoleWithWebIdentity"
        Effect = "Allow"
        Principal = {
          Federated = aws_iam_openid_connect_provider.eks.arn
        }
        Condition = {
          StringEquals = {
            "${replace(aws_iam_openid_connect_provider.eks.url, "https://", "")}:sub" = "system:serviceaccount:default:tribetalk-sa"
            "${replace(aws_iam_openid_connect_provider.eks.url, "https://", "")}:aud" = "sts.amazonaws.com"
          }
        }
      }
    ]
  })

  tags = {
    Name = "tribetalk-secrets-access-role"
  }
}

resource "aws_iam_role_policy_attachment" "secrets_access" {
  policy_arn = aws_iam_policy.secrets_access.arn
  role       = aws_iam_role.secrets_access.name
}

# Output secret ARNs for reference
output "database_credentials_secret_arn" {
  description = "ARN of database credentials secret"
  value       = aws_secretsmanager_secret.database_credentials.arn
}

output "app_config_secret_arn" {
  description = "ARN of application config secret"
  value       = aws_secretsmanager_secret.app_config.arn
}

output "secrets_access_role_arn" {
  description = "ARN of IAM role for secrets access"
  value       = aws_iam_role.secrets_access.arn
}
