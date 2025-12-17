# Quick Git Workflow - Team Pushing to Dev Branch

## 🎯 Scenario
- **Team**: Pushes changes directly to `dev` branch
- **You**: Have critical deployment fixes that MUST be preserved

---

## ✅ Immediate Action Plan

### Step 1: Save Your Critical Changes (Now!)

```bash
cd "/Users/rahissmac/Documents/dump files/ITCJavaBatch2_Antigravity/ITC_Java_Batch2"

# Create a backup branch with your deployment fixes
git checkout -b deployment-fixes-backup

# Commit all your changes
git add .
git commit -m "fix: Critical deployment fixes - DO NOT LOSE

Critical fixes for production deployment:
- UserController: null check to prevent 500 errors
- SecurityConfig: removed permitAll for posts/follow/test
- Frontend: fixed hardcoded localhost URLs
- Notification service: added context-path
- K8s: added GitHub OAuth env vars
- Documentation: deployment guides"

# Push to remote (IMPORTANT - creates backup!)
git push origin deployment-fixes-backup
```

✅ **Your changes are now backed up!**

---

### Step 2: Merge Your Fixes Into Dev Branch

```bash
# Switch to dev branch
git checkout dev

# If dev doesn't exist locally, create it
git checkout -b dev

# Pull latest changes from remote dev (if it exists)
git pull origin dev

# Merge your deployment fixes into dev
git merge deployment-fixes-backup

# If no conflicts, push
git push origin dev

# If conflicts occur, see "Conflict Resolution" section below
```

---

## 🔄 Ongoing Workflow

### When Team Pushes to Dev

```bash
# 1. Pull their changes
git checkout dev
git pull origin dev

# 2. Check what changed
git log --oneline -10
git diff HEAD~5 HEAD  # See last 5 commits

# 3. Verify your critical files weren't modified
git diff HEAD~5 HEAD tribetalk/src/main/java/com/learning/tribetalk/controller/UserController.java
git diff HEAD~5 HEAD tribetalk/src/main/java/com/learning/tribetalk/config/SecurityConfig.java
git diff HEAD~5 HEAD tribe-talk-frontend/src/services/notificationService.js
git diff HEAD~5 HEAD notification-service/src/main/resources/application.yaml

# 4. If your critical changes were overwritten, restore them
git checkout deployment-fixes-backup -- tribetalk/src/main/java/com/learning/tribetalk/controller/UserController.java
git commit -m "fix: Restore critical null check in UserController"
git push origin dev
```

---

## 🛡️ Protect Your Critical Files

### Create a Pre-Merge Check Script

```bash
# Create a script to check if critical files were modified
cat > check-critical-files.sh << 'EOF'
#!/bin/bash

echo "Checking critical deployment files..."

CRITICAL_FILES=(
  "tribetalk/src/main/java/com/learning/tribetalk/controller/UserController.java"
  "tribetalk/src/main/java/com/learning/tribetalk/config/SecurityConfig.java"
  "tribe-talk-frontend/src/services/notificationService.js"
  "tribe-talk-frontend/src/services/useWebSocket.js"
  "tribe-talk-frontend/src/pages/Home.jsx"
  "notification-service/src/main/resources/application.yaml"
  "k8s/deployments/tribetalk.yaml"
  "k8s/deployments/notification-service.yaml"
)

MODIFIED=0

for file in "${CRITICAL_FILES[@]}"; do
  if git diff HEAD~1 HEAD --name-only | grep -q "$file"; then
    echo "⚠️  WARNING: Critical file modified: $file"
    MODIFIED=1
  fi
done

if [ $MODIFIED -eq 1 ]; then
  echo ""
  echo "❌ Critical files were modified!"
  echo "Review changes and restore if necessary:"
  echo "  git checkout deployment-fixes-backup -- <file>"
  exit 1
else
  echo "✅ No critical files modified"
  exit 0
fi
EOF

chmod +x check-critical-files.sh

# Run after pulling from dev
git pull origin dev && ./check-critical-files.sh
```

---

## 🚨 If Team Overwrites Your Changes

### Quick Recovery

```bash
# 1. Check what was overwritten
git diff deployment-fixes-backup dev

# 2. Restore specific files from your backup
git checkout deployment-fixes-backup -- tribetalk/src/main/java/com/learning/tribetalk/controller/UserController.java
git checkout deployment-fixes-backup -- tribetalk/src/main/java/com/learning/tribetalk/config/SecurityConfig.java
git checkout deployment-fixes-backup -- tribe-talk-frontend/src/services/notificationService.js
git checkout deployment-fixes-backup -- tribe-talk-frontend/src/services/useWebSocket.js
git checkout deployment-fixes-backup -- notification-service/src/main/resources/application.yaml

# 3. Commit the restoration
git add .
git commit -m "fix: Restore critical deployment fixes"

# 4. Push to dev
git push origin dev
```

---

## 📋 Critical Files Checklist

After each `git pull origin dev`, verify these files:

### Backend (tribetalk/)

**UserController.java** - Line 28-34:
```java
@GetMapping("/loggedUser")
public ResponseEntity<UserResponse> getUserByUsername(@AuthenticationPrincipal User user) {
    if (user == null) {  // ← THIS MUST BE HERE
        return ResponseEntity.status(401).build();
    }
    return userService.findByUsername(user.getUsername())...
```

**SecurityConfig.java** - Lines 50-55:
```java
.authorizeHttpRequests(auth -> auth
    .requestMatchers("/api/auth/**").permitAll()
    .requestMatchers("/api/users/**").permitAll()
    // NO .requestMatchers("/api/test/**").permitAll()
    // NO .requestMatchers("/api/follow/**").permitAll()
    // NO .requestMatchers("/api/v1/posts/**").permitAll()
    .requestMatchers("/h2-console/**").permitAll()
```

### Frontend (tribe-talk-frontend/)

**notificationService.js** - Line 4:
```javascript
const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'}/notification/api/notifications`;
// NOT: 'http://localhost:8082/api/notifications'
```

**useWebSocket.js** - Line 8:
```javascript
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";
// NOT: "http://localhost:8082"
```

**Home.jsx** - Line 47:
```javascript
window.location.replace(authUrl);  // ← Must be .replace()
// NOT: window.location.href = authUrl;
```

### Notification Service

**application.yaml** - Lines 22-24:
```yaml
server:
  port: 8082
  servlet:
    context-path: /notification  # ← THIS MUST BE HERE
```

### Kubernetes (k8s/)

**deployments/tribetalk.yaml** - Lines 85-95:
```yaml
- name: GITHUB_CLIENT_ID
  valueFrom:
    secretKeyRef:
      name: tribetalk-app-secrets
      key: github_client_id
- name: GITHUB_CLIENT_SECRET
  valueFrom:
    secretKeyRef:
      name: tribetalk-app-secrets
      key: github_client_secret
```

**deployments/notification-service.yaml** - Lines 57, 64:
```yaml
livenessProbe:
  httpGet:
    path: /notification/actuator/health  # ← Must have /notification prefix
readinessProbe:
  httpGet:
    path: /notification/actuator/health  # ← Must have /notification prefix
```

---

## 📧 Message to Team

```
Hi Team,

I've pushed critical deployment fixes to the 'dev' branch. These fixes are REQUIRED for production deployment.

IMPORTANT: Before pushing to dev, please:
1. Pull latest changes: git pull origin dev
2. Do NOT modify these files:
   - UserController.java (has critical null check)
   - SecurityConfig.java (security settings)
   - notificationService.js (API URL config)
   - useWebSocket.js (API URL config)
   - application.yaml in notification-service (context-path)
   - k8s deployment files

3. If you need to modify any of these files, please coordinate with me first.

See DEPLOYMENT_CRITICAL_CHANGES.md for full list and details.

My backup branch: deployment-fixes-backup (in case we need to restore)

Thanks!
```

---

## 🔄 Daily Routine

### Every Morning / Before Starting Work

```bash
# 1. Pull latest from dev
git checkout dev
git pull origin dev

# 2. Check for modifications to critical files
./check-critical-files.sh

# 3. If critical files were modified, review and restore if needed
git diff deployment-fixes-backup dev

# 4. If restoration needed:
git checkout deployment-fixes-backup -- <file>
git commit -m "fix: Restore critical deployment configuration"
git push origin dev
```

---

## 🧪 Before Deploying to Production

```bash
# 1. Make sure you're on dev
git checkout dev
git pull origin dev

# 2. Verify all critical changes are present
./check-critical-files.sh

# 3. Run tests
cd tribetalk && mvn test
cd ../tribe-talk-frontend && npm test
cd ../notification-service && mvn test

# 4. Build all services
cd tribetalk && mvn clean package -DskipTests
cd ../ChatService && mvn clean package -DskipTests
cd ../notification-service && mvn clean package -DskipTests
cd ../tribe-talk-frontend && npm run build

# 5. If all tests pass, merge to main
git checkout main
git merge dev
git push origin main

# 6. Deploy using DEPLOYMENT_CHECKLIST.md
```

---

## 🎯 Quick Command Reference

```bash
# Save your changes
git checkout -b deployment-fixes-backup
git add .
git commit -m "fix: Critical deployment fixes"
git push origin deployment-fixes-backup

# Merge into dev
git checkout dev
git merge deployment-fixes-backup
git push origin dev

# Pull team changes
git pull origin dev

# Check critical files
./check-critical-files.sh

# Restore if needed
git checkout deployment-fixes-backup -- <file>
git commit -m "fix: Restore critical changes"
git push origin dev

# Deploy to production
git checkout main
git merge dev
git push origin main
```

---

## ✅ Summary

1. **Your backup**: `deployment-fixes-backup` branch (never delete this!)
2. **Team works on**: `dev` branch (direct pushes)
3. **You monitor**: Pull from dev daily, check critical files
4. **If overwritten**: Restore from `deployment-fixes-backup`
5. **Production**: Merge `dev` → `main` when ready

**Key Point**: Keep `deployment-fixes-backup` as your source of truth. If anything goes wrong in `dev`, you can always restore from this branch.
