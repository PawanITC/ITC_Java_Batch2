# S3 Bucket for Database Backups
resource "aws_s3_bucket" "database_backups" {
  bucket = "tribetalk-database-backups-${data.aws_caller_identity.current.account_id}"

  tags = {
    Name        = "tribetalk-database-backups"
    Environment = var.environment
    Purpose     = "Automated database backups"
  }
}

# Enable versioning
resource "aws_s3_bucket_versioning" "database_backups" {
  bucket = aws_s3_bucket.database_backups.id

  versioning_configuration {
    status = "Enabled"
  }
}

# Lifecycle policy - keep backups for 30 days
resource "aws_s3_bucket_lifecycle_configuration" "database_backups" {
  bucket = aws_s3_bucket.database_backups.id

  rule {
    id     = "delete-old-backups"
    status = "Enabled"

    expiration {
      days = 30
    }

    noncurrent_version_expiration {
      noncurrent_days = 7
    }
  }
}

# Block public access
resource "aws_s3_bucket_public_access_block" "database_backups" {
  bucket = aws_s3_bucket.database_backups.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# IAM policy for EC2 instances to upload backups
resource "aws_iam_policy" "s3_backup_upload" {
  name        = "tribetalk-s3-backup-upload"
  description = "Allow EC2 instances to upload database backups to S3"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:PutObject",
          "s3:PutObjectAcl"
        ]
        Resource = "${aws_s3_bucket.database_backups.arn}/*"
      },
      {
        Effect = "Allow"
        Action = [
          "s3:ListBucket"
        ]
        Resource = aws_s3_bucket.database_backups.arn
      }
    ]
  })
}

# Attach policy to EC2 role
resource "aws_iam_role_policy_attachment" "ec2_s3_backup" {
  role       = aws_iam_role.ec2_role.name
  policy_arn = aws_iam_policy.s3_backup_upload.arn
}

# Data source for account ID
data "aws_caller_identity" "current" {}

# Output
output "backup_bucket_name" {
  description = "S3 bucket for database backups"
  value       = aws_s3_bucket.database_backups.id
}
