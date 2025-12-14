# Refresh Token Database Migration

## SQL Script for Manual Execution

If you need to manually create the refresh_tokens table (not using Hibernate auto-update), run this SQL:

```sql
CREATE TABLE IF NOT EXISTS refresh_tokens (
    id BIGSERIAL PRIMARY KEY,
    token VARCHAR(512) NOT NULL UNIQUE,
    user_id BIGINT NOT NULL,
    expiry_date TIMESTAMP NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    revoked_at TIMESTAMP,
    used BOOLEAN NOT NULL DEFAULT FALSE,
    
    CONSTRAINT fk_refresh_token_user 
        FOREIGN KEY (user_id) 
        REFERENCES users(id) 
        ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_refresh_tokens_token ON refresh_tokens(token);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_expiry_date ON refresh_tokens(expiry_date);
```

## Hibernate Auto-Update

Since `application.yml` has `ddl-auto: update`, Hibernate will automatically create this table when the application starts with the RefreshToken entity.

## SecurityConfig Update Required

**IMPORTANT**: You need to update `SecurityConfig.java` to permit the refresh endpoint:

```java
// In SecurityConfig.java, update the security filter chain:

http
    .authorizeHttpRequests(auth -> auth
        .requestMatchers("/api/auth/login").permitAll()
        .requestMatchers("/api/auth/refresh").permitAll()  // ADD THIS LINE
        .requestMatchers("/api/auth/logout").permitAll()
        // ... rest of your matchers
    )
```

This allows unauthenticated access to the `/api/auth/refresh` endpoint, which is necessary because the access token may be expired when calling this endpoint.
