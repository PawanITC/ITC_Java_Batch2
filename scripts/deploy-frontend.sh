#!/bin/bash
set -e

# TribeTalk Frontend Build and Deploy Script
# This script builds the frontend, creates a Docker image, pushes to ECR, and deploys to K8s

echo "========================================="
echo "TribeTalk Frontend Deployment"
echo "========================================="

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Configuration
AWS_REGION="eu-north-1"
AWS_ACCOUNT_ID="430006376054"
ECR_REPO="tribe-talk-frontend"
ECR_URL="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${ECR_REPO}"

# Get current version from k8s deployment
CURRENT_VERSION=$(grep "image:.*tribe-talk-frontend" k8s/deployments/tribe-talk-frontend.yaml | sed 's/.*:v//' | tr -d ' ')
echo -e "${YELLOW}Current version: v${CURRENT_VERSION}${NC}"

# Increment version (handle decimal versions)
# Extract the last number and increment it
if [[ $CURRENT_VERSION =~ \. ]]; then
    # Has decimal, increment the part after the last dot
    BASE_VERSION=$(echo $CURRENT_VERSION | sed 's/\.[^.]*$//')
    LAST_NUM=$(echo $CURRENT_VERSION | sed 's/.*\.//')
    NEW_LAST=$((LAST_NUM + 1))
    NEW_VERSION="${BASE_VERSION}.${NEW_LAST}"
else
    # No decimal, just increment
    NEW_VERSION=$((CURRENT_VERSION + 1))
fi
echo -e "${GREEN}New version: v${NEW_VERSION}${NC}"

# Get load balancer URL for API
echo ""
echo -e "${YELLOW}Fetching load balancer URL...${NC}"
ALB_DNS=$(kubectl get ingress tribetalk-ingress -o jsonpath='{.status.loadBalancer.ingress[0].hostname}' 2>/dev/null || echo "")

if [ -z "$ALB_DNS" ]; then
    echo -e "${RED}Warning: Could not fetch ALB DNS. Using default.${NC}"
    VITE_API_BASE_URL="http://localhost:8080"
else
    VITE_API_BASE_URL="http://${ALB_DNS}"
    echo -e "${GREEN}API Base URL: ${VITE_API_BASE_URL}${NC}"
fi

# Get GitHub Client ID from secrets
echo ""
echo -e "${YELLOW}Fetching GitHub Client ID from secrets...${NC}"
GITHUB_CLIENT_ID=$(kubectl get secret tribetalk-app-secrets -o jsonpath='{.data.github_client_id}' | base64 -d 2>/dev/null || echo "")

if [ -z "$GITHUB_CLIENT_ID" ]; then
    echo -e "${RED}Warning: Could not fetch GitHub Client ID${NC}"
    GITHUB_CLIENT_ID="placeholder"
fi

# Step 1: Login to ECR
echo ""
echo -e "${YELLOW}Step 1: Logging in to AWS ECR...${NC}"
aws ecr get-login-password --region ${AWS_REGION} | docker login --username AWS --password-stdin ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Successfully logged in to ECR${NC}"
else
    echo -e "${RED}✗ Failed to login to ECR${NC}"
    exit 1
fi

# Step 2: Build Docker image
echo ""
echo -e "${YELLOW}Step 2: Building Docker image...${NC}"
cd tribe-talk-frontend

docker build \
    --build-arg VITE_API_BASE_URL="${VITE_API_BASE_URL}" \
    --build-arg VITE_GITHUB_CLIENT_ID="${GITHUB_CLIENT_ID}" \
    -t ${ECR_REPO}:v${NEW_VERSION} \
    -t ${ECR_REPO}:latest \
    .

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Docker image built successfully${NC}"
else
    echo -e "${RED}✗ Failed to build Docker image${NC}"
    exit 1
fi

# Step 3: Tag and push to ECR
echo ""
echo -e "${YELLOW}Step 3: Pushing image to ECR...${NC}"

docker tag ${ECR_REPO}:v${NEW_VERSION} ${ECR_URL}:v${NEW_VERSION}
docker tag ${ECR_REPO}:latest ${ECR_URL}:latest

docker push ${ECR_URL}:v${NEW_VERSION}
docker push ${ECR_URL}:latest

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Image pushed to ECR successfully${NC}"
else
    echo -e "${RED}✗ Failed to push image to ECR${NC}"
    exit 1
fi

cd ..

# Step 4: Update Kubernetes deployment
echo ""
echo -e "${YELLOW}Step 4: Updating Kubernetes deployment...${NC}"

# Update the image version in the deployment file
sed -i.bak "s|image: ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${ECR_REPO}:v.*|image: ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${ECR_REPO}:v${NEW_VERSION}|" k8s/deployments/tribe-talk-frontend.yaml

# Apply the updated deployment
kubectl apply -f k8s/deployments/tribe-talk-frontend.yaml

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Kubernetes deployment updated${NC}"
else
    echo -e "${RED}✗ Failed to update Kubernetes deployment${NC}"
    exit 1
fi

# Step 5: Wait for rollout
echo ""
echo -e "${YELLOW}Step 5: Waiting for deployment rollout...${NC}"
kubectl rollout status deployment/tribe-talk-frontend --timeout=5m

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Deployment rolled out successfully${NC}"
else
    echo -e "${RED}✗ Deployment rollout failed${NC}"
    exit 1
fi

# Step 6: Verify deployment
echo ""
echo -e "${YELLOW}Step 6: Verifying deployment...${NC}"
kubectl get pods -l app=tribe-talk-frontend

echo ""
echo "========================================="
echo -e "${GREEN}Frontend deployment completed!${NC}"
echo "========================================="
echo ""
echo "Version: v${NEW_VERSION}"
echo "ECR Image: ${ECR_URL}:v${NEW_VERSION}"
echo "API Base URL: ${VITE_API_BASE_URL}"
echo ""
echo "Access your frontend at: http://${ALB_DNS}"
echo ""
echo "To check logs:"
echo "  kubectl logs -l app=tribe-talk-frontend -f"
echo ""
echo "To rollback if needed:"
echo "  kubectl rollout undo deployment/tribe-talk-frontend"
echo "========================================="
