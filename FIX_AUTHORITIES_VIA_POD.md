# Fix Database Access via Kubernetes Pod

## Quick Solution

Since bastion → PostgreSQL connection is blocked, use the tribetalk pod instead:

### Check Users and Authorities
```bash
kubectl exec -it tribetalk-9559b4759-sxj8h -- bash -c "
apt-get update -qq && apt-get install -y -qq postgresql-client && 
PGPASSWORD=admin123 psql -h 10.0.10.95 -U admin -d tribetalk -c 
'SELECT u.id, u.username, a.authority FROM users u LEFT JOIN authorities a ON u.id = a.user_id;'
"
```

### Fix Missing Authorities
```bash
kubectl exec -it tribetalk-9559b4759-sxj8h -- bash -c "
apt-get update -qq && apt-get install -y -qq postgresql-client && 
PGPASSWORD=admin123 psql -h 10.0.10.95 -U admin -d tribetalk -c 
\"INSERT INTO authorities (authority, user_id) 
SELECT 'ROLE_USER', id FROM users 
WHERE id NOT IN (SELECT DISTINCT user_id FROM authorities);\"
"
```

### Verify Fix
```bash
kubectl exec -it tribetalk-9559b4759-sxj8h -- bash -c "
PGPASSWORD=admin123 psql -h 10.0.10.95 -U admin -d tribetalk -c 
'SELECT u.username, a.authority FROM users u LEFT JOIN authorities a ON u.id = a.user_id;'
"
```

## Why This Works
- Tribetalk pod is in same VPC as PostgreSQL
- Pod's security group allows PostgreSQL connection
- No bastion needed

## After Fixing
1. Try logging in as 'pawan'
2. Create a post
3. Should work now!
