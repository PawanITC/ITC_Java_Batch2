#!/bin/bash
# Install Redis on the Redis instance

REDIS_IP="10.0.10.49"

echo "Installing Redis on $REDIS_IP..."

ssh -i ~/.ssh/k8-SecurityKey.pem ubuntu@$REDIS_IP 'bash -s' << 'ENDSSH'
#!/bin/bash
set -e

echo "=== Installing Redis ==="

# Update and install Redis
sudo apt-get update
sudo apt-get install -y redis-server

# Configure Redis to listen on all interfaces
sudo sed -i 's/^bind 127.0.0.1 ::1/bind 0.0.0.0/' /etc/redis/redis.conf

# Disable protected mode for development
sudo sed -i 's/^protected-mode yes/protected-mode no/' /etc/redis/redis.conf

# Set maxmemory policy
echo "maxmemory 256mb" | sudo tee -a /etc/redis/redis.conf
echo "maxmemory-policy allkeys-lru" | sudo tee -a /etc/redis/redis.conf

# Restart Redis
sudo systemctl restart redis-server
sudo systemctl enable redis-server

# Wait for Redis to start
sleep 3

echo "=== Redis installation complete ==="
sudo systemctl status redis-server --no-pager
ENDSSH

echo "Redis installation finished!"
