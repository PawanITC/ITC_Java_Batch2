#!/bin/bash
# Quick verification script to check all database services

echo "=== Checking Database Services ==="

echo -e "\n1. MongoDB (10.0.10.124):"
ssh -o StrictHostKeyChecking=no -i ~/.ssh/k8-SecurityKey.pem ubuntu@10.0.10.124 'sudo systemctl is-active mongod && echo "✓ MongoDB is running" || echo "✗ MongoDB is NOT running"'

echo -e "\n2. PostgreSQL (10.0.10.59):"
ssh -o StrictHostKeyChecking=no -i ~/.ssh/k8-SecurityKey.pem ubuntu@10.0.10.59 'sudo systemctl is-active postgresql && echo "✓ PostgreSQL is running" || echo "✗ PostgreSQL is NOT running"'

echo -e "\n3. Redis (10.0.10.49):"
ssh -o StrictHostKeyChecking=no -i ~/.ssh/k8-SecurityKey.pem ubuntu@10.0.10.49 'sudo systemctl is-active redis-server && echo "✓ Redis is running" || echo "✗ Redis is NOT running"'

echo -e "\n4. Kafka (10.0.10.205):"
ssh -o StrictHostKeyChecking=no -i ~/.ssh/k8-SecurityKey.pem ubuntu@10.0.10.205 'sudo systemctl is-active kafka && echo "✓ Kafka is running" || echo "✗ Kafka is NOT running"'

echo -e "\n=== Done ==="
