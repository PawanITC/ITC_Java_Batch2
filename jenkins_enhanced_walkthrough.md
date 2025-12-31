# Enhanced Jenkins Pipeline Implementation - Walkthrough

## Overview

Successfully updated Jenkins pipeline to support **all 4 TribeTalk services** including the frontend, with intelligent conditional build logic for backend (Maven) and frontend (npm) services.

**Status**: ✅ Jenkinsfile Updated  
**Services Supported**: 4 (tribetalk, chatservice, notification-service, tribe-talk-frontend)

---

## What Changed

### Before (Original Jenkinsfile)

**Supported Services**: 3 backend services only
```groovy
choices: ['tribetalk', 'chatservice', 'notification-service']
```

**Build Process**: Maven-only (Java services)
- Build JAR
- Run tests
- Build Docker image
- Push to ECR
- Deploy to EKS

### After (Enhanced Jenkinsfile)

**Supported Services**: All 4 services
```groovy
choices: ['tribetalk', 'chatservice', 'notification-service', 'tribe-talk-frontend']
```

**Build Process**: Conditional based on service type
- **Backend (Java)**: Maven build → Tests → Docker → ECR → EKS
- **Frontend (React)**: npm install → npm build → Docker → ECR → EKS

---

## Key Enhancements

### 1. Added Frontend Service Choice

**File**: [`jenkins/Jenkinsfile`](file:///Users/rahissmac/Documents/dump%20files/ITCJavaBatch2_Antigravity/ITC_Java_Batch2/jenkins/Jenkinsfile)

```groovy
parameters {
    choice(
        name: 'SERVICE', 
        choices: ['tribetalk', 'chatservice', 'notification-service', 'tribe-talk-frontend'],
        description: 'Select service to build'
    )
    string(name: 'VITE_API_BASE_URL', defaultValue: '', description: 'Frontend API URL (leave empty for auto-detect)')
}
```

### 2. Conditional Build Stages

**Backend Stages** (run only for Java services):
```groovy
stage('Build JAR') {
    when {
        expression { params.SERVICE != 'tribe-talk-frontend' }
    }
    steps {
        sh './mvnw clean package -DskipTests'
    }
}
```

**Frontend Stages** (run only for React app):
```groovy
stage('Build Frontend') {
    when {
        expression { params.SERVICE == 'tribe-talk-frontend' }
    }
    steps {
        sh 'npm install'
        sh 'npm run build'
    }
}
```

### 3. Auto-Detection of Environment Variables

For frontend builds, the pipeline automatically:
- Fetches ALB DNS from Kubernetes ingress
- Retrieves GitHub client ID from Kubernetes secrets
- Passes them to npm build and Docker build

```groovy
def apiBaseUrl = sh(
    script: "kubectl get ingress tribetalk-ingress -o jsonpath='{.status.loadBalancer.ingress[0].hostname}'",
    returnStdout: true
).trim()

def githubClientId = sh(
    script: "kubectl get secret tribetalk-app-secrets -o jsonpath='{.data.github_client_id}' | base64 -d",
    returnStdout: true
).trim()
```

### 4. Service Port Helper Function

Added utility function to get correct port for each service:

```groovy
def getServicePort(service) {
    switch(service) {
        case 'tribetalk': return '8080'
        case 'chatservice': return '8081'
        case 'notification-service': return '8082'
        case 'tribe-talk-frontend': return '80'
        default: return '8080'
    }
}
```

### 5. Updated EKS Cluster Name

Changed from `tribetalk-eks` to `tribetalk-cluster` to match actual cluster name.

### 6. Simplified ECR Repository Naming

Removed conditional logic for tribetalk service:
```groovy
// Before
ECR_REPO = "${params.SERVICE == 'tribetalk' ? 'tribetalk-service' : params.SERVICE}"

// After
ECR_REPO = "${params.SERVICE}"
```

---

## Build Flow Comparison

### Backend Service Build (tribetalk, chatservice, notification-service)

```
1. Checkout code
2. Build JAR (./mvnw clean package)
3. Run tests (./mvnw test)
4. Build Docker image
5. Tag image (latest + build number)
6. Push to ECR
7. Deploy to EKS
8. Verify deployment
```

### Frontend Service Build (tribe-talk-frontend)

```
1. Checkout code
2. Get ALB DNS from ingress
3. Get GitHub client ID from secrets
4. Install dependencies (npm install)
5. Build production bundle (npm run build)
6. Build Docker image with build args
7. Tag image (latest + build number)
8. Push to ECR
9. Deploy to EKS
10. Verify deployment
```

---

## Service-Specific Build Details

### tribetalk (Backend)
- **Directory**: `tribetalk/`
- **Build**: Maven
- **Port**: 8080
- **ECR Repo**: `tribetalk`
- **Deployment**: `deployment/tribetalk`

### chatservice (Backend)
- **Directory**: `chatservice/`
- **Build**: Maven
- **Port**: 8081
- **ECR Repo**: `chatservice`
- **Deployment**: `deployment/chatservice`

### notification-service (Backend)
- **Directory**: `notification-service/`
- **Build**: Maven
- **Port**: 8082
- **ECR Repo**: `notification-service`
- **Deployment**: `deployment/notification-service`

### tribe-talk-frontend (Frontend)
- **Directory**: `tribe-talk-frontend/`
- **Build**: npm
- **Port**: 80
- **ECR Repo**: `tribe-talk-frontend`
- **Deployment**: `deployment/tribe-talk-frontend`
- **Build Args**: `VITE_API_BASE_URL`, `VITE_GITHUB_CLIENT_ID`

---

## Parameters

### SERVICE
**Type**: Choice  
**Options**: tribetalk, chatservice, notification-service, tribe-talk-frontend  
**Description**: Select which service to build and deploy

### IMAGE_TAG
**Type**: String  
**Default**: `latest`  
**Description**: Docker image tag (e.g., v1.0, v1.1, latest)

### DEPLOY_TO_EKS
**Type**: Boolean  
**Default**: `true`  
**Description**: Whether to deploy to EKS after building

### VITE_API_BASE_URL
**Type**: String  
**Default**: `` (empty = auto-detect)  
**Description**: Frontend API URL (only for tribe-talk-frontend)

---

## Next Steps

### 1. Set Up Jenkins Server

Follow the [Jenkins Implementation Guide](file:///Users/rahissmac/.gemini/antigravity/brain/6d17b60c-1f59-4ada-b3ad-45d75900d372/jenkins_implementation_guide.md):

```bash
# Get Jenkins IP from Terraform
terraform output jenkins_public_ip

# Access Jenkins
open http://<JENKINS_IP>:8080
```

### 2. Configure Jenkins

- Install required plugins (Docker, Kubernetes, AWS, Git)
- Add GitHub credentials
- Configure AWS access (IAM role already attached)
- Set up Git, Maven, JDK, Docker tools

### 3. Create Pipeline Job

- Create new job: `TribeTalk-Build-Deploy`
- Type: Pipeline
- Add parameters (SERVICE, IMAGE_TAG, DEPLOY_TO_EKS, VITE_API_BASE_URL)
- Point to `jenkins/Jenkinsfile`

### 4. Test Each Service

**Backend Services**:
```bash
# Build tribetalk
SERVICE: tribetalk
IMAGE_TAG: v1.1
DEPLOY_TO_EKS: true

# Build chatservice
SERVICE: chatservice
IMAGE_TAG: v1.2
DEPLOY_TO_EKS: true

# Build notification-service
SERVICE: notification-service
IMAGE_TAG: v1.0
DEPLOY_TO_EKS: true
```

**Frontend**:
```bash
SERVICE: tribe-talk-frontend
IMAGE_TAG: v1.40
DEPLOY_TO_EKS: true
VITE_API_BASE_URL: (leave empty for auto-detect)
```

### 5. Set Up GitHub Webhook

Configure webhook to trigger builds automatically on push:
- Payload URL: `http://<JENKINS_IP>:8080/github-webhook/`
- Content type: `application/json`
- Events: `Just the push event`

---

## Testing the Pipeline

### Manual Build Test

1. Go to Jenkins job
2. Click "Build with Parameters"
3. Select `SERVICE: tribe-talk-frontend`
4. Set `IMAGE_TAG: test-v1`
5. Check `DEPLOY_TO_EKS: true`
6. Leave `VITE_API_BASE_URL` empty
7. Click "Build"

### Expected Output

```
[Pipeline] Start
[Pipeline] Checkout
[Pipeline] Build Frontend
  - Fetching ALB DNS: k8s-default-tribetal-089de13287-2075252521.eu-north-1.elb.amazonaws.com
  - Fetching GitHub client ID: Ov23lizJ8kpXKzpZZi2P
  - Building with API URL: http://k8s-default-tribetal-089de13287-2075252521.eu-north-1.elb.amazonaws.com
  - npm install
  - npm run build
[Pipeline] Build Docker Image
  - docker build --build-arg VITE_API_BASE_URL=... --build-arg VITE_GITHUB_CLIENT_ID=...
[Pipeline] Push to ECR
  - docker push 430006376054.dkr.ecr.eu-north-1.amazonaws.com/tribe-talk-frontend:test-v1
[Pipeline] Deploy to EKS
  - kubectl set image deployment/tribe-talk-frontend...
  - kubectl rollout status deployment/tribe-talk-frontend
[Pipeline] Verify Deployment
  - kubectl get pods -l app=tribe-talk-frontend
  - Deployment successful!
[Pipeline] Success
```

---

## Summary

✅ **Jenkinsfile Updated**: Now supports all 4 services  
✅ **Conditional Logic**: Backend (Maven) vs Frontend (npm)  
✅ **Auto-Detection**: Fetches ALB DNS and GitHub client ID  
✅ **Flexible Parameters**: Service selection, image tag, deployment flag  
✅ **EKS Integration**: Automated deployment to Kubernetes  

**Complete CI/CD Coverage**:
- tribetalk ✅
- chatservice ✅
- notification-service ✅
- tribe-talk-frontend ✅

**Next**: Set up Jenkins server and test the pipeline!
