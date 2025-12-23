#!/bin/bash
# Run this script from the bastion host to install MongoDB on the new instance

MONGODB_IP="10.0.10.124"

echo "Installing MongoDB on $MONGODB_IP..."

ssh -i ~/.ssh/k8-SecurityKey.pem ubuntu@$MONGODB_IP 'bash -s' << 'ENDSSH'
#!/bin/bash
set -e

echo "=== Installing MongoDB 7.0 ==="

# Install dependencies
sudo apt-get update
sudo apt-get install -y gnupg curl python3-pip

# Install pymongo
sudo pip3 install pymongo

# Add MongoDB GPG key
curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | sudo gpg --dearmor -o /usr/share/keyrings/mongodb-server-7.0.gpg

# Add MongoDB repository
echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list

# Install MongoDB
sudo apt-get update
sudo apt-get install -y mongodb-org

# Configure MongoDB to listen on all interfaces
sudo sed -i 's/bindIp: 127.0.0.1/bindIp: 0.0.0.0/' /etc/mongod.conf

# Start MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod

# Wait for MongoDB to start
sleep 10

# Create admin user
mongosh admin --eval '
db.createUser({
  user: "admin",
  pwd: "admin123",
  roles: [
    { role: "userAdminAnyDatabase", db: "admin" },
    { role: "readWriteAnyDatabase", db: "admin" },
    { role: "dbAdminAnyDatabase", db: "admin" }
  ]
})
'

# Enable authentication
echo "security:" | sudo tee -a /etc/mongod.conf
echo "  authorization: enabled" | sudo tee -a /etc/mongod.conf

# Restart MongoDB
sudo systemctl restart mongod

echo "=== MongoDB installation complete ==="
sudo systemctl status mongod
ENDSSH

echo "MongoDB installation finished!"
