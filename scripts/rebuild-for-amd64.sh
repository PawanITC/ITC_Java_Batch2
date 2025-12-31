#!/bin/bash
# Rebuild all Docker images for AMD64 platform and push to ECR

set -e

AWS_ACCOUNT_ID="430006376054"
AWS_REGION="eu-north-1"
VERSION="v1.0"

echo "Rebuilding Docker images for linux/amd64 platform..."

# TribeTalk Service
echo "Building tribetalk-service..."
cd tribetalk
docker buildx build --platform linux/amd64 -t tribetalk-service:${VERSION} . --load
docker tag tribetalk-service:${VERSION} ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/tribetalk-service:${VERSION}
docker push ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/tribetalk-service:${VERSION}
cd ..

# Chat Service
echo "Building chatservice..."
cd ChatService
docker buildx build --platform linux/amd64 -t chatservice:${VERSION} . --load
docker tag chatservice:${VERSION} ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/chatservice:${VERSION}
docker push ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/chatservice:${VERSION}
cd ..

# Notification Service
echo "Building notification-service..."
cd notification-service
docker buildx build --platform linux/amd64 -t notification-service:${VERSION} . --load
docker tag notification-service:${VERSION} ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/notification-service:${VERSION}
docker push ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/notification-service:${VERSION}
cd ..

# Frontend
echo "Building tribe-talk-frontend..."
cd tribe-talk-frontend
GITHUB_CLIENT_ID=$(aws secretsmanager get-secret-value --secret-id tribetalk/app/config --region ${AWS_REGION} --query SecretString --output text | jq -r '.github_client_id')
docker buildx build --platform linux/amd64 \
  --build-arg VITE_API_BASE_URL="http://PLACEHOLDER" \
  --build-arg VITE_GITHUB_CLIENT_ID="${GITHUB_CLIENT_ID}" \
  -t tribe-talk-frontend:${VERSION} . --load
docker tag tribe-talk-frontend:${VERSION} ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/tribe-talk-frontend:${VERSION}
docker push ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/tribe-talk-frontend:${VERSION}
cd ..

echo "✅ All images rebuilt for AMD64 and pushed to ECR!"
