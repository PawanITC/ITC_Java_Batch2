#!/bin/bash
set -e

# TribeTalk Build and Deploy Script
# This script builds all microservices and prepares them for deployment

echo "========================================="
echo "TribeTalk Build and Deploy Script"
echo "========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BUILD_DIR="${PROJECT_ROOT}/build"
TERRAFORM_DIR="${PROJECT_ROOT}/terraform"
ANSIBLE_DIR="${PROJECT_ROOT}/ansible"

# Functions
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_info() {
    echo -e "${YELLOW}ℹ $1${NC}"
}

# Step 1: Build microservices
echo ""
print_info "Step 1: Building microservices..."

cd "${PROJECT_ROOT}/tribetalk"
print_info "Building TribeTalk service..."
./mvnw clean package -DskipTests
if [ $? -eq 0 ]; then
    print_success "TribeTalk built successfully"
else
    print_error "Failed to build TribeTalk"
    exit 1
fi

cd "${PROJECT_ROOT}/ChatService"
print_info "Building ChatService..."
./mvnw clean package -DskipTests
if [ $? -eq 0 ]; then
    print_success "ChatService built successfully"
else
    print_error "Failed to build ChatService"
    exit 1
fi

cd "${PROJECT_ROOT}/notification-service"
print_info "Building Notification Service..."
./mvnw clean package -DskipTests
if [ $? -eq 0 ]; then
    print_success "Notification Service built successfully"
else
    print_error "Failed to build Notification Service"
    exit 1
fi

# Step 2: Create build directory
echo ""
print_info "Step 2: Organizing build artifacts..."
mkdir -p "${BUILD_DIR}"

cp "${PROJECT_ROOT}/tribetalk/target/tribetalk-0.0.1-SNAPSHOT.jar" "${BUILD_DIR}/tribetalk.jar"
cp "${PROJECT_ROOT}/ChatService/target/ChatService-0.0.1-SNAPSHOT.jar" "${BUILD_DIR}/chatservice.jar"
cp "${PROJECT_ROOT}/notification-service/target/notification-service-0.0.1-SNAPSHOT.jar" "${BUILD_DIR}/notification-service.jar"

print_success "Build artifacts organized in ${BUILD_DIR}"

# Step 3: Display next steps
echo ""
echo "========================================="
echo "Build completed successfully!"
echo "========================================="
echo ""
print_info "Next steps:"
echo "1. Deploy infrastructure with Terraform:"
echo "   cd ${TERRAFORM_DIR}"
echo "   terraform init"
echo "   terraform plan"
echo "   terraform apply"
echo ""
echo "2. Configure infrastructure with Ansible:"
echo "   cd ${ANSIBLE_DIR}"
echo "   ansible-playbook -i inventory/aws_ec2.yml playbooks/setup-infrastructure.yml"
echo ""
echo "3. Deploy microservices:"
echo "   ansible-playbook -i inventory/aws_ec2.yml playbooks/deploy-microservices.yml"
echo ""
echo "JAR files are located in: ${BUILD_DIR}"
echo "========================================="
