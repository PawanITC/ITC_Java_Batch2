# Git Workflow & Collaboration Strategy for TribeTalk

This guide explains how to manage code changes when multiple team members are working on different parts of the project simultaneously.

---

## 🎯 Current Situation

- **You (DevOps)**: Made critical deployment fixes in:
  - `tribetalk/` - Backend fixes (UserController null check, SecurityConfig)
  - `tribe-talk-frontend/` - Frontend fixes (notificationService, useWebSocket, Home.jsx)
  - `notification-service/` - Context path configuration
  - `ChatService/` - Potential fixes
  - Infrastructure files (terraform, ansible, k8s, scripts)

- **Team Members**: Working on features in:
  - `tribe-talk-frontend/` - UI improvements
  - `ChatService/` - Chat features
  - `tribetalk/` - Backend features
  - `notification-service/` - Notification features

---

## 🌳 Recommended Git Branching Strategy

### Branch Structure

```
main (production-ready)
  ├── develop (integration branch)
  │   ├── feature/ui-improvements (teammate)
  │   ├── feature/chat-enhancements (teammate)
  │   ├── feature/notification-updates (teammate)
  │   └── fix/deployment-critical (YOU - DevOps fixes)
  └── hotfix/* (emergency production fixes)
```

---

## 📋 Step-by-Step: Preserving Your Critical Changes

### Step 1: Create a Branch for Your Deployment Fixes

```bash
# Make sure you're in the project root
cd /Users/rahissmac/Documents/dump\ files/ITCJavaBatch2_Antigravity/ITC_Java_Batch2

# Check current status
git status

# Create and switch to a new branch for your deployment fixes
git checkout -b fix/deployment-critical

# Stage all your changes
git add .

# Commit with detailed message
git commit -m "fix: Critical deployment fixes for production

- Backend: Add null check in UserController.getLoggedUser() to prevent 500 errors
- Backend: Remove permitAll for posts/follow/test endpoints (security)
- Frontend: Fix hardcoded localhost:8082 in notificationService
- Frontend: Fix hardcoded localhost:8082 in useWebSocket
- Frontend: Change OAuth redirect to window.location.replace()
- Notification: Add servlet context-path /notification
- Notification: Update health check paths
- K8s: Add GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET env vars to tribetalk deployment
- K8s: Update notification-service health check paths
- Docs: Add REFRESH_TOKEN_IMPLEMENTATION_GUIDE.md
- Docs: Update README.md with complete infrastructure guide
- Docs: Add DEPLOYMENT_CHECKLIST.md
- Docs: Add DATA_PERSISTENCE_GUIDE.md"

# Push to remote
git push origin fix/deployment-critical
```

✅ **Your changes are now safely stored in a separate branch**

---

### Step 2: Document Your Critical Files

Create a file listing all your critical changes:

```bash
cat > DEPLOYMENT_CRITICAL_CHANGES.md << 'EOF'
# Critical Deployment Changes

## ⚠️ DO NOT MODIFY - Required for Production Deployment

### Backend (tribetalk/)
- `src/main/java/com/learning/tribetalk/controller/UserController.java`
  - Lines 28-34: Added null check for unauthenticated users
  
- `src/main/java/com/learning/tribetalk/config/SecurityConfig.java`
  - Lines 50-76: Removed permitAll for /api/test, /api/follow, /api/v1/posts
  - Security requirement: These endpoints MUST require authentication

### Frontend (tribe-talk-frontend/)
- `src/services/notificationService.js`
  - Line 4: Changed from hardcoded localhost:8082 to environment variable
  
- `src/services/useWebSocket.js`
  - Line 8: Changed default from localhost:8082 to localhost:8080
  
- `src/pages/Home.jsx`
  - Line 47: Changed window.location.href to window.location.replace()

### Notification Service (notification-service/)
- `src/main/resources/application.yaml`
  - Lines 22-24: Added servlet context-path: /notification

### Kubernetes (k8s/)
- `deployments/tribetalk.yaml`
  - Lines 85-95: Added GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET env vars
  
- `deployments/notification-service.yaml`
  - Lines 57, 64: Updated health check paths to /notification/actuator/health

### Infrastructure & Documentation
- `README.md` - Complete infrastructure guide
- `DEPLOYMENT_CHECKLIST.md` - Step-by-step deployment
- `DATA_PERSISTENCE_GUIDE.md` - Backup strategies
- `REFRESH_TOKEN_IMPLEMENTATION_GUIDE.md` - Future enhancement
- `alb-controller-policy.json` - IAM policy with SetRulePriorities

## Merge Instructions

When merging teammate changes:
1. Always merge their changes INTO this branch, not the other way around
2. In case of conflicts, preserve the changes listed above
3. Test deployment after merge before pushing to main
EOF

git add DEPLOYMENT_CRITICAL_CHANGES.md
git commit -m "docs: Add documentation of critical deployment changes"
git push origin fix/deployment-critical
```

---

## 🔄 Workflow for Merging Teammate Changes

### Option A: Merge Their Changes Into Your Branch (Recommended)

```bash
# 1. Make sure you're on your deployment branch
git checkout fix/deployment-critical

# 2. Fetch latest changes from remote
git fetch origin

# 3. Merge teammate's feature branch into yours
git merge origin/feature/ui-improvements

# If conflicts occur:
# - Open conflicted files
# - Keep YOUR changes for files listed in DEPLOYMENT_CRITICAL_CHANGES.md
# - Keep THEIR changes for new features
# - Resolve conflicts manually

# 4. Test the application
# Run tests, build, deploy to test environment

# 5. Commit the merge
git commit -m "merge: Integrate UI improvements with deployment fixes"

# 6. Push
git push origin fix/deployment-critical

# 7. Repeat for other teammates' branches
git merge origin/feature/chat-enhancements
git merge origin/feature/notification-updates
```

### Option B: Create a Develop Branch (Better for Ongoing Collaboration)

```bash
# 1. Create develop branch from your deployment fixes
git checkout fix/deployment-critical
git checkout -b develop
git push origin develop

# 2. Set develop as the default branch for integration
# (Do this on GitHub/GitLab settings)

# 3. Have teammates merge their changes into develop
# They should do:
git checkout feature/ui-improvements
git pull origin develop  # Get your fixes first
git push origin feature/ui-improvements

# Then create Pull Request: feature/ui-improvements -> develop

# 4. Review and merge their PRs into develop

# 5. When ready for production:
git checkout main
git merge develop
git push origin main
```

---

## 🛡️ Protecting Your Critical Changes

### Create .gitattributes for Merge Strategy

```bash
cat > .gitattributes << 'EOF'
# Critical deployment files - prefer ours in conflicts
tribetalk/src/main/java/com/learning/tribetalk/controller/UserController.java merge=ours
tribetalk/src/main/java/com/learning/tribetalk/config/SecurityConfig.java merge=ours
notification-service/src/main/resources/application.yaml merge=ours
k8s/deployments/tribetalk.yaml merge=ours
k8s/deployments/notification-service.yaml merge=ours
EOF

git add .gitattributes
git commit -m "chore: Add merge strategy for critical deployment files"
```

---

## 📝 Communication with Team

### Send This Message to Your Team:

```
Hi Team,

I've made critical deployment fixes that are required for production. 
These fixes are in the branch: fix/deployment-critical

IMPORTANT FILES (DO NOT MODIFY):
- tribetalk/src/main/java/com/learning/tribetalk/controller/UserController.java
- tribetalk/src/main/java/com/learning/tribetalk/config/SecurityConfig.java
- tribe-talk-frontend/src/services/notificationService.js
- tribe-talk-frontend/src/services/useWebSocket.js
- notification-service/src/main/resources/application.yaml
- k8s/deployments/*.yaml

See DEPLOYMENT_CRITICAL_CHANGES.md for details.

WORKFLOW:
1. Create your feature branches from 'develop' (not main)
2. When ready, create PR to merge into 'develop'
3. I'll review and merge, resolving any conflicts
4. Once all features are integrated, we'll deploy to production

If you need to work on any of the critical files, please coordinate with me first.

Thanks!
```

---

## 🔀 Handling Specific Conflict Scenarios

### Scenario 1: Teammate Modified UserController.java

```bash
# During merge, conflict occurs in UserController.java

# Open the file
nano tribetalk/src/main/java/com/learning/tribetalk/controller/UserController.java

# You'll see:
<<<<<<< HEAD (your changes)
    @GetMapping("/loggedUser")
    public ResponseEntity<UserResponse> getUserByUsername(@AuthenticationPrincipal User user) {
        if (user == null) {
            return ResponseEntity.status(401).build();
        }
        return userService.findByUsername(user.getUsername())...
=======
    @GetMapping("/loggedUser")
    public ResponseEntity<UserResponse> getUserByUsername(@AuthenticationPrincipal User user) {
        // Teammate's changes (no null check)
        return userService.findByUsername(user.getUsername())...
>>>>>>> feature/backend-improvements

# KEEP YOUR VERSION (the one with null check)
# Remove conflict markers and keep:
    @GetMapping("/loggedUser")
    public ResponseEntity<UserResponse> getUserByUsername(@AuthenticationPrincipal User user) {
        if (user == null) {
            return ResponseEntity.status(401).build();
        }
        return userService.findByUsername(user.getUsername())...

# If they added NEW methods, keep those too
# Just preserve your null check in the existing method
```

### Scenario 2: Teammate Modified SecurityConfig.java

```bash
# Conflict in SecurityConfig.java

# KEEP YOUR VERSION for the authorizeHttpRequests section
# Their changes might be in other parts - keep those

# Your critical part (MUST preserve):
.authorizeHttpRequests(auth -> auth
    .requestMatchers("/api/auth/**").permitAll()
    .requestMatchers("/api/users/**").permitAll()
    // NO permitAll for /api/test, /api/follow, /api/v1/posts
    .requestMatchers("/h2-console/**").permitAll()
    ...
    .anyRequest().authenticated())

# If they added new security configurations elsewhere, keep those
```

### Scenario 3: Teammate Modified Frontend Services

```bash
# For notificationService.js and useWebSocket.js

# KEEP YOUR VERSION:
const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'}/notification/api/notifications`;

# NOT their version:
const API_BASE_URL = 'http://localhost:8082/api/notifications';

# If they added new functions, keep those
# Just preserve the API_BASE_URL change
```

---

## 🧪 Testing After Merge

```bash
# After merging teammate changes, ALWAYS test:

# 1. Build backend services
cd tribetalk && mvn clean package -DskipTests
cd ../ChatService && mvn clean package -DskipTests
cd ../notification-service && mvn clean package -DskipTests

# 2. Build frontend
cd ../tribe-talk-frontend
npm install
npm run build

# 3. Run locally to test
docker-compose up -d  # If you have docker-compose setup

# 4. Test critical endpoints
curl http://localhost:8080/api/users/loggedUser
# Should return 401, NOT 500

curl http://localhost:8080/api/v1/posts/all
# Should return 302 redirect to login (requires auth)

# 5. Test frontend
open http://localhost:5173
# Check browser console for errors
# Verify no "localhost:8082" errors
```

---

## 📊 Git Workflow Diagram

```
main (production)
  │
  ├─── develop (integration) ← YOU merge teammate changes here
  │      │
  │      ├─── fix/deployment-critical (YOUR branch)
  │      │      └─── Your critical fixes
  │      │
  │      ├─── feature/ui-improvements (Teammate 1)
  │      │      └─── UI changes
  │      │
  │      ├─── feature/chat-enhancements (Teammate 2)
  │      │      └─── Chat features
  │      │
  │      └─── feature/notification-updates (Teammate 3)
  │             └─── Notification features
  │
  └─── hotfix/* (emergency only)
```

---

## ✅ Recommended Workflow Summary

1. **YOU (DevOps)**:
   - ✅ Create `fix/deployment-critical` branch with your changes
   - ✅ Create `develop` branch from your fixes
   - ✅ Document critical changes in `DEPLOYMENT_CRITICAL_CHANGES.md`
   - ✅ Push both branches to remote

2. **TEAMMATES**:
   - ✅ Create feature branches from `develop`
   - ✅ Work on their features
   - ✅ Create Pull Requests to `develop`

3. **YOU (Review & Merge)**:
   - ✅ Review teammate PRs
   - ✅ Merge into `develop`, resolving conflicts (keep your critical changes)
   - ✅ Test after each merge
   - ✅ When all features integrated, merge `develop` → `main`

4. **DEPLOYMENT**:
   - ✅ Deploy from `main` branch
   - ✅ Use `DEPLOYMENT_CHECKLIST.md`

---

## 🚨 Emergency: If Teammate Already Pushed to Main

```bash
# If teammate already pushed their changes to main:

# 1. Create backup of main
git checkout main
git branch main-backup

# 2. Reset main to before their changes
git reset --hard <commit-hash-before-teammate-changes>

# 3. Merge your deployment fixes
git merge fix/deployment-critical

# 4. Cherry-pick teammate's commits (excluding conflicting ones)
git cherry-pick <teammate-commit-1>
git cherry-pick <teammate-commit-2>
# Resolve conflicts, keeping your critical changes

# 5. Force push (DANGEROUS - coordinate with team first!)
git push origin main --force

# Better approach: Don't force push, instead:
# 6. Create new branch with correct state
git checkout -b main-corrected
git push origin main-corrected

# 7. Ask team to switch to main-corrected
```

---

## 📚 Best Practices Going Forward

1. **Protected Branches**:
   - Make `main` and `develop` protected on GitHub/GitLab
   - Require PR reviews before merging
   - Require status checks to pass

2. **Code Owners**:
   - Create `.github/CODEOWNERS`:
   ```
   # DevOps/Infrastructure files
   /terraform/** @your-username
   /ansible/** @your-username
   /k8s/** @your-username
   *.md @your-username
   
   # Critical deployment files
   **/SecurityConfig.java @your-username
   **/UserController.java @your-username
   **/application.yaml @your-username
   ```

3. **CI/CD**:
   - Set up GitHub Actions to run tests on PRs
   - Prevent merge if tests fail
   - Automated deployment from `main` only

4. **Communication**:
   - Daily standups to discuss who's working on what
   - Use PR descriptions to explain changes
   - Tag teammates in PRs that might affect their work

---

## 🎯 Quick Command Reference

```bash
# Save your work
git checkout -b fix/deployment-critical
git add .
git commit -m "fix: Critical deployment fixes"
git push origin fix/deployment-critical

# Create integration branch
git checkout -b develop
git push origin develop

# Merge teammate changes
git checkout develop
git merge origin/feature/teammate-branch
# Resolve conflicts (keep your critical changes)
git push origin develop

# Deploy to production
git checkout main
git merge develop
git push origin main
```

---

**Remember**: Your deployment fixes are critical for production. Always preserve them when merging teammate changes!
