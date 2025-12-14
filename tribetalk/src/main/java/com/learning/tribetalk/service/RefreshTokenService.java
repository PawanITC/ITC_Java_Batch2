package com.learning.tribetalk.service;

import com.learning.tribetalk.entity.RefreshToken;
import com.learning.tribetalk.entity.postgres.User;
import com.learning.tribetalk.exception.TokenRefreshException;
import com.learning.tribetalk.repository.RefreshTokenRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class RefreshTokenService {

    private final RefreshTokenRepository refreshTokenRepository;

    @Value("${jwt.refresh.expirationMillis:2592000000}") // 30 days default
    private long refreshExpirationMillis;

    /**
     * Create a new refresh token for the user
     */
    @Transactional
    public RefreshToken createRefreshToken(User user) {
        RefreshToken refreshToken = RefreshToken.builder()
                .user(user)
                .token(UUID.randomUUID().toString())
                .createdAt(Instant.now())
                .expiryDate(Instant.now().plusMillis(refreshExpirationMillis))
                .used(false)
                .build();

        return refreshTokenRepository.save(refreshToken);
    }

    /**
     * Verify refresh token and rotate it (mark old as used, create new one)
     */
    @Transactional
    public RefreshToken verifyAndRotate(String token) throws TokenRefreshException {
        RefreshToken refreshToken = refreshTokenRepository.findByToken(token)
                .orElseThrow(() -> new TokenRefreshException("Refresh token not found"));

        // Validate token
        if (!refreshToken.isValid()) {
            String reason = refreshToken.isExpired() ? "expired"
                    : refreshToken.isRevoked() ? "revoked" : "already used";
            throw new TokenRefreshException("Refresh token is " + reason);
        }

        // Mark old token as used
        refreshToken.setUsed(true);
        refreshTokenRepository.save(refreshToken);

        // Create and return new refresh token
        return createRefreshToken(refreshToken.getUser());
    }

    /**
     * Revoke all refresh tokens for a user (used during logout)
     */
    @Transactional
    public void revokeAllUserTokens(User user) {
        refreshTokenRepository.revokeAllUserTokens(user, Instant.now());
        log.info("Revoked all refresh tokens for user: {}", user.getUsername());
    }

    /**
     * Delete expired tokens - runs daily at 2 AM
     */
    @Scheduled(cron = "0 0 2 * * ?")
    @Transactional
    public void deleteExpiredTokens() {
        Instant now = Instant.now();
        refreshTokenRepository.deleteByExpiryDateBefore(now);
        log.info("Deleted expired refresh tokens before: {}", now);
    }
}
