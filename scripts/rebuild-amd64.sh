#!/bin/bash
# Rebuild with correct platform (AMD64) for EKS nodes
# This fixes the "no match for platform" error

set -e

echo "🔧 Rebuilding Docker Images for AMD64 Platform"
echo "==============================================="
echo ""

ECR_REGISTRY="430006376054.dkr.ecr.eu-north-1.amazonaws.com"
VERSION="v4.0-tempo-eks"
REGION="eu-north-1"

# Login to ECR
echo "🔐 Logging in to ECR..."
aws ecr get-login-password --region $REGION | docker login --username AWS --password-stdin $ECR_REGISTRY
echo "✅ ECR login successful"
echo ""

# Build TribeTalk for AMD64
echo "📦 Building TribeTalk (AMD64)..."
cd tribetalk
docker buildx build --platform linux/amd64 -t ${ECR_REGISTRY}/tribetalk-service:${VERSION} --push .
echo "✅ TribeTalk built and pushed"
cd ..
echo ""

# Build ChatService for AMD64
echo "📦 Building ChatService (AMD64)..."
cd ChatService
docker buildx build --platform linux/amd64 -t ${ECR_REGISTRY}/chatservice:${VERSION} --push .
echo "✅ ChatService built and pushed"
cd ..
echo ""

# Build NotificationService for AMD64
echo "📦 Building NotificationService (AMD64)..."
cd notification-service
docker buildx build --platform linux/amd64 -t ${ECR_REGISTRY}/notification-service:${VERSION} --push .
echo "✅ NotificationService built and pushed"
cd ..
echo ""

echo "🔄 Restarting deployments to pull new images..."
kubectl rollout restart deployment/tribetalk -n default
kubectl rollout restart deployment/chatservice -n default
kubectl rollout restart deployment/notification-service -n default
echo ""

echo "⏳ Waiting for rollouts..."
kubectl rollout status deployment/tribetalk -n default --timeout=300s
kubectl rollout status deployment/chatservice -n default --timeout=300s
kubectl rollout status deployment/notification-service -n default --timeout=300s
echo ""

echo "✅ All done!"
kubectl get pods -n default
