# Bastion Host Guide - Why We Need It

Complete explanation of the Bastion host, its purpose, and how to use it.

---

## 🛡️ What is a Bastion Host?

A **Bastion host** (also called a **jump server** or **jump box**) is a special-purpose server designed to be the **only entry point** to access servers in a private network.

**Your Bastion Details:**
- **Name:** tribetalk-bastion
- **Instance ID:** i-0eaf44cbfae2b6b85
- **Type:** t3.micro
- **Public IP:** 51.20.93.11
- **Cost:** ~$7/month
- **Location:** Public subnet (eu-north-1a)

---

## 🎯 Why We Need a Bastion Host

### **The Security Problem**

Your database instances are in **private subnets** with **NO public IP addresses**:

```
Internet
    ↓
    ❌ BLOCKED - No direct access to databases
    ↓
┌─────────────────────────────────────┐
│  Private Subnet (10.0.x.x)          │
│  ┌──────────────┐  ┌──────────────┐ │
│  │ PostgreSQL   │  │  MongoDB     │ │
│  │ No Public IP │  │ No Public IP │ │
│  └──────────────┘  └──────────────┘ │
│  ┌──────────────┐  ┌──────────────┐ │
│  │   Redis      │  │   Kafka      │ │
│  │ No Public IP │  │ No Public IP │ │
│  └──────────────┘  └──────────────┘ │
└─────────────────────────────────────┘
```

**Without a Bastion host, you CANNOT:**
- ❌ SSH into database servers
- ❌ Run database backups manually
- ❌ Troubleshoot database issues
- ❌ Run Ansible playbooks
- ❌ Access databases directly for debugging

---

## 🚪 How Bastion Host Works

The Bastion acts as a **secure gateway**:

```
Internet
    ↓
    ✅ SSH to Bastion (Public IP: 51.20.93.11)
    ↓
┌─────────────────────────────────────┐
│  Public Subnet                      │
│  ┌──────────────────────────────┐   │
│  │  Bastion Host                │   │
│  │  Public IP: 51.20.93.11      │   │
│  │  (Only SSH port 22 open)     │   │
│  └──────────────────────────────┘   │
└─────────────────────────────────────┘
              ↓
    ✅ SSH from Bastion to Private Instances
              ↓
┌─────────────────────────────────────┐
│  Private Subnet                     │
│  ┌──────────────┐  ┌──────────────┐ │
│  │ PostgreSQL   │  │  MongoDB     │ │
│  │ 10.0.10.x    │  │ 10.0.10.x    │ │
│  └──────────────┘  └──────────────┘ │
└─────────────────────────────────────┘
```

---

## 🔑 How to Use the Bastion Host

### 1. **Direct SSH to Bastion**

```bash
# Connect to Bastion
ssh -i k8-SecurityKey.pem ubuntu@51.20.93.11

# You're now on the Bastion host
# From here, you can SSH to any private instance
ssh ubuntu@10.0.10.95  # PostgreSQL private IP
```

### 2. **SSH Jump (One Command)**

```bash
# SSH directly to private instance via Bastion
ssh -i k8-SecurityKey.pem -J ubuntu@51.20.93.11 ubuntu@10.0.10.95

# -J flag means "jump through this host first"
```

### 3. **SSH Tunnel for Database Access**

Access databases from your local machine:

```bash
# PostgreSQL tunnel
ssh -i k8-SecurityKey.pem -L 5432:10.0.10.95:5432 ubuntu@51.20.93.11

# Now connect to localhost:5432 from another terminal
psql -h localhost -U admin -d tribetalk

# MongoDB tunnel
ssh -i k8-SecurityKey.pem -L 27017:10.0.10.95:27017 ubuntu@51.20.93.11

# Connect to localhost:27017
mongosh mongodb://admin:admin123@localhost:27017/tribetalknosqldb?authSource=admin

# Redis tunnel
ssh -i k8-SecurityKey.pem -L 6379:10.0.10.95:6379 ubuntu@51.20.93.11

# Connect to localhost:6379
redis-cli -h localhost
```

### 4. **Run Ansible Playbooks**

Ansible uses Bastion as jump host:

```bash
# Your inventory file should have:
[database_servers]
db-server ansible_host=10.0.10.95 ansible_user=ubuntu ansible_ssh_common_args='-o ProxyJump=ubuntu@51.20.93.11'

# Then run playbooks normally
ansible-playbook -i inventory/hosts playbooks/setup-infrastructure.yml
```

### 5. **File Transfer via Bastion**

```bash
# Copy file from local to private instance via Bastion
scp -i k8-SecurityKey.pem -o ProxyJump=ubuntu@51.20.93.11 \
  local-file.sql ubuntu@10.0.10.95:/home/ubuntu/

# Copy file from private instance to local via Bastion
scp -i k8-SecurityKey.pem -o ProxyJump=ubuntu@51.20.93.11 \
  ubuntu@10.0.10.95:/home/ubuntu/backup.sql ./
```

---

## 🔒 Security Benefits

### **Why Not Give Databases Public IPs?**

If databases had public IPs:
- ❌ **Exposed to internet attacks** - Hackers can try to brute force passwords
- ❌ **Larger attack surface** - More ports exposed to the internet
- ❌ **Compliance issues** - Many regulations require databases in private networks
- ❌ **Accidental exposure** - One misconfigured security group = data breach
- ❌ **DDoS vulnerability** - Databases can be targeted directly

### **With Bastion Host:**
- ✅ **Single point of entry** - Only one public IP to secure
- ✅ **Audit trail** - All access goes through Bastion (can log everything)
- ✅ **Reduced attack surface** - Databases completely isolated from internet
- ✅ **Compliance friendly** - Meets PCI-DSS, HIPAA, SOC 2 requirements
- ✅ **Easy to secure** - Only SSH port 22 open on Bastion
- ✅ **MFA capable** - Can add multi-factor authentication
- ✅ **Session recording** - Can record all SSH sessions for audit

---

## 🛠️ Pre-installed Tools on Bastion

Your Bastion comes with database client tools:

```bash
# PostgreSQL client
psql --version

# MongoDB client
mongosh --version

# Redis client
redis-cli --version
```

**Why?** So you can connect to databases directly from Bastion without tunneling.

---

## 📊 Common Use Cases

### Use Case 1: Database Troubleshooting

```bash
# SSH to Bastion
ssh -i k8-SecurityKey.pem ubuntu@51.20.93.11

# SSH to PostgreSQL server
ssh ubuntu@10.0.10.95

# Check PostgreSQL status
sudo systemctl status postgresql

# View logs
sudo tail -f /var/log/postgresql/postgresql-15-main.log

# Check disk space
df -h
```

### Use Case 2: Manual Database Backup

```bash
# SSH to Bastion
ssh -i k8-SecurityKey.pem ubuntu@51.20.93.11

# SSH to database server
ssh ubuntu@10.0.10.95

# Create backup
sudo -u postgres pg_dump tribetalk > /tmp/backup_$(date +%Y%m%d).sql

# Exit to Bastion
exit

# Copy backup to Bastion
scp ubuntu@10.0.10.95:/tmp/backup_*.sql ~/backups/

# Exit Bastion
exit

# Download backup to local machine
scp -i k8-SecurityKey.pem ubuntu@51.20.93.11:~/backups/backup_*.sql ./
```

### Use Case 3: Database Query from Local Machine

```bash
# Create tunnel
ssh -i k8-SecurityKey.pem -L 5432:10.0.10.95:5432 ubuntu@51.20.93.11 -N

# In another terminal, connect to database
psql -h localhost -U admin -d tribetalk

# Run queries
SELECT COUNT(*) FROM users;
```

### Use Case 4: Deploy Configuration Changes

```bash
# SSH to Bastion
ssh -i k8-SecurityKey.pem ubuntu@51.20.93.11

# SSH to Kafka server
ssh ubuntu@10.0.10.95

# Edit Kafka configuration
sudo nano /etc/kafka/server.properties

# Restart Kafka
sudo systemctl restart kafka
```

---

## 💰 Cost Analysis

### **Bastion Cost:** ~$7/month (t3.micro)

### **What You Get:**
- ✅ Secure access to $112/month of database infrastructure
- ✅ Ability to run Ansible playbooks
- ✅ Database troubleshooting capability
- ✅ Manual backup capability
- ✅ Compliance with security best practices
- ✅ Audit trail for all access

**ROI:** $7/month to secure and manage $112/month of infrastructure = **Worth it!**

---

## 🔄 Alternatives to Bastion Host

### Option 1: AWS Systems Manager Session Manager

**Pros:**
- ✅ No Bastion instance needed (save $7/month)
- ✅ No SSH keys to manage
- ✅ Better audit logging (CloudTrail integration)
- ✅ Access through AWS Console or CLI
- ✅ No public IPs needed at all

**Cons:**
- ❌ Requires IAM configuration for each user
- ❌ More complex initial setup
- ❌ Harder to use with Ansible
- ❌ Requires SSM agent on all instances
- ❌ Additional IAM permissions needed

**Setup:**
```bash
# Install SSM agent on instances (via Terraform user_data)
# Then connect without Bastion:
aws ssm start-session --target i-0ae740d492ea16aec --region eu-north-1
```

### Option 2: VPN Connection

**Pros:**
- ✅ Direct access to private network
- ✅ No jump host needed
- ✅ Better for teams

**Cons:**
- ❌ More expensive (~$36/month for AWS Client VPN)
- ❌ Complex setup
- ❌ Requires VPN client on all machines
- ❌ Slower connection

### Option 3: AWS Direct Connect

**Pros:**
- ✅ Dedicated network connection
- ✅ Better performance
- ✅ More secure

**Cons:**
- ❌ Very expensive ($300+/month)
- ❌ Only for enterprise use cases
- ❌ Complex setup

---

## 🎯 Should You Keep the Bastion?

### **Keep the Bastion if:**
- ✅ You need to SSH to database servers for troubleshooting
- ✅ You run Ansible playbooks regularly
- ✅ You need to do manual database backups
- ✅ You want a simple, traditional security setup
- ✅ $7/month is acceptable cost
- ✅ Your team is familiar with SSH and jump hosts

### **Consider Alternatives if:**
- ✅ You migrate to AWS managed services (RDS, DocumentDB, ElastiCache)
- ✅ You want to eliminate SSH key management
- ✅ You need better audit logging
- ✅ You have budget for VPN or Direct Connect
- ✅ All operations are automated via Kubernetes

---

## 🔧 Bastion Security Best Practices

### 1. **Restrict SSH Access by IP**

```bash
# Update security group to only allow SSH from your office IP
aws ec2 authorize-security-group-ingress \
  --group-id sg-xxxxx \
  --protocol tcp \
  --port 22 \
  --cidr 203.0.113.0/24  # Your office IP range
```

### 2. **Enable SSH Key Rotation**

```bash
# Generate new key pair every 90 days
ssh-keygen -t rsa -b 4096 -f ~/.ssh/tribetalk-new-key

# Add new key to Bastion
ssh-copy-id -i ~/.ssh/tribetalk-new-key ubuntu@51.20.93.11

# Remove old key after testing
```

### 3. **Enable CloudWatch Logging**

```bash
# Install CloudWatch agent on Bastion
sudo /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl \
  -a fetch-config \
  -m ec2 \
  -s \
  -c file:/opt/aws/amazon-cloudwatch-agent/etc/config.json
```

### 4. **Enable SSH Session Recording**

```bash
# Install script to record all SSH sessions
sudo apt-get install -y script

# Add to /etc/profile
if [ -n "$SSH_CONNECTION" ]; then
  script -q -f /var/log/ssh-sessions/$(date +%Y%m%d-%H%M%S)-$USER.log
fi
```

### 5. **Disable Password Authentication**

```bash
# Edit SSH config on Bastion
sudo nano /etc/ssh/sshd_config

# Set:
PasswordAuthentication no
PubkeyAuthentication yes

# Restart SSH
sudo systemctl restart sshd
```

---

## 📋 Bastion Maintenance Checklist

### Monthly Tasks
- [ ] Review SSH access logs
- [ ] Update system packages (`sudo apt update && sudo apt upgrade`)
- [ ] Check disk space
- [ ] Review security group rules
- [ ] Rotate SSH keys (if policy requires)

### Quarterly Tasks
- [ ] Review IAM policies
- [ ] Audit user access
- [ ] Test disaster recovery (can you access without Bastion?)
- [ ] Review CloudWatch logs

---

## 🚨 Troubleshooting

### Issue 1: Cannot SSH to Bastion

```bash
# Check security group allows your IP
aws ec2 describe-security-groups --group-ids sg-xxxxx

# Check instance is running
aws ec2 describe-instances --instance-ids i-0eaf44cbfae2b6b85

# Check SSH key permissions
chmod 400 k8-SecurityKey.pem
```

### Issue 2: Cannot SSH from Bastion to Private Instances

```bash
# Check security group of private instance allows Bastion's security group
# Check private instance is running
# Check SSH key is on Bastion
```

### Issue 3: SSH Tunnel Not Working

```bash
# Check port forwarding is enabled
ssh -v -L 5432:10.0.10.95:5432 ubuntu@51.20.93.11

# Check database is listening on correct port
ssh ubuntu@51.20.93.11
ssh ubuntu@10.0.10.95
sudo netstat -tlnp | grep 5432
```

---

## 📚 Quick Reference

### Common Commands

```bash
# SSH to Bastion
ssh -i k8-SecurityKey.pem ubuntu@51.20.93.11

# SSH to private instance via Bastion (one command)
ssh -i k8-SecurityKey.pem -J ubuntu@51.20.93.11 ubuntu@10.0.10.95

# PostgreSQL tunnel
ssh -i k8-SecurityKey.pem -L 5432:10.0.10.95:5432 ubuntu@51.20.93.11 -N

# MongoDB tunnel
ssh -i k8-SecurityKey.pem -L 27017:10.0.10.95:27017 ubuntu@51.20.93.11 -N

# Redis tunnel
ssh -i k8-SecurityKey.pem -L 6379:10.0.10.95:6379 ubuntu@51.20.93.11 -N

# Copy file to private instance
scp -i k8-SecurityKey.pem -o ProxyJump=ubuntu@51.20.93.11 file.txt ubuntu@10.0.10.95:/tmp/

# Copy file from private instance
scp -i k8-SecurityKey.pem -o ProxyJump=ubuntu@51.20.93.11 ubuntu@10.0.10.95:/tmp/file.txt ./
```

---

## 🎯 Summary

**Bastion Host = Security Gateway**

- 🚪 **Purpose:** Secure access to private database instances
- 🔒 **Security:** Keeps databases off the internet
- 🛠️ **Management:** Run Ansible, backups, troubleshooting
- 💰 **Cost:** $7/month for secure access to $112/month infrastructure
- ✅ **Recommendation:** Keep it - essential for current architecture

**Bottom Line:** The Bastion host is a security best practice that provides secure, auditable access to your private infrastructure for only $7/month. It's worth keeping! 🛡️
