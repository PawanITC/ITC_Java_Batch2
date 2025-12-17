# Jenkins CI/CD Coverage for TribeTalk Services

## Current Coverage

### ✅ **Already Supported** (Existing Jenkinsfile)

Your current `jenkins/Jenkinsfile` **already supports** these services:

1. **tribetalk** (Main backend service - Port 8080)
   - Maven build
   - Unit tests
   - Docker image build
   - ECR push
   - EKS deployment

2. **chatservice** (Chat microservice - Port 8081)
   - Maven build
   - Unit tests
   - Docker image build
   - ECR push
   - EKS deployment

3. **notification-service** (Notification microservice - Port 8082)
   - Maven build
   - Unit tests
   - Docker image build
   - ECR push
   - EKS deployment

### ❌ **Not Yet Supported**

4. **tribe-talk-frontend** (React frontend - Port 80)
   - Currently NOT in the service choices
   - Needs different build process (npm instead of Maven)

---

## How It Works

### Service Selection

When you run a Jenkins build, you select which service to build:

```
Build with Parameters:
├── SERVICE: [tribetalk | chatservice | notification-service]
├── IMAGE_TAG: v1.0 (or latest)
└── DEPLOY_TO_EKS: true/false
```

### Build Process for Each Service

**Backend Services** (tribetalk, chatservice, notification-service):
```
1. Checkout code from GitHub
2. Build JAR with Maven (./mvnw clean package)
3. Run unit tests (./mvnw test)
4. Build Docker image
5. Tag image (latest + build number)
6. Push to ECR
7. Deploy to EKS (kubectl set image)
8. Verify deployment (kubectl rollout status)
```

**Frontend** (needs to be added):
```
1. Checkout code from GitHub
2. Install dependencies (npm install)
3. Build production bundle (npm run build)
4. Build Docker image with nginx
5. Push to ECR
6. Deploy to EKS
7. Verify deployment
```

---

## Adding Frontend Support

### Option 1: Use Enhanced Jenkinsfile

I've created `jenkins/Jenkinsfile-enhanced` that includes frontend support.

**To use it**:
```bash
# Backup current Jenkinsfile
mv jenkins/Jenkinsfile jenkins/Jenkinsfile-backend-only

# Use enhanced version
mv jenkins/Jenkinsfile-enhanced jenkins/Jenkinsfile

# Commit and push
git add jenkins/Jenkinsfile
git commit -m "Add frontend support to Jenkins pipeline"
git push
```

**New service choices**:
- tribetalk
- chatservice
- notification-service
- **tribe-talk-frontend** ← NEW!

### Option 2: Create Separate Pipeline

Keep backend services in one pipeline, create a new pipeline for frontend:

**Create**: `jenkins/Jenkinsfile-frontend`

Then in Jenkins:
- Create new job: `TribeTalk-Frontend-Pipeline`
- Point to `jenkins/Jenkinsfile-frontend`

---

## Enhanced Jenkinsfile Features

### Conditional Build Stages

```groovy
// Backend stages run only for Java services
stage('Build JAR') {
    when {
        expression { params.SERVICE != 'tribe-talk-frontend' }
    }
    steps {
        sh './mvnw clean package -DskipTests'
    }
}

// Frontend stages run only for React app
stage('Build Frontend') {
    when {
        expression { params.SERVICE == 'tribe-talk-frontend' }
    }
    steps {
        sh 'npm install && npm run build'
    }
}
```

### Auto-Detection of Environment Variables

For frontend builds, the enhanced Jenkinsfile automatically:
- Fetches ALB DNS from Kubernetes ingress
- Retrieves GitHub client ID from Kubernetes secrets
- Passes them as build arguments to Docker

```groovy
// Auto-detect API URL
def apiBaseUrl = sh(
    script: "kubectl get ingress tribetalk-ingress -o jsonpath='{.status.loadBalancer.ingress[0].hostname}'",
    returnStdout: true
).trim()

// Build with environment variables
sh "VITE_API_BASE_URL=http://${apiBaseUrl} npm run build"
```

---

## Complete Service Matrix

| Service | Type | Port | Build Tool | Current Support | Enhanced Support |
|---------|------|------|------------|-----------------|------------------|
| tribetalk | Backend | 8080 | Maven | ✅ Yes | ✅ Yes |
| chatservice | Backend | 8081 | Maven | ✅ Yes | ✅ Yes |
| notification-service | Backend | 8082 | Maven | ✅ Yes | ✅ Yes |
| tribe-talk-frontend | Frontend | 80 | npm | ❌ No | ✅ Yes |

---

## Deployment Workflow

### Single Service Deployment

```bash
# In Jenkins UI
1. Click "Build with Parameters"
2. Select SERVICE: chatservice
3. Set IMAGE_TAG: v1.5
4. Check DEPLOY_TO_EKS: true
5. Click "Build"

# Result:
- Builds chatservice v1.5
- Pushes to ECR
- Deploys to EKS
- Other services unchanged
```

### All Services Deployment

To deploy all services, trigger 4 separate builds:

```bash
Build 1: SERVICE=tribetalk, IMAGE_TAG=v1.1
Build 2: SERVICE=chatservice, IMAGE_TAG=v1.2
Build 3: SERVICE=notification-service, IMAGE_TAG=v1.0
Build 4: SERVICE=tribe-talk-frontend, IMAGE_TAG=v1.40
```

Or create a **multi-service pipeline** that triggers all 4 in sequence.

---

## Summary

**Current State**:
- ✅ 3 backend services fully supported
- ❌ Frontend not included

**With Enhanced Jenkinsfile**:
- ✅ All 4 services supported
- ✅ Conditional build logic
- ✅ Auto-detection of environment variables
- ✅ Single pipeline for everything

**Recommendation**: Use the enhanced Jenkinsfile to get complete CI/CD coverage for all TribeTalk services!
