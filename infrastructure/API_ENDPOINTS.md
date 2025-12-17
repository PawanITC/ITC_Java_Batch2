# TribeTalk API Endpoints for Postman Testing

**Base URL:** `http://k8s-default-tribetal-089de13287-2004909155.eu-north-1.elb.amazonaws.com`

---

## 🔐 Authentication Endpoints

### 1. Register New User
```
POST /api/auth/register
```

**Headers:**
```
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "username": "testuser",
  "email": "test@example.com",
  "password": "Test123!"
}
```

**Expected Response:** 
- Success: 200 OK with user data and JWT token
- Error: 400/409 with error message

---

### 2. Login
```
POST /api/auth/login
```

**Headers:**
```
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "username": "testuser",
  "password": "Test123!"
}
```

**Expected Response:**
- Success: 200 OK with JWT token
- Error: 401 Unauthorized

---

### 3. Validate User (Check Authentication)
```
GET /api/auth/validateUser
```

**Headers:**
```
Cookie: JSESSIONID=<session-id-from-login>
```
OR
```
Authorization: Bearer <jwt-token-from-login>
```

**Expected Response:**
- Authenticated: 200 OK with user data
- Not authenticated: 302 Redirect to /login

---

## 👤 User Endpoints

### 4. Get All Users
```
GET /api/users
```

**Expected Response:** 200 OK with array of users

---

### 5. Get User by ID
```
GET /api/users/{userId}
```

**Example:**
```
GET /api/users/1
```

---

## 🏥 Health Check Endpoints

### 6. Application Health
```
GET /api/actuator/health
```

**Expected Response:**
```json
{
  "status": "UP",
  "groups": ["liveness", "readiness"]
}
```

---

### 7. Application Info
```
GET /api/actuator/info
```

---

## 🧪 Test Endpoints

### 8. Test Endpoint (Public)
```
GET /api/test/hello
```

**Expected Response:** "Hello from TribeTalk!"

---

## 📝 Postman Collection Setup

### Step 1: Create Environment
Create a new environment in Postman with:
- **Variable:** `base_url`
- **Value:** `http://k8s-default-tribetal-089de13287-2004909155.eu-north-1.elb.amazonaws.com`

### Step 2: Test Authentication Flow

1. **Register a user** (POST /api/auth/register)
2. **Login** (POST /api/auth/login) - Save the token from response
3. **Validate** (GET /api/auth/validateUser) - Use the token in Authorization header

### Step 3: Check for CORS Issues

If you get CORS errors in Postman, it means the backend CORS configuration needs adjustment. However, Postman usually bypasses CORS, so you shouldn't see these errors.

---

## 🔍 Debugging Tips

### Check if Backend is Responding:
```bash
curl http://k8s-default-tribetal-089de13287-2004909155.eu-north-1.elb.amazonaws.com/api/actuator/health
```

### Test Registration:
```bash
curl -X POST http://k8s-default-tribetal-089de13287-2004909155.eu-north-1.elb.amazonaws.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "Test123!"
  }'
```

### Test Login:
```bash
curl -X POST http://k8s-default-tribetal-089de13287-2004909155.eu-north-1.elb.amazonaws.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "Test123!"
  }'
```

---

## ⚠️ Common Issues

### 1. 302 Redirect on Protected Endpoints
This is expected for unauthenticated requests. Spring Security redirects to `/login`.

### 2. CORS Errors
Should be fixed in v1.1 backend with `addAllowedOriginPattern("*")`.

### 3. 404 Not Found
Check that the endpoint path is correct and includes `/api` prefix.

---

## 📊 Expected Behavior

### Public Endpoints (No Auth Required):
- `/api/auth/register` ✅
- `/api/auth/login` ✅
- `/api/test/**` ✅
- `/api/users/**` ✅ (currently public)
- `/api/actuator/health` ✅

### Protected Endpoints (Auth Required):
- Most other endpoints will return 302 redirect if not authenticated

---

## 🎯 Quick Test Sequence

1. **Health Check:**
   ```
   GET /api/actuator/health
   ```
   Should return: `{"status":"UP"}`

2. **Register:**
   ```
   POST /api/auth/register
   Body: {"username":"test","email":"test@test.com","password":"Test123!"}
   ```

3. **Login:**
   ```
   POST /api/auth/login
   Body: {"username":"test","password":"Test123!"}
   ```
   Save the token from response

4. **Validate:**
   ```
   GET /api/auth/validateUser
   Header: Authorization: Bearer <token>
   ```
   Should return user data

---

**Use these endpoints to verify the backend is working correctly independent of the frontend!**
