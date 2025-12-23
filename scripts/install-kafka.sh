#!/bin/bash
# Install Kafka on the Kafka instance

KAFKA_IP="10.0.10.205"

echo "Installing Kafka on $KAFKA_IP..."

ssh -i ~/.ssh/k8-SecurityKey.pem ubuntu@$KAFKA_IP 'bash -s' << 'ENDSSH'
#!/bin/bash
set -e

echo "=== Installing Kafka 3.6.1 (KRaft mode) ==="

# Install Java
sudo apt-get update
sudo apt-get install -y openjdk-17-jdk-headless

# Create Kafka user
sudo useradd -r -s /bin/false kafka || true

# Create directories
sudo mkdir -p /opt/kafka /var/lib/kafka /var/log/kafka
sudo chown -R kafka:kafka /opt/kafka /var/lib/kafka /var/log/kafka

# Download and extract Kafka
cd /tmp
wget -q https://archive.apache.org/dist/kafka/3.6.1/kafka_2.13-3.6.1.tgz
sudo tar -xzf kafka_2.13-3.6.1.tgz -C /opt/kafka --strip-components=1
sudo chown -R kafka:kafka /opt/kafka

# Generate cluster UUID
CLUSTER_UUID=$(/opt/kafka/bin/kafka-storage.sh random-uuid)
echo "Cluster UUID: $CLUSTER_UUID"

# Get private IP
PRIVATE_IP=$(hostname -I | awk '{print $1}')

# Create server.properties
sudo tee /opt/kafka/config/kraft/server.properties > /dev/null << EOF
# KRaft Controller and Broker Configuration
process.roles=broker,controller
node.id=1
controller.quorum.voters=1@${PRIVATE_IP}:9093

# Socket Server Settings
listeners=PLAINTEXT://:9092,CONTROLLER://:9093
advertised.listeners=PLAINTEXT://${PRIVATE_IP}:9092
listener.security.protocol.map=CONTROLLER:PLAINTEXT,PLAINTEXT:PLAINTEXT
controller.listener.names=CONTROLLER
inter.broker.listener.name=PLAINTEXT

# Log Basics
log.dirs=/var/lib/kafka
num.network.threads=3
num.io.threads=8

# Log Retention
log.retention.hours=168
log.segment.bytes=1073741824
log.retention.check.interval.ms=300000

# Replication
offsets.topic.replication.factor=1
transaction.state.log.replication.factor=1
transaction.state.log.min.isr=1
default.replication.factor=1
min.insync.replicas=1

# Group Coordinator Settings
group.initial.rebalance.delay.ms=0
EOF

sudo chown kafka:kafka /opt/kafka/config/kraft/server.properties

# Format storage
sudo -u kafka /opt/kafka/bin/kafka-storage.sh format -t $CLUSTER_UUID -c /opt/kafka/config/kraft/server.properties

# Create systemd service
sudo tee /etc/systemd/system/kafka.service > /dev/null << 'EOF'
[Unit]
Description=Apache Kafka Server (KRaft)
Documentation=http://kafka.apache.org/documentation.html
Requires=network.target
After=network.target

[Service]
Type=simple
User=kafka
Group=kafka
Environment="JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64"
Environment="KAFKA_HEAP_OPTS=-Xmx512M -Xms512M"
ExecStart=/opt/kafka/bin/kafka-server-start.sh /opt/kafka/config/kraft/server.properties
ExecStop=/opt/kafka/bin/kafka-server-stop.sh
Restart=on-failure
RestartSec=10
StandardOutput=journal
StandardError=journal
SyslogIdentifier=kafka

[Install]
WantedBy=multi-user.target
EOF

# Start Kafka
sudo systemctl daemon-reload
sudo systemctl start kafka
sudo systemctl enable kafka

# Wait for Kafka to start
sleep 15

echo "=== Kafka installation complete ==="
sudo systemctl status kafka --no-pager
ENDSSH

echo "Kafka installation finished!"
