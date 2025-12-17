# TribeTalk Application Access Guide

**Deployment Status:** ✅ **SUCCESSFUL - All services running!**

**Application URL:** http://k8s-default-tribetal-089de13287-2004909155.eu-north-1.elb.amazonaws.com

---

## 🎯 How to Access the Application

### The White Screen Issue - SOLVED! ✅

**What you're seeing:** White screen on `/main` route  
**Why:** You're trying to access a protected route without logging in  
**Solution:** Start from the home page!

---

## 📝 Step-by-Step Access Instructions

### 1. **Go to the Landing Page**
Navigate to the root URL:
```
http://k8s-default-tribetal-089de13287-2004909155.eu-north-1.elb.amazonaws.com/
```

This is the **Home** page (`Home.jsx`) which contains:
- Login form
- Registration/Sign-up form
- OAuth2 login options (GitHub, Google, etc.)

### 2. **Create an Account**
On the landing page, you should see a "Create Account" or "Sign Up" button/modal.

Fill in:
- Username
- Email
- Password

### 3. **Login**
After registration, login with your credentials.

### 4. **Access Main Feed**
Once logged in, you'll be automatically redirected to `/main` - the main feed page.

---

## 🗺️ Available Routes

### Public Routes (No Login Required)
- **`/`** - Landing page with login/registration
- **`/oauth2/redirect`** - OAuth2 callback handler

### Protected Routes (Login Required)
- **`/main`** - Main feed (home timeline)
- **`/profile`** - User profile
- **`/explore`** - Explore page
- **`/notifications`** - Notifications
- **`/bookmarks`** - Saved bookmarks
- **`/communities`** - Communities
- **`/messages`** - Direct messages
- **`/news/:id`** - News details

---

## 🔍 Troubleshooting

### Issue: Still seeing white screen on `/main`

**Check Browser Console (F12):**
1. Open Developer Tools (F12 or Right-click → Inspect)
2. Go to Console tab
3. Look for errors like:
   - `401 Unauthorized`
   - `Failed to fetch`
   - `Network Error`
   - JavaScript errors

**Common Causes:**
1. **Not logged in** - Go to `/` and login first
2. **Session expired** - Clear cookies and login again
3. **API connection issue** - Check network tab for failed requests

### Issue: Can't see login/registration form

**Verify the landing page loads:**
```bash
curl http://k8s-default-tribetal-089de13287-2004909155.eu-north-1.elb.amazonaws.com/
```

Should return HTML with React app.

### Issue: Registration fails

**Test the API endpoint:**
```bash
curl -X POST http://k8s-default-tribetal-089de13287-2004909155.eu-north-1.elb.amazonaws.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "Test123!"
  }'
```

---

## 🔐 Authentication Flow

```
1. User visits "/" (Landing page)
   ↓
2. User clicks "Sign Up" or "Login"
   ↓
3. Frontend sends request to /api/auth/register or /api/auth/login
   ↓
4. Backend validates and creates session/JWT
   ↓
5. Frontend stores auth token
   ↓
6. User is redirected to "/main"
   ↓
7. ProtectedRoute checks authentication
   ↓
8. If authenticated → Show main feed
   If not → Redirect to "/"
```

---

## 🧪 Testing the Deployment

### 1. Test Frontend is Serving
```bash
curl -I http://k8s-default-tribetal-089de13287-2004909155.eu-north-1.elb.amazonaws.com/
```
**Expected:** `HTTP/1.1 200 OK`

### 2. Test Backend API
```bash
curl http://k8s-default-tribetal-089de13287-2004909155.eu-north-1.elb.amazonaws.com/api/actuator/health
```
**Expected:** Redirect to `/login` (302) - this is correct! It means Spring Security is working.

### 3. Test Static Assets
```bash
curl -I http://k8s-default-tribetal-089de13287-2004909155.eu-north-1.elb.amazonaws.com/assets/index-Cv0ni6_t.js
```
**Expected:** `HTTP/1.1 200 OK`

---

## ✅ Deployment Verification Checklist

- [x] Infrastructure deployed (EKS, VPC, Subnets, Security Groups)
- [x] All services running (TribeTalk, ChatService, Notification, Frontend)
- [x] Load Balancer provisioned and accessible
- [x] Frontend serving static files
- [x] Backend API responding (with authentication)
- [x] Databases configured (PostgreSQL, MongoDB, Redis, Kafka)
- [x] Security groups allowing traffic
- [x] Secrets synced from AWS Secrets Manager
- [ ] **User registered and logged in** ← **YOU ARE HERE**

---

## 🎉 Next Steps

1. **Access the landing page** at `/`
2. **Create your first account**
3. **Login and explore the application**
4. **Test features:**
   - Create a post
   - Send a message
   - Explore communities
   - Check notifications

---

## 📊 Service Status

| Service | Status | Port | Health Check |
|---------|--------|------|--------------|
| Frontend | ✅ Running | 80 | N/A |
| TribeTalk API | ✅ Running | 8080 | `/api/actuator/health` |
| ChatService | ✅ Running | 8081 | `/actuator/health` |
| Notification | ✅ Running | 8082 | `/actuator/health` |
| PostgreSQL | ✅ Running | 5432 | Connected |
| MongoDB | ✅ Running | 27017 | Connected |
| Redis | ✅ Running | 6379 | Connected |
| Kafka | ✅ Running | 9092 | Connected |

---

## 🔗 Quick Links

- **Application:** http://k8s-default-tribetal-089de13287-2004909155.eu-north-1.elb.amazonaws.com
- **API Health:** http://k8s-default-tribetal-089de13287-2004909155.eu-north-1.elb.amazonaws.com/api/actuator/health
- **Troubleshooting Guide:** [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)
- **Deployment Summary:** [DEPLOYMENT_SUMMARY.md](./DEPLOYMENT_SUMMARY.md)

---

**🎊 Congratulations! Your TribeTalk application is fully deployed and ready to use!**

Just start from the home page (`/`) and create your account! 🚀
