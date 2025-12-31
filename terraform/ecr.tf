# ECR Repositories for Microservices

# TribeTalk Service Repository
resource "aws_ecr_repository" "tribetalk" {
  name                 = "tribetalk-service"
  image_tag_mutability = "MUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }

  encryption_configuration {
    encryption_type = "AES256"
  }

  tags = {
    Name    = "tribetalk-service"
    Service = "tribetalk"
  }
}

# ChatService Repository
resource "aws_ecr_repository" "chatservice" {
  name                 = "chatservice"
  image_tag_mutability = "MUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }

  encryption_configuration {
    encryption_type = "AES256"
  }

  tags = {
    Name    = "chatservice"
    Service = "chatservice"
  }
}

# Notification Service Repository
resource "aws_ecr_repository" "notification" {
  name                 = "notification-service"
  image_tag_mutability = "MUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }

  encryption_configuration {
    encryption_type = "AES256"
  }

  tags = {
    Name    = "notification-service"
    Service = "notification"
  }
}

# ECR Repository for Frontend
resource "aws_ecr_repository" "frontend" {
  name                 = "tribe-talk-frontend"
  image_tag_mutability = "MUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }

  encryption_configuration {
    encryption_type = "AES256"
  }

  tags = {
    Name    = "tribe-talk-frontend"
    Service = "frontend"
  }
}

# Lifecycle Policy for Frontend Repository
resource "aws_ecr_lifecycle_policy" "frontend" {
  repository = aws_ecr_repository.frontend.name

  policy = jsonencode({
    rules = [
      {
        rulePriority = 1
        description  = "Keep last 10 images"
        selection = {
          tagStatus     = "tagged"
          tagPrefixList = ["v"]
          countType     = "imageCountMoreThan"
          countNumber   = 10
        }
        action = {
          type = "expire"
        }
      },
      {
        rulePriority = 2
        description  = "Remove untagged images after 7 days"
        selection = {
          tagStatus   = "untagged"
          countType   = "sinceImagePushed"
          countUnit   = "days"
          countNumber = 7
        }
        action = {
          type = "expire"
        }
      }
    ]
  })
}

# Update IAM Policy to include frontend repository
resource "aws_iam_policy" "jenkins_ecr_push" {
  name        = "tribetalk-jenkins-ecr-push"
  description = "Allow Jenkins to push images to ECR"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "ecr:GetAuthorizationToken"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "ecr:BatchCheckLayerAvailability",
          "ecr:GetDownloadUrlForLayer",
          "ecr:GetRepositoryPolicy",
          "ecr:DescribeRepositories",
          "ecr:ListImages",
          "ecr:DescribeImages",
          "ecr:BatchGetImage",
          "ecr:InitiateLayerUpload",
          "ecr:UploadLayerPart",
          "ecr:CompleteLayerUpload",
          "ecr:PutImage"
        ]
        Resource = [
          aws_ecr_repository.tribetalk.arn,
          aws_ecr_repository.chatservice.arn,
          aws_ecr_repository.notification.arn,
          aws_ecr_repository.frontend.arn
        ]
      }
    ]
  })

  tags = {
    Name = "tribetalk-jenkins-ecr-push"
  }
}
