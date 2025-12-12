# Quick Database Access - Alternative Method

Since the SSH key isn't available for the database server, use this simpler method:

## Method 1: PostgreSQL from Bastion (No SSH to DB needed)

The bastion has PostgreSQL client tools installed. You can connect directly:

```bash
# SSH to bastion
ssh -i /path/to/k8-SecurityKey.pem ubuntu@51.20.93.11

# Connect to PostgreSQL directly from bastion
PGPASSWORD=admin123 psql -h 10.0.10.95 -U admin -d tribetalk

# Now run SQL commands
SELECT u.id, u.username, a.authority FROM users u LEFT JOIN authorities a ON u.id = a.user_id;

# Fix missing authorities
INSERT INTO authorities (authority, user_id) 
SELECT 'ROLE_USER', id FROM users 
WHERE id NOT IN (SELECT DISTINCT user_id FROM authorities);

# Verify
SELECT u.username, a.authority FROM users u LEFT JOIN authorities a ON u.id = a.user_id;

# Exit
\q
```

## Method 2: One-Liner (from your machine)

```bash
ssh -i /path/to/k8-SecurityKey.pem ubuntu@51.20.93.11 \
  "PGPASSWORD=admin123 psql -h 10.0.10.95 -U admin -d tribetalk -c 'SELECT u.id, u.username, a.authority FROM users u LEFT JOIN authorities a ON u.id = a.user_id;'"
```

## Method 3: Fix Authorities One-Liner

```bash
ssh -i /path/to/k8-SecurityKey.pem ubuntu@51.20.93.11 \
  "PGPASSWORD=admin123 psql -h 10.0.10.95 -U admin -d tribetalk -c \"INSERT INTO authorities (authority, user_id) SELECT 'ROLE_USER', id FROM users WHERE id NOT IN (SELECT DISTINCT user_id FROM authorities);\""
```

## Find Your SSH Key

Your SSH key might be in one of these locations:

```bash
# Check common locations
ls ~/.ssh/*.pem
ls ~/Downloads/*.pem
ls ~/Documents/*.pem

# Or search for it
find ~ -name "*SecurityKey*.pem" 2>/dev/null
find ~ -name "k8-*.pem" 2>/dev/null
```

## Database Connection Details

- **Host:** 10.0.10.95
- **Port:** 5432
- **Database:** tribetalk
- **Username:** admin
- **Password:** admin123
- **Access via:** Bastion (51.20.93.11)

---

**Recommended:** Use Method 1 (interactive session) or Method 2 (one-liner) - both work without needing SSH to the database server!
