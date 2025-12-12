# Security Group for Jenkins
resource "aws_security_group" "jenkins" {
  name        = "tribetalk-jenkins-sg"
  description = "Security group for Jenkins server"
  vpc_id      = aws_vpc.main.id

  ingress {
    description = "HTTP for Jenkins UI"
    from_port   = 8080
    to_port     = 8080
    protocol    = "tcp"
    cidr_blocks = [var.allowed_ssh_cidr]
  }

  ingress {
    description = "SSH from bastion"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    security_groups = [aws_security_group.bastion.id]
  }

  egress {
    description = "Allow all outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "tribetalk-jenkins-sg"
  }
}

# IAM Role for Jenkins
resource "aws_iam_role" "jenkins" {
  name = "tribetalk-jenkins-role"

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
    Name = "tribetalk-jenkins-role"
  }
}

# Attach ECR push policy to Jenkins role
resource "aws_iam_role_policy_attachment" "jenkins_ecr" {
  policy_arn = aws_iam_policy.jenkins_ecr_push.arn
  role       = aws_iam_role.jenkins.name
}

# Attach EKS access policy to Jenkins role
resource "aws_iam_role_policy" "jenkins_eks" {
  name = "tribetalk-jenkins-eks-policy"
  role = aws_iam_role.jenkins.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "eks:DescribeCluster",
          "eks:ListClusters"
        ]
        Resource = "*"
      }
    ]
  })
}

# CloudWatch Logs policy for Jenkins
resource "aws_iam_role_policy" "jenkins_cloudwatch" {
  name = "tribetalk-jenkins-cloudwatch-policy"
  role = aws_iam_role.jenkins.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:*:*:*"
      }
    ]
  })
}

# IAM Instance Profile for Jenkins
resource "aws_iam_instance_profile" "jenkins" {
  name = "tribetalk-jenkins-profile"
  role = aws_iam_role.jenkins.name

  tags = {
    Name = "tribetalk-jenkins-profile"
  }
}

# Jenkins EC2 Instance
resource "aws_instance" "jenkins" {
  ami                    = data.aws_ami.ubuntu.id
  instance_type          = var.jenkins_instance_type
  key_name               = var.key_pair_name
  subnet_id              = aws_subnet.public[0].id
  vpc_security_group_ids = [aws_security_group.jenkins.id]
  iam_instance_profile   = aws_iam_instance_profile.jenkins.name

  root_block_device {
    volume_size = 50
    volume_type = "gp3"
  }

  user_data = base64encode(<<-EOF
              #!/bin/bash
              set -e
              
              # Update system
              apt-get update
              apt-get upgrade -y
              
              # Install Java 17 (required for Jenkins)
              apt-get install -y openjdk-17-jdk
              
              # Install Docker
              apt-get install -y apt-transport-https ca-certificates curl software-properties-common
              curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
              echo "deb [arch=amd64 signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
              apt-get update
              apt-get install -y docker-ce docker-ce-cli containerd.io
              
              # Install Jenkins
              curl -fsSL https://pkg.jenkins.io/debian-stable/jenkins.io-2023.key | tee /usr/share/keyrings/jenkins-keyring.asc > /dev/null
              echo deb [signed-by=/usr/share/keyrings/jenkins-keyring.asc] https://pkg.jenkins.io/debian-stable binary/ | tee /etc/apt/sources.list.d/jenkins.list > /dev/null
              apt-get update
              apt-get install -y jenkins
              
              # Add jenkins user to docker group
              usermod -aG docker jenkins
              
              # Install kubectl
              curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
              install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl
              
              # Install AWS CLI
              curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
              apt-get install -y unzip
              unzip awscliv2.zip
              ./aws/install
              
              # Configure kubectl for EKS
              aws eks update-kubeconfig --name tribetalk-eks --region ${var.aws_region}
              
              # Start Jenkins
              systemctl enable jenkins
              systemctl start jenkins
              
              # Wait for Jenkins to start
              sleep 30
              
              # Get initial admin password
              JENKINS_PASSWORD=$(cat /var/lib/jenkins/secrets/initialAdminPassword)
              echo "Jenkins Initial Admin Password: $JENKINS_PASSWORD" > /home/ubuntu/jenkins-password.txt
              
              # Install Jenkins plugins (optional, can be done via UI)
              # jenkins-cli install-plugin docker-plugin kubernetes-plugin git
              
              echo "Jenkins installation complete!" > /home/ubuntu/jenkins-install-complete.txt
              EOF
  )

  tags = {
    Name    = "tribetalk-jenkins"
    Service = "jenkins"
  }
}

# Elastic IP for Jenkins (optional, for stable access)
resource "aws_eip" "jenkins" {
  instance = aws_instance.jenkins.id
  domain   = "vpc"

  tags = {
    Name = "tribetalk-jenkins-eip"
  }

  depends_on = [aws_internet_gateway.main]
}
