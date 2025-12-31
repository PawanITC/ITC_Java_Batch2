# HttpOnly Cookie Authentication Issue - Post Creation 500 Error

## Problem
User is logged in with username/password using httpOnly cookies, but post creation returns 500 Internal Server Error.

## Root Cause
Backend logs show: `Set SecurityContextHolder to anonymous SecurityContext [user=Anonymous]`

This means the **JWT cookie is NOT being sent** with the post creation request, or the backend cannot read it.

## Backend Configuration (Correct)

### AuthController.java
- Login endpoint sets httpOnly cookie named `"jwt"`
- Cookie is set via `ResponseCookie cookie = jwtUtil.generateJwtCookie(token)`

### JwtAuthenticationFilter.java
- Extracts JWT from cookie named `"jwt"`
- Method: `extractFromCookies(request)`
- Looks for cookie with name `"jwt"` (case-insensitive)

## Frontend Configuration (Correct)

### axiosInstance.js
```javascript
withCredentials: true  // ✅ Configured to send cookies
```

### PostModal.jsx
```javascript
axiosInstance.post("/v1/posts/create", formData, {
    headers: { "Content-Type": "multipart/form-data" }
})
```

## Why Cookie Might Not Be Sent

### 1. Cookie Domain Mismatch
**Problem:** Cookie set for one domain, request sent to another

**Check in Browser (F12 → Application/Storage → Cookies):**
- Look for cookie named `jwt`
- Check its **Domain** value
- Should match the domain you're accessing

**Example Issue:**
- Cookie domain: `localhost`
- Request to: `k8s-default-tribetal-089de13287-2075252521.eu-north-1.elb.amazonaws.com`
- Result: Cookie NOT sent ❌

### 2. Cookie Path Mismatch
**Problem:** Cookie set for specific path, request to different path

**Check:**
- Cookie Path: Should be `/` or `/api`
- Request Path: `/api/v1/posts/create`

### 3. SameSite Attribute
**Problem:** Cookie has `SameSite=Strict` or `SameSite=Lax` preventing cross-site requests

**Check in Browser:**
- Cookie `SameSite` attribute
- Should be `None` for cross-origin requests (with `Secure` flag)

### 4. Secure Flag Issue
**Problem:** Cookie has `Secure` flag but using HTTP (not HTTPS)

**Check:**
- If cookie has `Secure: true`
- But accessing via `http://` (not `https://`)
- Cookie will NOT be sent ❌

## Diagnostic Steps

### Step 1: Check if Cookie Exists

**Browser DevTools (F12):**
1. Go to **Application** tab (Chrome) or **Storage** tab (Firefox)
2. Click **Cookies** → Select your domain
3. Look for cookie named `jwt`

**Expected:**
- Name: `jwt`
- Value: Long JWT token string
- Domain: Your application domain
- Path: `/`
- HttpOnly: ✅ (checked)
- Secure: Depends on HTTP vs HTTPS
- SameSite: `Lax` or `None`

**If cookie doesn't exist:**
- Login didn't work properly
- Try logging in again

### Step 2: Check if Cookie is Sent with Request

**Browser DevTools → Network Tab:**
1. Try to create a post
2. Click on the `/v1/posts/create` request
3. Go to **Headers** tab
4. Scroll to **Request Headers**
5. Look for `Cookie:` header

**Expected:**
```
Cookie: jwt=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**If Cookie header is missing:**
- Cookie domain/path doesn't match
- SameSite policy blocking it
- Secure flag issue

### Step 3: Check Backend Cookie Reading

**Check JwtUtil.java:**
```bash
# Find where cookie is generated
grep -r "generateJwtCookie" tribetalk/src/
```

Look for:
- Cookie domain setting
- Cookie path setting
- SameSite attribute
- Secure flag

## Solutions

### Solution 1: Fix Cookie Domain

**If cookie domain doesn't match request domain:**

**In JwtUtil.java (or wherever cookie is created):**
```java
ResponseCookie cookie = ResponseCookie.from("jwt", token)
    .httpOnly(true)
    .secure(false)  // Set to true only if using HTTPS
    .path("/")
    .maxAge(24 * 60 * 60)  // 24 hours
    .sameSite("Lax")  // or "None" if cross-origin
    // .domain(".yourdomain.com")  // Don't set domain for same-origin
    .build();
```

**Key points:**
- **Don't set `.domain()`** for same-origin requests
- Set `.secure(true)` only if using HTTPS
- Use `.sameSite("Lax")` for same-origin
- Use `.sameSite("None")` with `.secure(true)` for cross-origin

### Solution 2: Verify withCredentials

**Ensure all axios requests include credentials:**

**In PostModal.jsx:**
```javascript
const res = await axiosInstance.post("/v1/posts/create", formData, {
    headers: { "Content-Type": "multipart/form-data" },
    withCredentials: true  // Explicitly set (though should inherit from instance)
});
```

### Solution 3: Check CORS Configuration

**In SecurityConfig.java:**
```java
.cors(cors -> cors.configurationSource(request -> {
    CorsConfiguration config = new CorsConfiguration();
    config.setAllowedOrigins(List.of("http://localhost:5173", "http://your-alb-dns"));
    config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
    config.setAllowedHeaders(List.of("*"));
    config.setAllowCredentials(true);  // ← CRITICAL for cookies!
    return config;
}))
```

**CRITICAL:** `setAllowCredentials(true)` must be set for cookies to work!

### Solution 4: Check if Login Actually Worked

**Test login endpoint:**
```bash
# From your machine
curl -X POST http://k8s-default-tribetal-089de13287-2075252521.eu-north-1.elb.amazonaws.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"password"}' \
  -v
```

**Look for in response:**
```
< Set-Cookie: jwt=eyJhbGc...; Path=/; HttpOnly
```

**If no Set-Cookie header:**
- Login endpoint not setting cookie properly
- Check JwtUtil.generateJwtCookie() implementation

## Quick Fix to Test

### Temporary: Add Logging

**In JwtAuthenticationFilter.java:**
```java
@Override
protected void doFilterInternal(HttpServletRequest request,
                                HttpServletResponse response,
                                FilterChain filterChain) throws ServletException, IOException {

    final String token = extractFromCookies(request);
    
    // ADD THIS LOGGING
    log.info("=== JWT Cookie Debug ===");
    log.info("Request URI: {}", request.getRequestURI());
    log.info("Cookies present: {}", request.getCookies() != null ? request.getCookies().length : 0);
    if (request.getCookies() != null) {
        for (Cookie c : request.getCookies()) {
            log.info("Cookie: {} = {}", c.getName(), c.getValue().substring(0, Math.min(20, c.getValue().length())) + "...");
        }
    }
    log.info("JWT token extracted: {}", token != null ? "YES" : "NO");
    log.info("========================");
    
    // ... rest of the code
}
```

**Rebuild and redeploy, then check logs:**
```bash
kubectl logs -l app=tribetalk --tail=50 | grep "JWT Cookie Debug" -A 10
```

## Expected Behavior

### When Working Correctly:

1. **Login:**
   - POST `/api/auth/login`
   - Response: `Set-Cookie: jwt=...`
   - Browser stores cookie

2. **Create Post:**
   - POST `/api/v1/posts/create`
   - Request includes: `Cookie: jwt=...`
   - Backend reads cookie
   - Authenticates user
   - Creates post
   - Returns 200 OK

### Current Behavior:

1. **Login:** ✅ (assuming this works)
2. **Create Post:**
   - POST `/api/v1/posts/create`
   - Request **missing** `Cookie` header ❌
   - Backend sees Anonymous user
   - Redirects to `/login`
   - Frontend sees 500 error

## Next Steps

1. **Check browser cookies** (F12 → Application → Cookies)
2. **Check Network tab** for Cookie header in request
3. **Share findings:**
   - Does `jwt` cookie exist?
   - What's its Domain and Path?
   - Is Cookie header sent with post request?

Once you share this info, I can provide the exact fix!

## Common Issues & Fixes

| Issue | Symptom | Fix |
|-------|---------|-----|
| Cookie domain mismatch | Cookie exists but not sent | Don't set domain in cookie |
| Secure flag on HTTP | Cookie exists but not sent | Set `secure(false)` |
| SameSite=Strict | Cookie exists but not sent | Set `sameSite("Lax")` |
| CORS credentials | Cookie sent but rejected | Set `allowCredentials(true)` |
| Wrong cookie name | Backend can't find cookie | Verify name is "jwt" |

---

**TL;DR: Check browser DevTools to see if `jwt` cookie exists and is being sent with the request. Share screenshots if possible!**
