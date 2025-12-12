# Accessing PostgreSQL Database

## Quick Access Methods

### Method 1: Via Bastion Host (Recommended)

**Step 1: SSH to Bastion**
```bash
ssh -i k8-SecurityKey.pem ubuntu@51.20.93.11
```

**Step 2: Get PostgreSQL Private IP**
```bash
# From Terraform outputs
cd /path/to/terraform
terraform output database_instance_private_ip
# Or use: 10.0.10.95 (from your setup)
```

**Step 3: SSH to PostgreSQL Server**
```bash
ssh ubuntu@10.0.10.95
```

**Step 4: Connect to PostgreSQL**
```bash
# Switch to postgres user
sudo -u postgres psql

# Or connect directly to tribetalk database
sudo -u postgres psql -d tribetalk
```

**Step 5: Run SQL Commands**
```sql
-- List all tables
\dt

-- View users table
SELECT * FROM users;

-- View authorities table
SELECT * FROM authorities;

-- Check users with authorities
SELECT u.id, u.username, u.email, a.authority 
FROM users u
LEFT JOIN authorities a ON u.id = a.user_id;

-- Add authority to existing user (if needed)
INSERT INTO authorities (authority, user_id)
VALUES ('ROLE_USER', 1);  -- Replace 1 with actual user ID

-- Exit psql
\q
```

---

### Method 2: SSH Tunnel from Local Machine

**Step 1: Create SSH Tunnel**
```bash
# Forward local port 5432 to PostgreSQL server
ssh -i k8-SecurityKey.pem -L 5432:10.0.10.95:5432 ubuntu@51.20.93.11 -N
```

**Step 2: Connect from Local Machine (New Terminal)**
```bash
# Install PostgreSQL client if needed
# macOS: brew install postgresql
# Ubuntu: sudo apt-get install postgresql-client

# Connect to database
psql -h localhost -p 5432 -U admin -d tribetalk
# Password: admin123
```

**Step 3: Run SQL Commands**
```sql
-- Same SQL commands as above
SELECT * FROM users;
SELECT * FROM authorities;
```

---

### Method 3: Using DBeaver or pgAdmin (GUI)

**Step 1: Create SSH Tunnel (keep running)**
```bash
ssh -i k8-SecurityKey.pem -L 5432:10.0.10.95:5432 ubuntu@51.20.93.11 -N
```

**Step 2: Configure DBeaver/pgAdmin**
- **Host:** localhost
- **Port:** 5432
- **Database:** tribetalk
- **Username:** admin
- **Password:** admin123

---

### Method 4: Quick One-Liner Commands

**View all users:**
```bash
ssh -i k8-SecurityKey.pem ubuntu@51.20.93.11 \
  "ssh ubuntu@10.0.10.95 'sudo -u postgres psql -d tribetalk -c \"SELECT * FROM users;\"'"
```

**View authorities:**
```bash
ssh -i k8-SecurityKey.pem ubuntu@51.20.93.11 \
  "ssh ubuntu@10.0.10.95 'sudo -u postgres psql -d tribetalk -c \"SELECT * FROM authorities;\"'"
```

**Check users with authorities:**
```bash
ssh -i k8-SecurityKey.pem ubuntu@51.20.93.11 \
  "ssh ubuntu@10.0.10.95 'sudo -u postgres psql -d tribetalk -c \"SELECT u.id, u.username, a.authority FROM users u LEFT JOIN authorities a ON u.id = a.user_id;\"'"
```

---

## Fix Existing Users Without Authorities

**Add ROLE_USER to all users missing authorities:**

```bash
ssh -i k8-SecurityKey.pem ubuntu@51.20.93.11 \
  "ssh ubuntu@10.0.10.95 'sudo -u postgres psql -d tribetalk -c \"INSERT INTO authorities (authority, user_id) SELECT '\'ROLE_USER\'', id FROM users WHERE id NOT IN (SELECT DISTINCT user_id FROM authorities);\"'"
```

**Verify the fix:**
```bash
ssh -i k8-SecurityKey.pem ubuntu@51.20.93.11 \
  "ssh ubuntu@10.0.10.95 'sudo -u postgres psql -d tribetalk -c \"SELECT u.username, a.authority FROM users u LEFT JOIN authorities a ON u.id = a.user_id;\"'"
```

---

## Database Connection Details

From your Terraform/Ansible setup:

- **Host:** 10.0.10.95 (private IP)
- **Port:** 5432
- **Database:** tribetalk
- **Username:** admin
- **Password:** admin123
- **Access:** Via Bastion host (51.20.93.11)

---

## Common SQL Queries

### Check User 'pawan'
```sql
SELECT u.*, a.authority 
FROM users u 
LEFT JOIN authorities a ON u.id = a.user_id 
WHERE u.username = 'pawan';
```

### Add Authority to 'pawan'
```sql
-- First, get the user ID
SELECT id FROM users WHERE username = 'pawan';

-- Then insert authority (replace 1 with actual ID)
INSERT INTO authorities (authority, user_id) 
VALUES ('ROLE_USER', 1);
```

### View All Tables
```sql
\dt
```

### Describe Table Structure
```sql
\d users
\d authorities
```

### Count Users and Authorities
```sql
SELECT 
  (SELECT COUNT(*) FROM users) as total_users,
  (SELECT COUNT(*) FROM authorities) as total_authorities;
```

---

## Quick Fix Script

Save this as `fix-authorities.sh`:

```bash
#!/bin/bash
# Fix authorities for existing users

echo "Connecting to database..."

ssh -i k8-SecurityKey.pem ubuntu@51.20.93.11 << 'ENDSSH'
  ssh ubuntu@10.0.10.95 << 'ENDDB'
    echo "=== Current Users and Authorities ==="
    sudo -u postgres psql -d tribetalk -c "
      SELECT u.id, u.username, u.email, a.authority 
      FROM users u 
      LEFT JOIN authorities a ON u.id = a.user_id;
    "
    
    echo ""
    echo "=== Adding ROLE_USER to users without authorities ==="
    sudo -u postgres psql -d tribetalk -c "
      INSERT INTO authorities (authority, user_id)
      SELECT 'ROLE_USER', id FROM users 
      WHERE id NOT IN (SELECT DISTINCT user_id FROM authorities);
    "
    
    echo ""
    echo "=== Updated Users and Authorities ==="
    sudo -u postgres psql -d tribetalk -c "
      SELECT u.id, u.username, u.email, a.authority 
      FROM users u 
      LEFT JOIN authorities a ON u.id = a.user_id;
    "
ENDDB
ENDSSH

echo "Done!"
```

**Run it:**
```bash
chmod +x fix-authorities.sh
./fix-authorities.sh
```

---

## Troubleshooting

### Can't SSH to Bastion
```bash
# Check bastion is running
aws ec2 describe-instances --instance-ids i-0eaf44cbfae2b6b85 --region eu-north-1

# Check security group allows your IP
aws ec2 describe-security-groups --group-ids <bastion-sg-id> --region eu-north-1
```

### Can't Connect to PostgreSQL
```bash
# Check PostgreSQL is running
ssh -i k8-SecurityKey.pem ubuntu@51.20.93.11
ssh ubuntu@10.0.10.95
sudo systemctl status postgresql
```

### Wrong Password
Default password is `admin123`. If changed, check:
```bash
# In Ansible playbook or Terraform outputs
cat ansible/playbooks/setup-infrastructure.yml | grep postgres_password
```

---

**Recommended:** Use Method 1 (via Bastion) for quick access, or Method 2 (SSH Tunnel) for GUI tools.
