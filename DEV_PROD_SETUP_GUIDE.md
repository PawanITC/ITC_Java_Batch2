# TribeTalk Development & Production Setup Guide

## Overview
This guide explains how to run TribeTalk in both local development and production environments. All services are configured to work seamlessly in both environments using environment variables with sensible localhost defaults.

---

## Configuration Strategy

All backend services use **environment variables with defaults**:
```properties
# Example from ChatService
spring.kafka.producer.bootstrap-servers=${SPRING_KAFKA_BOOTSTRAP_SERVERS:localhost:9092}
spring.data.mongodb.uri=${SPRING_DATA_MONGODB_URI:mongodb://admin:admin123@localhost:27017/tribetalknosqldb?authSource=admin}
```

**How it works:**
- **Local Development**: No environment variables set → uses `localhost` defaults
- **Production (K8s)**: Environment variables set via secrets → uses production values

---

## Local Development Setup

### Prerequisites
- Java 21
- Node.js 22+
- Docker Desktop
- Maven

### 1. Start Local Infrastructure

Use Docker Compose to run MongoDB, Kafka, Redis, and PostgreSQL locally:

```bash
cd infrastructure
docker-compose up -d
```

**Services Started:**
- MongoDB: `localhost:27017`
- Kafka: `localhost:9092`
- Zookeeper: `localhost:2181`
- PostgreSQL: `localhost:5432`
- Redis: `localhost:6379`

### 2. Run Backend Services

**ChatService:**
```bash
cd ChatService
mvn spring-boot:run
# Runs on http://localhost:8081
```

**Notification Service:**
```bash
cd notification-service
mvn spring-boot:run
# Runs on http://localhost:8082/notification
```

**Main TribeTalk Service:**
```bash
cd tribetalk
mvn spring-boot:run
# Runs on http://localhost:8080
```

### 3. Run Frontend

```bash
cd tribe-talk-frontend
npm install
npm run dev
# Runs on http://localhost:5173
```

**Frontend Environment Variables:**
Create `.env.local`:
```env
VITE_API_BASE_URL=http://localhost:8080
VITE_GITHUB_CLIENT_ID=your_github_client_id
```

---

## Production Deployment (AWS EKS)

### Infrastructure Components

**Deployed Resources:**
- EKS Cluster: `tribetalk-cluster`
- MongoDB EC2: `10.0.10.220:27017`
- Kafka EC2: `10.0.10.95:9092`
- Redis EC2: `10.0.10.133:6379`
- PostgreSQL RDS: `10.0.10.247:5432`
- Bastion Host: `51.20.93.11`

### Service Configuration

All services read configuration from Kubernetes secrets:

**ChatService Deployment:**
```yaml
env:
  - name: SPRING_KAFKA_BOOTSTRAP_SERVERS
    valueFrom:
      secretKeyRef:
        name: tribetalk-app-secrets
        key: kafka_bootstrap_servers
  - name: SPRING_DATA_MONGODB_URI
    valueFrom:
      secretKeyRef:
        name: tribetalk-database-secrets
        key: mongodb_uri
```

**Notification Service Deployment:**
```yaml
env:
  - name: SPRING_KAFKA_BOOTSTRAP_SERVERS
    valueFrom:
      secretKeyRef:
        name: tribetalk-app-secrets
        key: kafka_bootstrap_servers
  - name: SPRING_DATA_MONGODB_URI
    valueFrom:
      secretKeyRef:
        name: tribetalk-database-secrets
        key: mongodb_uri
```

**TribeTalk Service Deployment:**
```yaml
env:
  - name: SPRING_DATASOURCE_URL
    valueFrom:
      secretKeyRef:
        name: tribetalk-database-secrets
        key: postgres_url
  - name: SPRING_DATA_REDIS_HOST
    valueFrom:
      secretKeyRef:
        name: tribetalk-database-secrets
        key: redis_host
```

### Secrets Configuration

**Database Secrets:**
```bash
kubectl get secret tribetalk-database-secrets -o yaml
```
Contains:
- `postgres_url`: PostgreSQL connection string
- `postgres_username`: Database username
- `postgres_password`: Database password
- `mongodb_uri`: MongoDB connection string
- `mongodb_username`: MongoDB username
- `mongodb_password`: MongoDB password
- `redis_host`: Redis host IP
- `redis_password`: Redis password

**App Secrets:**
```bash
kubectl get secret tribetalk-app-secrets -o yaml
```
Contains:
- `kafka_bootstrap_servers`: Kafka broker address
- `github_client_id`: OAuth client ID
- `github_client_secret`: OAuth client secret

### Deployment Process

**1. Build Services:**
```bash
# ChatService
cd ChatService
mvn clean package -DskipTests
docker buildx build --platform linux/amd64 -t 430006376054.dkr.ecr.eu-north-1.amazonaws.com/chatservice:v1.2 . --load
docker push 430006376054.dkr.ecr.eu-north-1.amazonaws.com/chatservice:v1.2

# Notification Service
cd notification-service
mvn clean package -DskipTests
docker buildx build --platform linux/amd64 -t 430006376054.dkr.ecr.eu-north-1.amazonaws.com/notification-service:v1.0 . --load
docker push 430006376054.dkr.ecr.eu-north-1.amazonaws.com/notification-service:v1.0

# TribeTalk Service
cd tribetalk
mvn clean package -DskipTests
docker buildx build --platform linux/amd64 -t 430006376054.dkr.ecr.eu-north-1.amazonaws.com/tribetalk:v1.0 . --load
docker push 430006376054.dkr.ecr.eu-north-1.amazonaws.com/tribetalk:v1.0
```

**2. Build Frontend:**
```bash
cd tribe-talk-frontend
ALB_DNS=$(kubectl get ingress tribetalk-ingress -o jsonpath='{.status.loadBalancer.ingress[0].hostname}')
GITHUB_CLIENT_ID=$(kubectl get secret tribetalk-app-secrets -o jsonpath='{.data.github_client_id}' | base64 -d)

docker buildx build --platform linux/amd64 \
  --build-arg VITE_API_BASE_URL="http://${ALB_DNS}" \
  --build-arg VITE_GITHUB_CLIENT_ID="${GITHUB_CLIENT_ID}" \
  -t 430006376054.dkr.ecr.eu-north-1.amazonaws.com/tribe-talk-frontend:v1.39 . --load

docker push 430006376054.dkr.ecr.eu-north-1.amazonaws.com/tribe-talk-frontend:v1.39
```

**3. Deploy to Kubernetes:**
```bash
# Update image tags in deployment YAMLs
sed -i '' 's/:v1.1/:v1.2/' k8s/deployments/chatservice.yaml
sed -i '' 's/:v1.38/:v1.39/' k8s/deployments/tribe-talk-frontend.yaml

# Apply deployments
kubectl apply -f k8s/deployments/chatservice.yaml
kubectl apply -f k8s/deployments/notification-service.yaml
kubectl apply -f k8s/deployments/tribetalk.yaml
kubectl apply -f k8s/deployments/tribe-talk-frontend.yaml

# Wait for rollout
kubectl rollout status deployment/chatservice --timeout=3m
kubectl rollout status deployment/notification-service --timeout=3m
kubectl rollout status deployment/tribetalk --timeout=3m
kubectl rollout status deployment/tribe-talk-frontend --timeout=3m
```

---

## Service Versions

**Current Production Versions:**
- ChatService: `v1.2` (Kafka fix)
- Notification Service: `v1.0`
- TribeTalk: `v1.0`
- Frontend: `v1.39` (MessageDetails fix)

---

## Environment Variable Reference

### ChatService
| Variable | Local Default | Production Value |
|----------|---------------|------------------|
| `SPRING_KAFKA_BOOTSTRAP_SERVERS` | `localhost:9092` | `10.0.10.95:9092` |
| `SPRING_DATA_MONGODB_URI` | `mongodb://admin:admin123@localhost:27017/tribetalknosqldb?authSource=admin` | From secret |
| `SERVER_PORT` | `8081` | `8081` |

### Notification Service
| Variable | Local Default | Production Value |
|----------|---------------|------------------|
| `SPRING_KAFKA_BOOTSTRAP_SERVERS` | `localhost:9092` | `10.0.10.95:9092` |
| `SPRING_DATA_MONGODB_URI` | `mongodb://admin:admin123@localhost:27017/tribetalknosqldb?authSource=admin` | From secret |
| `SERVER_PORT` | `8082` | `8082` |

### TribeTalk Service
| Variable | Local Default | Production Value |
|----------|---------------|------------------|
| `SPRING_DATASOURCE_URL` | `jdbc:postgresql://localhost:5432/tribetalk` | From secret |
| `SPRING_DATA_REDIS_HOST` | `localhost` | `10.0.10.133` |
| `SERVER_PORT` | `8080` | `8080` |

### Frontend
| Variable | Local Default | Production Value |
|----------|---------------|------------------|
| `VITE_API_BASE_URL` | `http://localhost:8080` | `http://k8s-default-tribetal-...` |
| `VITE_GITHUB_CLIENT_ID` | (set in `.env.local`) | From secret |

---

## Testing

### Local Development
```bash
# Test backend
curl http://localhost:8080/api/users/all

# Test frontend
open http://localhost:5173
```

### Production
```bash
# Get ALB DNS
kubectl get ingress tribetalk-ingress -o jsonpath='{.status.loadBalancer.ingress[0].hostname}'

# Test backend
curl http://<ALB_DNS>/api/users/all

# Test frontend
open http://<ALB_DNS>
```

---

## Troubleshooting

### Local Development Issues

**MongoDB Connection Failed:**
```bash
docker ps | grep mongo
# If not running:
cd infrastructure && docker-compose up -d mongodb
```

**Kafka Connection Failed:**
```bash
docker ps | grep kafka
# If not running:
cd infrastructure && docker-compose up -d kafka zookeeper
```

### Production Issues

**Check Pod Status:**
```bash
kubectl get pods -l app=chatservice
kubectl logs -l app=chatservice --tail=50
```

**Check Secrets:**
```bash
kubectl get secret tribetalk-app-secrets -o json | jq -r '.data | to_entries[] | "\(.key): \(.value | @base64d)"'
```

**Verify Kafka Connectivity:**
```bash
kubectl run kafka-test --image=busybox --rm -it --restart=Never -- nc -zv 10.0.10.95 9092
```

---

## Summary

✅ **Local Development**: All services use localhost defaults  
✅ **Production**: All services use environment variables from K8s secrets  
✅ **No Code Changes**: Same codebase works in both environments  
✅ **Easy Switching**: Just set/unset environment variables
