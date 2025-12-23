#!/bin/bash
# Run this script from the bastion host to install PostgreSQL on the new instance

POSTGRESQL_IP="10.0.10.59"

echo "Installing PostgreSQL on $POSTGRESQL_IP..."

ssh -i ~/.ssh/k8-SecurityKey.pem ubuntu@$POSTGRESQL_IP 'bash -s' << 'ENDSSH'
#!/bin/bash
set -e

echo "=== Installing PostgreSQL 15 ==="

# Install prerequisites
sudo apt-get update
sudo apt-get install -y wget gnupg2

# Add PostgreSQL APT repository
sudo sh -c 'echo "deb http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list'
wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | sudo apt-key add -

# Update package list
sudo apt-get update

# Install PostgreSQL
sudo apt-get install -y postgresql-15 postgresql-contrib-15 python3-psycopg2

# Start PostgreSQL
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Wait for PostgreSQL to start
sleep 5

# Configure PostgreSQL to listen on all interfaces
sudo sed -i "s/#listen_addresses = 'localhost'/listen_addresses = '*'/" /etc/postgresql/15/main/postgresql.conf

# Configure authentication
echo "host    all             all             10.0.0.0/16            md5" | sudo tee -a /etc/postgresql/15/main/pg_hba.conf

# Create user and database
sudo -u postgres psql << 'EOF'
CREATE USER admin WITH PASSWORD 'admin123' CREATEDB SUPERUSER;
CREATE DATABASE tribetalkdb OWNER admin;
\q
EOF

# Restart PostgreSQL
sudo systemctl restart postgresql

echo "=== PostgreSQL installation complete ==="
sudo systemctl status postgresql --no-pager
ENDSSH

echo "PostgreSQL installation finished!"
