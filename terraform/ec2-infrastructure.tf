# IAM Role for EC2 instances
resource "aws_iam_role" "ec2_role" {
  name = "tribetalk-ec2-role"

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
    Name = "tribetalk-ec2-role"
  }
}

# IAM Policy for CloudWatch Logs
resource "aws_iam_role_policy" "cloudwatch_logs" {
  name = "tribetalk-cloudwatch-logs-policy"
  role = aws_iam_role.ec2_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents",
          "logs:DescribeLogStreams"
        ]
        Resource = "arn:aws:logs:*:*:*"
      }
    ]
  })
}

# IAM Policy for CloudWatch Metrics
resource "aws_iam_role_policy" "cloudwatch_metrics" {
  name = "tribetalk-cloudwatch-metrics-policy"
  role = aws_iam_role.ec2_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "cloudwatch:PutMetricData",
          "cloudwatch:GetMetricStatistics",
          "cloudwatch:ListMetrics"
        ]
        Resource = "*"
      }
    ]
  })
}

# IAM Policy for Secrets Manager (for future use)
resource "aws_iam_role_policy" "secrets_manager" {
  name = "tribetalk-secrets-manager-policy"
  role = aws_iam_role.ec2_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue",
          "secretsmanager:DescribeSecret"
        ]
        Resource = "arn:aws:secretsmanager:${var.aws_region}:*:secret:tribetalk/*"
      }
    ]
  })
}

# IAM Instance Profile
resource "aws_iam_instance_profile" "ec2_profile" {
  name = "tribetalk-ec2-profile"
  role = aws_iam_role.ec2_role.name

  tags = {
    Name = "tribetalk-ec2-profile"
  }
}

# Bastion Host
resource "aws_instance" "bastion" {
  ami                    = data.aws_ami.ubuntu.id
  instance_type          = "t3.micro"
  key_name               = var.key_pair_name
  subnet_id              = aws_subnet.public[0].id
  vpc_security_group_ids = [aws_security_group.bastion.id]
  iam_instance_profile   = aws_iam_instance_profile.ec2_profile.name

  user_data = <<-EOF
              #!/bin/bash
              apt-get update
              apt-get install -y postgresql-client mongodb-clients redis-tools
              EOF

  tags = {
    Name    = "tribetalk-bastion"
    Service = "bastion"
  }
}

# PostgreSQL EC2 Instance
resource "aws_instance" "postgresql" {
  ami                    = data.aws_ami.ubuntu.id
  instance_type          = var.instance_type
  key_name               = var.key_pair_name
  subnet_id              = aws_subnet.private[0].id
  vpc_security_group_ids = [aws_security_group.postgresql.id]
  iam_instance_profile   = aws_iam_instance_profile.ec2_profile.name

  root_block_device {
    volume_size = 30
    volume_type = "gp3"
  }

  tags = {
    Name    = "tribetalk-postgresql"
    Service = "postgresql"
    Ansible = "postgresql"
  }
}

# MongoDB EC2 Instance
resource "aws_instance" "mongodb" {
  ami                    = data.aws_ami.ubuntu.id
  instance_type          = var.instance_type
  key_name               = var.key_pair_name
  subnet_id              = aws_subnet.private[0].id
  vpc_security_group_ids = [aws_security_group.mongodb.id]
  iam_instance_profile   = aws_iam_instance_profile.ec2_profile.name

  root_block_device {
    volume_size = 30
    volume_type = "gp3"
  }

  tags = {
    Name    = "tribetalk-mongodb"
    Service = "mongodb"
    Ansible = "mongodb"
  }
}

# Redis EC2 Instance
resource "aws_instance" "redis" {
  ami                    = data.aws_ami.ubuntu.id
  instance_type          = var.instance_type
  key_name               = var.key_pair_name
  subnet_id              = aws_subnet.private[0].id
  vpc_security_group_ids = [aws_security_group.redis.id]
  iam_instance_profile   = aws_iam_instance_profile.ec2_profile.name

  root_block_device {
    volume_size = 20
    volume_type = "gp3"
  }

  tags = {
    Name    = "tribetalk-redis"
    Service = "redis"
    Ansible = "redis"
  }
}

# Kafka EC2 Instances (KRaft cluster)
resource "aws_instance" "kafka" {
  count                  = var.kafka_cluster_size
  ami                    = data.aws_ami.ubuntu.id
  instance_type          = var.instance_type
  key_name               = var.key_pair_name
  subnet_id              = aws_subnet.private[count.index % length(aws_subnet.private)].id
  vpc_security_group_ids = [aws_security_group.kafka.id]
  iam_instance_profile   = aws_iam_instance_profile.ec2_profile.name

  root_block_device {
    volume_size = 50
    volume_type = "gp3"
  }

  tags = {
    Name     = "tribetalk-kafka-${count.index + 1}"
    Service  = "kafka"
    Ansible  = "kafka"
    NodeId   = count.index + 1
    KafkaRole = "controller,broker"
  }
}
