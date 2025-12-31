# Refresh Token Implementation Guide (HttpOnly Cookie Method)

This guide contains all the code changes needed to implement refresh token functionality in TribeTalk using httpOnly cookies for enhanced security.

## Overview

- **Access Token**: Short-lived (1 hour), stored in httpOnly cookie
- **Refresh Token**: Long-lived (7 days), stored in httpOnly cookie
- **Security**: Tokens not accessible via JavaScript (XSS protection)
- **Auto-refresh**: Frontend automatically refreshes expired access tokens

---

## Backend Changes

### 1. Create RefreshToken Entity

**New File:** `tribetalk/src/main/java/com/learning/tribetalk/entity/postgres/RefreshToken.java`

```java
package com.learning.tribetalk.entity.postgres;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.Instant;

@Entity
@Table(name = "refresh_tokens")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RefreshToken {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false, unique = true)
    private String token;
    
    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;
    
    @Column(nullable = false)
    private Instant expiryDate;
    
    @Column(nullable = false)
    private Instant createdAt;
}
```

---

### 2. Create RefreshToken Repository

**New File:** `tribetalk/src/main/java/com/learning/tribetalk/repository/postgres/RefreshTokenRepository.java`

```java
package com.learning.tribetalk.repository.postgres;

import com.learning.tribetalk.entity.postgres.RefreshToken;
import com.learning.tribetalk.entity.postgres.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.stereotype.Repository;
import java.time.Instant;
import java.util.Optional;

@Repository
public interface RefreshTokenRepository extends JpaRepository<RefreshToken, Long> {
    
    Optional<RefreshToken> findByToken(String token);
    
    @Modifying
    int deleteByUser(User user);
    
    @Modifying
    int deleteByExpiryDateBefore(Instant now);
}
```

---

### 3. Create RefreshToken Service

**New File:** `tribetalk/src/main/java/com/learning/tribetalk/service/RefreshTokenService.java`

```java
package com.learning.tribetalk.service;

import com.learning.tribetalk.entity.postgres.RefreshToken;
import com.learning.tribetalk.entity.postgres.User;
import com.learning.tribetalk.repository.postgres.RefreshTokenRepository;
import com.learning.tribetalk.repository.postgres.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

@Service
public class RefreshTokenService {
    
    @Value("${jwt.refreshExpirationMs:604800000}") // 7 days default
    private Long refreshTokenDurationMs;
    
    private final RefreshTokenRepository refreshTokenRepository;
    private final UserRepository userRepository;
    
    public RefreshTokenService(RefreshTokenRepository refreshTokenRepository, 
                              UserRepository userRepository) {
        this.refreshTokenRepository = refreshTokenRepository;
        this.userRepository = userRepository;
    }
    
    public RefreshToken createRefreshToken(Long userId) {
        RefreshToken refreshToken = RefreshToken.builder()
                .user(userRepository.findById(userId)
                        .orElseThrow(() -> new RuntimeException("User not found")))
                .token(UUID.randomUUID().toString())
                .expiryDate(Instant.now().plusMillis(refreshTokenDurationMs))
                .createdAt(Instant.now())
                .build();
        
        return refreshTokenRepository.save(refreshToken);
    }
    
    public Optional<RefreshToken> findByToken(String token) {
        return refreshTokenRepository.findByToken(token);
    }
    
    public RefreshToken verifyExpiration(RefreshToken token) {
        if (token.getExpiryDate().compareTo(Instant.now()) < 0) {
            refreshTokenRepository.delete(token);
            throw new RuntimeException("Refresh token expired. Please login again.");
        }
        return token;
    }
    
    @Transactional
    public int deleteByUserId(Long userId) {
        return refreshTokenRepository.deleteByUser(
                userRepository.findById(userId)
                        .orElseThrow(() -> new RuntimeException("User not found"))
        );
    }
    
    @Transactional
    public int deleteExpiredTokens() {
        return refreshTokenRepository.deleteByExpiryDateBefore(Instant.now());
    }
}
```

---

### 4. Update AuthController

**File:** `tribetalk/src/main/java/com/learning/tribetalk/controller/AuthController.java`

**Add these imports:**
```java
import com.learning.tribetalk.entity.postgres.RefreshToken;
import com.learning.tribetalk.service.RefreshTokenService;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpServletRequest;
```

**Add to constructor:**
```java
private final RefreshTokenService refreshTokenService;

public AuthController(AuthenticationManager authenticationManager,
                     UserDetailsService userDetailsService,
                     JwtUtil jwtUtil,
                     UserRepository userRepository,
                     RefreshTokenService refreshTokenService) {
    this.authenticationManager = authenticationManager;
    this.userDetailsService = userDetailsService;
    this.jwtUtil = jwtUtil;
    this.userRepository = userRepository;
    this.refreshTokenService = refreshTokenService;
}
```

**Replace login method:**
```java
@PostMapping("/login")
public ResponseEntity<?> login(@RequestBody LoginRequest loginRequest, 
                               HttpServletResponse response) {
    try {
        authenticationManager.authenticate(
            new UsernamePasswordAuthenticationToken(
                loginRequest.getUsername(), 
                loginRequest.getPassword()
            )
        );
        
        UserDetails userDetails = userDetailsService.loadUserByUsername(loginRequest.getUsername());
        String accessToken = jwtUtil.generateToken(userDetails.getUsername());
        
        // Get user
        User user = userRepository.findByUsername(loginRequest.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        // Create refresh token
        RefreshToken refreshToken = refreshTokenService.createRefreshToken(user.getId());
        
        // Set access token cookie (httpOnly, 1 hour)
        Cookie accessTokenCookie = new Cookie("accessToken", accessToken);
        accessTokenCookie.setHttpOnly(true);
        accessTokenCookie.setSecure(false); // Set to true in production with HTTPS
        accessTokenCookie.setPath("/");
        accessTokenCookie.setMaxAge(3600); // 1 hour
        response.addCookie(accessTokenCookie);
        
        // Set refresh token cookie (httpOnly, 7 days)
        Cookie refreshTokenCookie = new Cookie("refreshToken", refreshToken.getToken());
        refreshTokenCookie.setHttpOnly(true);
        refreshTokenCookie.setSecure(false); // Set to true in production with HTTPS
        refreshTokenCookie.setPath("/");
        refreshTokenCookie.setMaxAge(604800); // 7 days
        response.addCookie(refreshTokenCookie);
        
        return ResponseEntity.ok(new MessageResponse("Login successful"));
    } catch (Exception e) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(new MessageResponse("Invalid credentials"));
    }
}
```

**Add new refresh endpoint:**
```java
@PostMapping("/refresh")
public ResponseEntity<?> refreshToken(HttpServletRequest request, 
                                     HttpServletResponse response) {
    // Get refresh token from cookie
    String refreshTokenValue = null;
    if (request.getCookies() != null) {
        for (Cookie cookie : request.getCookies()) {
            if ("refreshToken".equals(cookie.getName())) {
                refreshTokenValue = cookie.getValue();
                break;
            }
        }
    }
    
    if (refreshTokenValue == null) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(new MessageResponse("Refresh token not found"));
    }
    
    try {
        RefreshToken refreshToken = refreshTokenService.findByToken(refreshTokenValue)
                .orElseThrow(() -> new RuntimeException("Invalid refresh token"));
        
        refreshToken = refreshTokenService.verifyExpiration(refreshToken);
        User user = refreshToken.getUser();
        
        // Generate new access token
        String newAccessToken = jwtUtil.generateToken(user.getUsername());
        
        // Set new access token cookie
        Cookie accessTokenCookie = new Cookie("accessToken", newAccessToken);
        accessTokenCookie.setHttpOnly(true);
        accessTokenCookie.setSecure(false); // Set to true in production
        accessTokenCookie.setPath("/");
        accessTokenCookie.setMaxAge(3600); // 1 hour
        response.addCookie(accessTokenCookie);
        
        return ResponseEntity.ok(new MessageResponse("Token refreshed successfully"));
    } catch (Exception e) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(new MessageResponse(e.getMessage()));
    }
}
```

**Replace logout method:**
```java
@PostMapping("/logout")
public ResponseEntity<?> logout(HttpServletRequest request, 
                               HttpServletResponse response) {
    // Get refresh token from cookie and delete from DB
    if (request.getCookies() != null) {
        for (Cookie cookie : request.getCookies()) {
            if ("refreshToken".equals(cookie.getName())) {
                refreshTokenService.findByToken(cookie.getValue())
                        .ifPresent(token -> refreshTokenService.deleteByUserId(token.getUser().getId()));
                break;
            }
        }
    }
    
    // Clear access token cookie
    Cookie accessTokenCookie = new Cookie("accessToken", null);
    accessTokenCookie.setHttpOnly(true);
    accessTokenCookie.setPath("/");
    accessTokenCookie.setMaxAge(0);
    response.addCookie(accessTokenCookie);
    
    // Clear refresh token cookie
    Cookie refreshTokenCookie = new Cookie("refreshToken", null);
    refreshTokenCookie.setHttpOnly(true);
    refreshTokenCookie.setPath("/");
    refreshTokenCookie.setMaxAge(0);
    response.addCookie(refreshTokenCookie);
    
    return ResponseEntity.ok(new MessageResponse("Logged out successfully"));
}
```

---

### 5. Update JwtAuthenticationFilter

**File:** `tribetalk/src/main/java/com/learning/tribetalk/filter/JwtAuthenticationFilter.java`

**Replace doFilterInternal method:**
```java
@Override
protected void doFilterInternal(HttpServletRequest request, 
                               HttpServletResponse response, 
                               FilterChain filterChain) throws ServletException, IOException {
    try {
        String jwt = null;
        
        // Try to get JWT from cookie first
        if (request.getCookies() != null) {
            for (Cookie cookie : request.getCookies()) {
                if ("accessToken".equals(cookie.getName())) {
                    jwt = cookie.getValue();
                    break;
                }
            }
        }
        
        // Fallback to Authorization header if no cookie
        if (jwt == null) {
            String authHeader = request.getHeader("Authorization");
            if (authHeader != null && authHeader.startsWith("Bearer ")) {
                jwt = authHeader.substring(7);
            }
        }
        
        if (jwt != null && jwtUtil.validateToken(jwt)) {
            String username = jwtUtil.extractUsername(jwt);
            UserDetails userDetails = userDetailsService.loadUserByUsername(username);
            
            UsernamePasswordAuthenticationToken authentication = 
                new UsernamePasswordAuthenticationToken(
                    userDetails, null, userDetails.getAuthorities()
                );
            
            authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
            SecurityContextHolder.getContext().setAuthentication(authentication);
        }
    } catch (Exception e) {
        logger.error("Cannot set user authentication: {}", e.getMessage());
    }
    
    filterChain.doFilter(request, response);
}
```

---

### 6. Update SecurityConfig

**File:** `tribetalk/src/main/java/com/learning/tribetalk/config/SecurityConfig.java`

**Add to permitAll list:**
```java
.requestMatchers("/api/auth/refresh").permitAll()
```

---

### 7. Update application.yml

**File:** `tribetalk/src/main/resources/application.yml`

**Add/Update jwt configuration:**
```yaml
jwt:
  secret: ${JWT_SECRET:change_this_to_a_long_random_secret_with_min_256_bits}
  expirationMillis: 3600000  # 1 hour for access token
  refreshExpirationMs: 604800000  # 7 days for refresh token
```

---

## Frontend Changes

### 1. Update AuthContext

**File:** `tribe-talk-frontend/src/auth/AuthContext.jsx`

**Update login function:**
```javascript
const login = async (username, password) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/api/auth/login`, {
      username,
      password,
    }, {
      withCredentials: true  // Important: send/receive cookies
    });
    
    // Just fetch user info, tokens are in httpOnly cookies
    await fetchUserInfo();
    
    return { success: true };
  } catch (error) {
    return { success: false, error: error.response?.data?.message };
  }
};
```

**Update logout function:**
```javascript
const logout = async () => {
  try {
    await axios.post(`${API_BASE_URL}/api/auth/logout`, {}, {
      withCredentials: true
    });
  } catch (error) {
    console.error('Logout error:', error);
  } finally {
    setUser(null);
    navigate('/');
  }
};
```

**Remove token state management:**
- Remove `token` and `refreshToken` from state
- Remove localStorage token operations
- Cookies are managed automatically

---

### 2. Update Axios Instance

**File:** `tribe-talk-frontend/src/services/axiosInstance.js`

**Replace entire file:**
```javascript
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

const axiosInstance = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  withCredentials: true,  // Always send cookies
  timeout: 10000,
});

// Response interceptor for auto-refresh
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve();
    }
  });
  failedQueue = [];
};

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If 401 and not already retrying
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // Queue this request
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => axiosInstance(originalRequest))
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Call refresh endpoint (cookies sent automatically)
        await axios.post(`${API_BASE_URL}/api/auth/refresh`, {}, {
          withCredentials: true
        });
        
        // New access token is now in cookie
        processQueue(null);
        isRefreshing = false;
        
        // Retry original request
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError);
        isRefreshing = false;
        
        // Redirect to login
        window.location.href = '/';
        
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
```

---

## Implementation Steps

### Backend:
1. Create `RefreshToken.java` entity
2. Create `RefreshTokenRepository.java`
3. Create `RefreshTokenService.java`
4. Update `AuthController.java` (add imports, inject service, update methods)
5. Update `JwtAuthenticationFilter.java` (read token from cookie)
6. Update `SecurityConfig.java` (add `/api/auth/refresh` to permitAll)
7. Update `application.yml` (add refresh token expiration config)
8. Run database migration to create `refresh_tokens` table

### Frontend:
1. Update `AuthContext.jsx` (simplify, remove token state)
2. Update `axiosInstance.js` (add auto-refresh interceptor)
3. Ensure all axios calls use `withCredentials: true`

### Testing:
1. Test login - verify cookies are set
2. Test API calls - verify access token is sent
3. Test token expiry - verify auto-refresh works
4. Test logout - verify cookies are cleared
5. Test refresh token expiry - verify redirect to login

---

## Security Considerations

### Production Settings:
- Set `cookie.setSecure(true)` when using HTTPS
- Enable CSRF protection in Spring Security
- Use SameSite cookie attribute: `cookie.setSameSite("Strict")`
- Rotate refresh tokens on each use
- Implement refresh token family tracking

### Additional Enhancements:
- Add scheduled job to clean expired tokens
- Implement device/session management
- Add refresh token revocation endpoint
- Log refresh token usage for security auditing

---

## Benefits of HttpOnly Cookie Approach

✅ **XSS Protection** - Tokens not accessible via JavaScript  
✅ **Simpler Frontend** - No manual token storage/management  
✅ **Automatic** - Cookies sent automatically with requests  
✅ **Secure** - HttpOnly + Secure + SameSite flags  
✅ **Better UX** - Seamless token refresh  

---

## Notes

- Access tokens expire in 1 hour
- Refresh tokens expire in 7 days
- Frontend automatically refreshes expired access tokens
- Users only need to re-login after 7 days of inactivity
- All tokens are httpOnly and cannot be accessed by JavaScript
