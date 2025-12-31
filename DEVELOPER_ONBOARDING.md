# Developer Onboarding Guide - TribeTalk

## Prerequisites

### Required Tools
1. **AWS CLI** - For AWS access
2. **kubectl** - For Kubernetes cluster management
3. **Docker Desktop** - For building images
4. **Java 21** - For backend development
5. **Maven 3.9+** - For building Java projects
6. **Node.js 22+** - For frontend development
7. **Git** - For version control

### AWS Access Setup

#### 1. Get AWS Credentials
Contact the team lead to get:
- AWS Access Key ID
- AWS Secret Access Key
- AWS Region: `eu-north-1`

#### 2. Configure AWS CLI
```bash
aws configure
# Enter your AWS Access Key ID
# Enter your AWS Secret Access Key
# Default region: eu-north-1
# Default output format: json
```

#### 3. Verify AWS Access
```bash
aws sts get-caller-identity
```

---

## Kubernetes Cluster Access

### 1. Configure kubectl
```bash
aws eks update-kubeconfig --region eu-north-1 --name tribetalk-cluster
```

### 2. Verify Cluster Access
```bash
kubectl get nodes
kubectl get pods
```

You should see all running pods:
- `chatservice-*`
- `notification-service-*`
- `tribe-talk-frontend-*`
- `tribetalk-*`

---

## ECR (Docker Registry) Access

### 1. Login to ECR
```bash
aws ecr get-login-password --region eu-north-1 | \
  docker login --username AWS --password-stdin \
  430006376054.dkr.ecr.eu-north-1.amazonaws.com
```

### 2. Verify ECR Access
```bash
aws ecr describe-repositories --region eu-north-1
```

You should see repositories:
- `tribetalk`
- `chatservice`
- `notification-service`
- `tribe-talk-frontend`

---

## Local Development Setup

### 1. Clone the Repository
```bash
git clone <repository-url>
cd ITC_Java_Batch2
```

### 2. Backend Services Setup

#### TribeTalk (Main Service)
```bash
cd tribetalk
mvn clean install -DskipTests
```

#### ChatService
```bash
cd ChatService
mvn clean install -DskipTests
```

#### Notification Service
```bash
cd notification-service
mvn clean install -DskipTests
```

### 3. Frontend Setup
```bash
cd tribe-talk-frontend
npm install
```

---

## Making Changes and Deploying

### Backend Service Deployment (Example: ChatService)

#### 1. Make Code Changes
Edit files in `ChatService/src/main/java/...`

#### 2. Build the Project
```bash
cd ChatService
mvn clean package -DskipTests
```

#### 3. Build Docker Image
```bash
# Login to ECR first
aws ecr get-login-password --region eu-north-1 | \
  docker login --username AWS --password-stdin \
  430006376054.dkr.ecr.eu-north-1.amazonaws.com

# Build and push (increment version number)
docker buildx build --platform linux/amd64 \
  -t 430006376054.dkr.ecr.eu-north-1.amazonaws.com/chatservice:v1.8-your-feature \
  --push .
```

#### 4. Update Kubernetes Deployment
```bash
# Edit k8s/deployments/chatservice.yaml
# Update the image tag to your new version

# Apply changes
kubectl apply -f k8s/deployments/chatservice.yaml

# Watch deployment
kubectl rollout status deployment/chatservice
```

### Frontend Deployment

#### 1. Make Code Changes
Edit files in `tribe-talk-frontend/src/...`

#### 2. Build Frontend
```bash
cd tribe-talk-frontend
npm run build
```

#### 3. Build and Push Docker Image
```bash
docker buildx build --platform linux/amd64 \
  --build-arg VITE_API_BASE_URL=http://k8s-default-tribetal-089de13287-2075252521.eu-north-1.elb.amazonaws.com \
  -t 430006376054.dkr.ecr.eu-north-1.amazonaws.com/tribe-talk-frontend:v2.11-your-feature \
  --push .
```

#### 4. Update Deployment
```bash
kubectl set image deployment/tribe-talk-frontend \
  tribe-talk-frontend=430006376054.dkr.ecr.eu-north-1.amazonaws.com/tribe-talk-frontend:v2.11-your-feature
```

---

## Useful Commands

### Check Pod Status
```bash
kubectl get pods
kubectl describe pod <pod-name>
kubectl logs <pod-name>
kubectl logs <pod-name> --previous  # Previous container logs
```

### Check Services
```bash
kubectl get services
kubectl get ingress
```

### Restart a Service
```bash
kubectl rollout restart deployment/<service-name>
```

### Delete Old Resources
```bash
# Delete old replicasets
kubectl get replicasets | grep "0         0         0"
kubectl delete replicaset <replicaset-name>
```

### Access Application
Production URL: `http://k8s-default-tribetal-089de13287-2075252521.eu-north-1.elb.amazonaws.com`

---

## Environment Variables & Secrets

### View Secrets (Encrypted)
```bash
kubectl get secrets
kubectl describe secret tribetalk-database-secrets
kubectl describe secret tribetalk-app-secrets
```

### Important Environment Variables

**Backend Services**:
- `SPRING_DATA_MONGODB_URI` - MongoDB connection
- `SPRING_KAFKA_BOOTSTRAP_SERVERS` - Kafka broker (10.0.10.95:9092)
- `SERVER_PORT` - Service port

**Frontend**:
- `VITE_API_BASE_URL` - Backend API URL (set during Docker build)

---

## Troubleshooting

### Pod Not Starting
```bash
kubectl describe pod <pod-name>
kubectl logs <pod-name>
```

Common issues:
- Image pull errors → Check ECR login
- CrashLoopBackOff → Check application logs
- Pending → Resource constraints (delete old pods)

### Service Not Accessible
```bash
kubectl get endpoints <service-name>
kubectl get ingress
```

### Health Check Failures
```bash
kubectl exec <pod-name> -- curl http://localhost:<port>/actuator/health
```

---

## Architecture Overview

See [ARCHITECTURE.md](./ARCHITECTURE.md) for detailed system architecture.

**Services**:
1. **TribeTalk** (Port 8080) - Main backend service
2. **ChatService** (Port 8081) - Real-time messaging
3. **Notification-Service** (Port 8082) - Push notifications
4. **Frontend** (Port 80) - React application

**Infrastructure**:
- **EKS Cluster**: Kubernetes on AWS
- **MongoDB**: NoSQL database (10.0.10.220:27017)
- **PostgreSQL**: Relational database (10.0.10.95:5432)
- **Kafka**: Message broker (10.0.10.95:9092)
- **Redis**: Cache (10.0.10.95:6379)

---

## Best Practices

### 1. Version Naming
Use semantic versioning: `v<major>.<minor>-<description>`
- Example: `v1.8-add-feature`, `v2.11-bug-fix`

### 2. Testing Before Deploy
- Build locally first
- Test with `mvn test` or `npm test`
- Verify Docker image builds successfully

### 3. Deployment Strategy
- Deploy to staging/dev first (if available)
- Monitor logs after deployment
- Keep previous version tag for rollback

### 4. Rollback if Needed
```bash
kubectl rollout undo deployment/<service-name>
```

### 5. Resource Cleanup
- Delete old replicasets regularly
- Monitor cluster resources with `kubectl top nodes`

---

## Getting Help

1. **Check Logs**: `kubectl logs <pod-name>`
2. **Check Events**: `kubectl describe pod <pod-name>`
3. **Review Documentation**: See ARCHITECTURE.md, README.md
4. **Contact Team Lead**: For AWS access issues or architecture questions

---

## Quick Reference

| Task | Command |
|------|---------|
| Get pods | `kubectl get pods` |
| Get logs | `kubectl logs <pod-name>` |
| Build backend | `mvn clean package -DskipTests` |
| Build frontend | `npm run build` |
| Push image | `docker buildx build --platform linux/amd64 -t <image> --push .` |
| Deploy | `kubectl apply -f k8s/deployments/<file>.yaml` |
| Rollback | `kubectl rollout undo deployment/<name>` |

---

## Important URLs

- **Production App**: http://k8s-default-tribetal-089de13287-2075252521.eu-north-1.elb.amazonaws.com
- **AWS Console**: https://console.aws.amazon.com
- **ECR**: https://eu-north-1.console.aws.amazon.com/ecr

---

**Welcome to the TribeTalk team! 🚀**
