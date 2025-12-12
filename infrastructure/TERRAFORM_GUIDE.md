# TribeTalk Terraform Infrastructure Guide

This guide explains the Terraform infrastructure setup for the TribeTalk application and how to use it.

## Overview

The Terraform configuration provisions a complete AWS infrastructure for running TribeTalk on Amazon EKS (Elastic Kubernetes Service). The infrastructure is designed to be production-ready with proper networking, security, and scalability.

## What Terraform Creates

### 1. **Networking (VPC)**
- **VPC**: Custom Virtual Private Cloud in `eu-north-1` region
- **Subnets**: 
  - 2 Public subnets (for load balancers and NAT gateways)
  - 2 Private subnets (for EKS worker nodes and application pods)
- **Internet Gateway**: For public subnet internet access
- **NAT Gateways**: For private subnet outbound internet access
- **Route Tables**: Proper routing for public and private subnets

### 2. **EKS Cluster**
- **Cluster**: Managed Kubernetes cluster (version 1.31)
- **Node Group**: Auto-scaling group of EC2 instances
  - Instance type: `t3.medium`
  - Min nodes: 2
  - Max nodes: 4
  - Desired: 2
- **OIDC Provider**: For IAM roles for service accounts (IRSA)

### 3. **Load Balancer Controller**
- **AWS Load Balancer Controller**: Manages ALB/NLB from Kubernetes
- **IAM Role**: With permissions to create/manage load balancers
- **Helm Chart**: Deployed via Terraform

### 4. **Supporting EC2 Instances**
- **PostgreSQL Server**: EC2 instance running PostgreSQL 14
- **MongoDB Server**: EC2 instance running MongoDB
- **Redis Server**: EC2 instance running Redis
- **Kafka Server**: EC2 instance running Apache Kafka (KRaft mode)

### 5. **Security**
- **Security Groups**: Properly configured for each component
- **IAM Roles**: For EKS cluster, node groups, and load balancer controller
- **Key Pairs**: SSH access to EC2 instances

## Directory Structure

```
infrastructure/
├── main.tf                 # Main Terraform configuration
├── variables.tf            # Input variables
├── outputs.tf             # Output values
├── vpc.tf                 # VPC and networking resources
├── eks.tf                 # EKS cluster configuration
├── ec2.tf                 # EC2 instances for databases
├── security-groups.tf     # Security group rules
├── terraform.tfvars       # Variable values (gitignored)
└── terraform.tfstate      # State file (gitignored)
```

## Prerequisites

Before using Terraform, ensure you have:

1. **AWS CLI** configured with credentials
   ```bash
   aws configure
   ```

2. **Terraform** installed (version >= 1.0)
   ```bash
   terraform --version
   ```

3. **kubectl** installed
   ```bash
   kubectl version --client
   ```

4. **AWS Permissions**: Your AWS user/role needs permissions to create:
   - VPC and networking resources
   - EKS clusters
   - EC2 instances
   - IAM roles and policies
   - Load balancers

## Usage

### Initial Setup

1. **Navigate to infrastructure directory**
   ```bash
   cd infrastructure
   ```

2. **Initialize Terraform**
   ```bash
   terraform init
   ```
   This downloads required providers (AWS, Kubernetes, Helm).

3. **Review the plan**
   ```bash
   terraform plan
   ```
   This shows what resources will be created.

4. **Apply the configuration**
   ```bash
   terraform apply
   ```
   Type `yes` when prompted. This takes ~15-20 minutes.

### Post-Deployment

1. **Configure kubectl**
   ```bash
   aws eks update-kubeconfig --region eu-north-1 --name tribetalk-eks-cluster
   ```

2. **Verify cluster access**
   ```bash
   kubectl get nodes
   ```

3. **Save important outputs**
   ```bash
   terraform output > terraform-outputs.txt
   ```

### Updating Infrastructure

To modify the infrastructure:

1. **Edit Terraform files** (e.g., `main.tf`, `variables.tf`)

2. **Plan changes**
   ```bash
   terraform plan
   ```

3. **Apply changes**
   ```bash
   terraform apply
   ```

### Destroying Infrastructure

> ⚠️ **WARNING**: This will delete ALL resources and data!

```bash
terraform destroy
```

## Key Configuration Variables

Edit `terraform.tfvars` to customize:

```hcl
aws_region          = "eu-north-1"
cluster_name        = "tribetalk-eks-cluster"
node_instance_type  = "t3.medium"
desired_node_count  = 2
min_node_count      = 2
max_node_count      = 4
```

## Terraform Outputs

After `terraform apply`, you'll get:

| Output | Description | Usage |
|--------|-------------|-------|
| `vpc_id` | VPC ID | Reference for other resources |
| `eks_cluster_endpoint` | EKS API endpoint | Kubernetes API access |
| `eks_cluster_name` | Cluster name | kubectl configuration |
| `load_balancer_role_arn` | IAM role ARN | Load balancer controller |
| `postgresql_private_ip` | PostgreSQL IP | Database connection |
| `mongodb_private_ip` | MongoDB IP | Database connection |
| `redis_private_ip` | Redis IP | Cache connection |
| `kafka_private_ip` | Kafka IP | Message broker connection |

## Common Operations

### Scaling Node Group

Edit `terraform.tfvars`:
```hcl
desired_node_count = 3  # Change from 2 to 3
```

Then apply:
```bash
terraform apply
```

### Changing Instance Types

Edit `terraform.tfvars`:
```hcl
node_instance_type = "t3.large"  # Upgrade from t3.medium
```

Then apply:
```bash
terraform apply
```

### Adding Tags

Edit `main.tf` and add tags to resources:
```hcl
tags = {
  Environment = "production"
  Project     = "TribeTalk"
  ManagedBy   = "Terraform"
}
```

## Troubleshooting

### Issue: `terraform init` fails

**Solution**: Check internet connectivity and AWS credentials
```bash
aws sts get-caller-identity
```

### Issue: EKS cluster creation fails

**Solution**: Check AWS service quotas
```bash
aws service-quotas list-service-quotas --service-code eks
```

### Issue: Can't connect to cluster

**Solution**: Update kubeconfig
```bash
aws eks update-kubeconfig --region eu-north-1 --name tribetalk-eks-cluster
```

### Issue: Terraform state locked

**Solution**: If previous apply failed, unlock state
```bash
terraform force-unlock <LOCK_ID>
```

## State Management

### Local State (Current Setup)
- State stored in `terraform.tfstate`
- **Important**: Backup this file regularly
- **Never commit** to git (already in `.gitignore`)

### Remote State (Recommended for Teams)

For team collaboration, use S3 backend:

1. Create S3 bucket:
   ```bash
   aws s3 mb s3://tribetalk-terraform-state
   ```

2. Add backend configuration to `main.tf`:
   ```hcl
   terraform {
     backend "s3" {
       bucket = "tribetalk-terraform-state"
       key    = "tribetalk/terraform.tfstate"
       region = "eu-north-1"
     }
   }
   ```

3. Initialize backend:
   ```bash
   terraform init -migrate-state
   ```

## Cost Estimation

Approximate monthly costs (eu-north-1):

| Resource | Cost |
|----------|------|
| EKS Cluster | $73/month |
| 2x t3.medium nodes | ~$60/month |
| NAT Gateways (2) | ~$65/month |
| EC2 instances (4x t3.small) | ~$60/month |
| ALB | ~$20/month |
| **Total** | **~$278/month** |

> Use AWS Cost Calculator for accurate estimates

## Security Best Practices

1. **Never commit secrets** to git
2. **Use IAM roles** instead of access keys where possible
3. **Enable VPC Flow Logs** for network monitoring
4. **Regularly update** EKS cluster version
5. **Use private subnets** for sensitive workloads
6. **Enable encryption** for EBS volumes and databases

## Next Steps

After infrastructure is provisioned:

1. **Deploy Kubernetes resources**
   ```bash
   kubectl apply -f k8s/
   ```

2. **Configure DNS** (optional)
   - Point your domain to the ALB DNS name
   - Update `VITE_API_BASE_URL` in frontend

3. **Set up monitoring** (optional)
   - Deploy Prometheus/Grafana
   - Configure CloudWatch logs

4. **Enable backups**
   - Configure automated snapshots for databases
   - Set up S3 backup for application data

## Additional Resources

- [Terraform AWS Provider Docs](https://registry.terraform.io/providers/hashicorp/aws/latest/docs)
- [EKS Best Practices](https://aws.github.io/aws-eks-best-practices/)
- [AWS Load Balancer Controller](https://kubernetes-sigs.github.io/aws-load-balancer-controller/)

## Support

For issues or questions:
- Check `TROUBLESHOOTING.md`
- Review Terraform logs: `terraform apply -debug`
- Check AWS CloudWatch logs
- Verify security group rules

---

**Last Updated**: December 2025  
**Terraform Version**: 1.x  
**AWS Provider Version**: ~> 5.0
