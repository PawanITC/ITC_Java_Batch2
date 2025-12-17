# Jenkins CI/CD Implementation Guide for TribeTalk

## Overview

Complete guide to set up Jenkins for automated build, test, and deployment of TribeTalk microservices to AWS EKS.

**Current Status**: ✅ Jenkins infrastructure provisioned via Terraform  
**What's Left**: Configure Jenkins, install plugins, set up pipelines

---

## What You Already Have

### ✅ Infrastructure (via Terraform)
- **Jenkins EC2 Instance**: t3.medium with Elastic IP
- **IAM Roles**: ECR push, EKS access, CloudWatch logs
- **Security Group**: Ports 8080 (Jenkins), 22 (SSH), 50000 (agents)
- **User Data Script**: Auto-installs Jenkins, Docker, kubectl, AWS CLI
- **Jenkinsfile**: Multi-service pipeline for tribetalk, chatservice, notification-service

### ✅ Terraform Resources
- `terraform/jenkins.tf`: Jenkins EC2 instance and IAM roles
- `terraform/ecr.tf`: ECR repositories and Jenkins push policy
- `jenkins/Jenkinsfile`: Pipeline definition
- `jenkins/config/`: Jenkins configuration files
- `jenkins/shared-library/`: Shared pipeline library

---

## Implementation Steps

### Phase 1: Access Jenkins Server

#### 1.1 Get Jenkins URL and Password

After Terraform apply, get the Jenkins URL:

```bash
# Get Jenkins public IP
terraform output jenkins_public_ip

# Or get full URL
terraform output jenkins_url
# Output: http://<JENKINS_IP>:8080
```

#### 1.2 SSH to Jenkins Server

```bash
# Get the initial admin password
ssh -i ~/.ssh/your-key.pem ubuntu@<JENKINS_IP>
cat /var/lib/jenkins/secrets/initialAdminPassword

# Or from the file created by user-data
cat /home/ubuntu/jenkins-password.txt
```

#### 1.3 Access Jenkins Web UI

```bash
# Open in browser
open http://<JENKINS_IP>:8080

# Enter the initial admin password
```

---

### Phase 2: Initial Jenkins Setup

#### 2.1 Install Suggested Plugins

When prompted, select **"Install suggested plugins"**

This installs:
- Git plugin
- Pipeline plugin
- Credentials plugin
- SSH plugin
- And many more...

#### 2.2 Create Admin User

- Username: `admin` (or your choice)
- Password: (strong password)
- Full name: `TribeTalk Admin`
- Email: your-email@example.com

#### 2.3 Configure Jenkins URL

- Confirm Jenkins URL: `http://<JENKINS_IP>:8080`
- Click "Save and Finish"

---

### Phase 3: Install Required Plugins

#### 3.1 Navigate to Plugin Manager

`Manage Jenkins` → `Manage Plugins` → `Available` tab

#### 3.2 Install These Plugins

Search and install (check the box, then click "Install without restart"):

**Essential Plugins**:
- [ ] **Docker Pipeline** - Build and push Docker images
- [ ] **Kubernetes** - Deploy to EKS
- [ ] **Amazon ECR** - Push images to ECR
- [ ] **AWS Credentials** - Manage AWS credentials
- [ ] **Pipeline: AWS Steps** - AWS-specific pipeline steps
- [ ] **Git Parameter** - Allow branch/tag selection
- [ ] **Blue Ocean** - Modern UI for pipelines
- [ ] **Slack Notification** (optional) - Send build notifications

**Additional Useful Plugins**:
- [ ] **JUnit** - Test result visualization
- [ ] **Jacoco** - Code coverage
- [ ] **SonarQube Scanner** (optional) - Code quality
- [ ] **Prometheus Metrics** (optional) - Monitoring

#### 3.3 Restart Jenkins

After installation:
```bash
# Via UI: Check "Restart Jenkins when installation is complete"
# Or via SSH:
ssh ubuntu@<JENKINS_IP>
sudo systemctl restart jenkins
```

---

### Phase 4: Configure Credentials

#### 4.1 Add GitHub Credentials

`Manage Jenkins` → `Manage Credentials` → `(global)` → `Add Credentials`

**For GitHub Personal Access Token**:
- Kind: `Secret text`
- Secret: `<your-github-token>`
- ID: `github-token`
- Description: `GitHub Personal Access Token`

**For GitHub SSH Key** (alternative):
- Kind: `SSH Username with private key`
- ID: `github-ssh`
- Username: `git`
- Private Key: (paste your SSH private key)

#### 4.2 Add AWS Credentials

**Option 1: Use IAM Instance Profile** (Recommended - already configured via Terraform)
- Jenkins instance already has IAM role attached
- No additional credentials needed for AWS CLI/ECR/EKS

**Option 2: Add AWS Access Keys** (if needed):
- Kind: `AWS Credentials`
- ID: `aws-credentials`
- Access Key ID: `<your-access-key>`
- Secret Access Key: `<your-secret-key>`
- Description: `AWS Credentials for ECR/EKS`

#### 4.3 Add Docker Hub Credentials (optional)

If you need to pull from private Docker Hub repos:
- Kind: `Username with password`
- Username: `<dockerhub-username>`
- Password: `<dockerhub-password>`
- ID: `dockerhub-credentials`

---

### Phase 5: Configure Jenkins Global Settings

#### 5.1 Configure Git

`Manage Jenkins` → `Global Tool Configuration` → `Git`

- Name: `Default`
- Path to Git executable: `git` (auto-detected)

#### 5.2 Configure Maven

`Manage Jenkins` → `Global Tool Configuration` → `Maven`

- Name: `Maven 3.9`
- Install automatically: ✅
- Version: `3.9.6`

#### 5.3 Configure JDK

`Manage Jenkins` → `Global Tool Configuration` → `JDK`

- Name: `Java 21`
- Install automatically: ✅
- Version: `java-21-openjdk` (or use system JDK)

#### 5.4 Configure Docker

`Manage Jenkins` → `Global Tool Configuration` → `Docker`

- Name: `Docker`
- Install automatically: ❌ (already installed via Terraform)
- Docker installation root: `/usr/bin/docker`

---

### Phase 6: Create Jenkins Pipeline Jobs

#### 6.1 Create Multi-Branch Pipeline for TribeTalk

`New Item` → Enter name: `TribeTalk-Pipeline` → Select `Multibranch Pipeline`

**Branch Sources**:
- Add source: `Git`
- Project Repository: `https://github.com/your-org/ITC_Java_Batch2.git`
- Credentials: Select `github-token` or `github-ssh`
- Behaviors: `Discover branches` (all branches)

**Build Configuration**:
- Mode: `by Jenkinsfile`
- Script Path: `jenkins/Jenkinsfile`

**Scan Multibranch Pipeline Triggers**:
- ✅ Periodically if not otherwise run
- Interval: `1 hour`

**Save** and Jenkins will automatically scan for branches

#### 6.2 Create Parameterized Pipeline (Alternative)

For more control, create a parameterized pipeline:

`New Item` → Enter name: `TribeTalk-Build-Deploy` → Select `Pipeline`

**General**:
- ✅ This project is parameterized
- Add parameters:
  - **Choice Parameter**: `SERVICE`
    - Choices: `tribetalk`, `chatservice`, `notification-service`
  - **String Parameter**: `IMAGE_TAG`
    - Default: `latest`
  - **Boolean Parameter**: `DEPLOY_TO_EKS`
    - Default: `true`

**Pipeline**:
- Definition: `Pipeline script from SCM`
- SCM: `Git`
- Repository URL: `https://github.com/your-org/ITC_Java_Batch2.git`
- Credentials: Select `github-token`
- Branch: `*/main` (or `*/dev`)
- Script Path: `jenkins/Jenkinsfile`

**Save**

---

### Phase 7: Configure GitHub Webhooks

#### 7.1 Create Webhook in GitHub

Go to your GitHub repository:
`Settings` → `Webhooks` → `Add webhook`

**Webhook Configuration**:
- Payload URL: `http://<JENKINS_IP>:8080/github-webhook/`
- Content type: `application/json`
- Secret: (leave empty or add secret)
- Events: `Just the push event`
- ✅ Active

**Save**

#### 7.2 Configure Jenkins GitHub Plugin

`Manage Jenkins` → `Configure System` → `GitHub`

- Add GitHub Server
- Name: `GitHub`
- API URL: `https://api.github.com`
- Credentials: Select `github-token`
- ✅ Manage hooks

**Test connection** to verify

---

### Phase 8: Update Jenkinsfile for Your Environment

Your existing `jenkins/Jenkinsfile` needs minor updates:

#### 8.1 Update ECR Repository Names

```groovy
// Line 23: Update ECR repo naming
ECR_REPO = "${params.SERVICE}"  // Remove the conditional, use service name directly
```

#### 8.2 Update EKS Cluster Name

```groovy
// Line 19: Verify cluster name matches your Terraform output
EKS_CLUSTER_NAME = 'tribetalk-cluster'  // Update if different
```

#### 8.3 Add Frontend Build Stage (Optional)

Add this stage after the backend stages:

```groovy
stage('Build Frontend') {
    when {
        expression { params.SERVICE == 'frontend' }
    }
    steps {
        script {
            dir('tribe-talk-frontend') {
                echo "Building frontend..."
                sh """
                    npm install
                    npm run build
                """
            }
        }
    }
}
```

---

### Phase 9: Test the Pipeline

#### 9.1 Trigger Manual Build

1. Go to `TribeTalk-Build-Deploy` job
2. Click `Build with Parameters`
3. Select:
   - SERVICE: `tribetalk`
   - IMAGE_TAG: `v1.0`
   - DEPLOY_TO_EKS: `true`
4. Click `Build`

#### 9.2 Monitor Build

- Click on build number (e.g., `#1`)
- Click `Console Output` to see logs
- Or use Blue Ocean for better visualization

#### 9.3 Verify Deployment

```bash
# Check if deployment succeeded
kubectl get pods -l app=tribetalk

# Check deployment history
kubectl rollout history deployment/tribetalk
```

---

### Phase 10: Set Up Build Triggers

#### 10.1 Poll SCM (Simple)

In job configuration:
- ✅ Poll SCM
- Schedule: `H/5 * * * *` (every 5 minutes)

#### 10.2 GitHub Webhook (Recommended)

Already configured in Phase 7. Builds trigger automatically on push.

#### 10.3 Scheduled Builds (Nightly)

In job configuration:
- ✅ Build periodically
- Schedule: `H 2 * * *` (2 AM daily)

---

### Phase 11: Advanced Configuration

#### 11.1 Set Up Shared Library

Your `jenkins/shared-library/` directory can contain reusable pipeline code:

**Structure**:
```
jenkins/shared-library/
├── vars/
│   ├── buildDockerImage.groovy
│   ├── deployToEKS.groovy
│   └── sendSlackNotification.groovy
└── src/
    └── com/
        └── tribetalk/
            └── Utils.groovy
```

**Configure in Jenkins**:
`Manage Jenkins` → `Configure System` → `Global Pipeline Libraries`

- Name: `tribetalk-shared-library`
- Default version: `main`
- Retrieval method: `Modern SCM`
- Source Code Management: `Git`
- Project Repository: `https://github.com/your-org/ITC_Java_Batch2.git`
- Library Path: `jenkins/shared-library`

#### 11.2 Configure Slack Notifications

In Jenkinsfile, uncomment Slack notification lines:

```groovy
post {
    success {
        slackSend color: 'good', 
                  message: "Build #${BUILD_NUMBER} for ${SERVICE_NAME} succeeded!",
                  channel: '#tribetalk-builds'
    }
    failure {
        slackSend color: 'danger', 
                  message: "Build #${BUILD_NUMBER} for ${SERVICE_NAME} failed!",
                  channel: '#tribetalk-builds'
    }
}
```

Configure Slack in Jenkins:
`Manage Jenkins` → `Configure System` → `Slack`

- Workspace: `your-workspace`
- Credential: (add Slack token)
- Default channel: `#tribetalk-builds`

#### 11.3 Add SonarQube Integration (Optional)

For code quality analysis:

```groovy
stage('Code Quality') {
    steps {
        script {
            withSonarQubeEnv('SonarQube') {
                sh './mvnw sonar:sonar'
            }
        }
    }
}
```

---

## Complete Workflow

### Automated CI/CD Flow

```
1. Developer pushes code to GitHub
   ↓
2. GitHub webhook triggers Jenkins
   ↓
3. Jenkins Pipeline Stages:
   ├── Checkout code from GitHub
   ├── Build JAR with Maven
   ├── Run unit tests
   ├── Build Docker image
   ├── Push to Amazon ECR
   ├── Deploy to EKS
   └── Verify deployment
   ↓
4. Slack notification sent
   ↓
5. Application running in EKS
```

---

## Troubleshooting

### Issue: Jenkins can't connect to GitHub
**Solution**: 
- Verify GitHub token has `repo` scope
- Check firewall allows outbound HTTPS

### Issue: Docker build fails
**Solution**:
```bash
# Verify Docker is running
sudo systemctl status docker

# Check jenkins user in docker group
groups jenkins

# If not, add and restart
sudo usermod -aG docker jenkins
sudo systemctl restart jenkins
```

### Issue: ECR push fails
**Solution**:
```bash
# Verify IAM role has ECR permissions
aws ecr describe-repositories --region eu-north-1

# Test ECR login
aws ecr get-login-password --region eu-north-1 | docker login --username AWS --password-stdin <ECR_REGISTRY>
```

### Issue: EKS deployment fails
**Solution**:
```bash
# Verify kubeconfig
aws eks update-kubeconfig --name tribetalk-cluster --region eu-north-1

# Test kubectl access
kubectl get nodes

# Check IAM role has EKS permissions
aws eks describe-cluster --name tribetalk-cluster --region eu-north-1
```

---

## Security Best Practices

### ✅ Implemented
- IAM instance profile (no hardcoded AWS keys)
- HTTP-only cookies for Jenkins auth
- Security group restricts access

### 🔒 Recommended
- [ ] Enable HTTPS for Jenkins (use ALB + ACM certificate)
- [ ] Restrict Jenkins access by IP (update security group)
- [ ] Enable Jenkins CSRF protection
- [ ] Use Jenkins secrets for sensitive data
- [ ] Rotate GitHub tokens regularly
- [ ] Enable audit logging

---

## Monitoring & Maintenance

### Jenkins Health Checks

```bash
# Check Jenkins status
sudo systemctl status jenkins

# View Jenkins logs
sudo journalctl -u jenkins -f

# Check disk space (builds consume space)
df -h
```

### Cleanup Old Builds

`Manage Jenkins` → Job → `Configure` → `Discard old builds`
- Days to keep builds: `30`
- Max # of builds to keep: `50`

### Backup Jenkins

```bash
# Backup Jenkins home directory
sudo tar -czf jenkins-backup-$(date +%Y%m%d).tar.gz /var/lib/jenkins/

# Upload to S3
aws s3 cp jenkins-backup-*.tar.gz s3://your-backup-bucket/jenkins/
```

---

## Summary Checklist

### Initial Setup
- [ ] Access Jenkins at http://<JENKINS_IP>:8080
- [ ] Complete setup wizard
- [ ] Install required plugins
- [ ] Create admin user

### Configuration
- [ ] Add GitHub credentials
- [ ] Configure AWS credentials (or use IAM role)
- [ ] Configure Git, Maven, JDK, Docker
- [ ] Create pipeline jobs
- [ ] Set up GitHub webhooks

### Testing
- [ ] Trigger manual build
- [ ] Verify Docker image pushed to ECR
- [ ] Verify deployment to EKS
- [ ] Test webhook trigger

### Advanced
- [ ] Configure shared library
- [ ] Set up Slack notifications
- [ ] Enable SonarQube (optional)
- [ ] Configure backup strategy

---

## Next Steps

1. **Access Jenkins**: Get IP from Terraform output
2. **Complete Setup**: Follow Phase 1-6
3. **Test Pipeline**: Build one service manually
4. **Enable Webhooks**: Automate builds on push
5. **Monitor**: Check builds and deployments

**Estimated Time**: 2-3 hours for complete setup
