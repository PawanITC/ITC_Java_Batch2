package com.learning.tribetalk.controller;

import com.learning.tribetalk.dto.response.UserResponse;
import com.learning.tribetalk.entity.RefreshToken;
import com.learning.tribetalk.entity.postgres.User;
import com.learning.tribetalk.exception.TokenRefreshException;
import com.learning.tribetalk.security.JwtUtil;
import com.learning.tribetalk.service.RefreshTokenService;
import com.learning.tribetalk.service.postgres.UserService;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.*;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.ResponseCookie;

import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private static final Logger log = LoggerFactory.getLogger(AuthController.class);

    private final AuthenticationManager authenticationManager;
    private final UserDetailsService userDetailsService;
    private final JwtUtil jwtUtil;
    private final UserService userService;
    private final RefreshTokenService refreshTokenService;

    public AuthController(AuthenticationManager authenticationManager,
            UserDetailsService userDetailsService,
            JwtUtil jwtUtil,
            UserService userService,
            RefreshTokenService refreshTokenService) {
        this.authenticationManager = authenticationManager;
        this.userDetailsService = userDetailsService;
        this.jwtUtil = jwtUtil;
        this.userService = userService;
        this.refreshTokenService = refreshTokenService;
    }

    record AuthRequest(String username, String password) {
    }

    record AuthResponse(String token, Long userId) {
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody AuthRequest request, HttpServletResponse response) {
        try {
            System.out.println(request);
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.username(), request.password()));

            var userDetails = userDetailsService.loadUserByUsername(request.username());

            var roles = userDetails.getAuthorities().stream()
                    .map(a -> a.getAuthority())
                    .collect(Collectors.toList());

            // Generate access token
            String token = jwtUtil.generateToken(request.username(), roles);
            ResponseCookie accessCookie = jwtUtil.generateJwtCookie(token);

            // Generate refresh token
            Optional<UserResponse> userResponse = userService.findByUsername(request.username());
            if (userResponse.isEmpty()) {
                return ResponseEntity.badRequest().body(new AuthResponse("", 0L));
            }

            User user = userService.findUserEntityByUsername(request.username())
                    .orElseThrow(() -> new RuntimeException("User not found"));
            RefreshToken refreshToken = refreshTokenService.createRefreshToken(user);
            ResponseCookie refreshCookie = jwtUtil.generateRefreshTokenCookie(refreshToken.getToken());

            return ResponseEntity.ok()
                    .header(HttpHeaders.SET_COOKIE, accessCookie.toString())
                    .header(HttpHeaders.SET_COOKIE, refreshCookie.toString())
                    .body(new AuthResponse(userResponse.get().username(), userResponse.get().id()));

        } catch (BadCredentialsException ex) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(new AuthResponse("Invalid Credentials", 0L));
        }

    }

    // @GetMapping("/validateUser")
    // public ResponseEntity<?> me(@AuthenticationPrincipal UserDetails user) {
    // if (user == null) return ResponseEntity.status(401).build();
    //
    // Optional<UserResponse>
    // userResponse=userService.findByUsername(user.getUsername());
    // if (userResponse.isPresent()){
    // return
    // ResponseEntity.ok(Map.of("username",userResponse.get().username(),"userId",userResponse.get().id()));
    // }
    // else {
    // return ResponseEntity.badRequest().build();
    // }
    // }

    @GetMapping("/validateUser")
    public ResponseEntity<?> me(@CookieValue(name = "jwt", required = false) String token) {
        if (token == null || token.isBlank())
            return ResponseEntity.status(401).build();

        String username = jwtUtil.extractUsername(token);
        boolean isTokenValid = jwtUtil.isTokenValid(token, username);
        if (isTokenValid) {
            Optional<UserResponse> userResponse = userService.findByUsername(username);
            if (userResponse.isPresent()) {
                return ResponseEntity
                        .ok(Map.of("username", userResponse.get().username(), "userId", userResponse.get().id()));
            } else {
                return ResponseEntity.badRequest().build();
            }
        } else {
            return ResponseEntity.badRequest().build();
        }

    }

    @PostMapping("/refresh")
    public ResponseEntity<?> refreshToken(HttpServletRequest request) {
        String refreshToken = extractRefreshTokenFromCookies(request);

        if (refreshToken == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Refresh token not found"));
        }

        try {
            // Verify and rotate refresh token
            RefreshToken newRefreshToken = refreshTokenService.verifyAndRotate(refreshToken);
            User user = newRefreshToken.getUser();

            // Generate new access token
            var userDetails = userDetailsService.loadUserByUsername(user.getUsername());
            var roles = userDetails.getAuthorities().stream()
                    .map(a -> a.getAuthority())
                    .collect(Collectors.toList());
            String newAccessToken = jwtUtil.generateToken(user.getUsername(), roles);

            // Set new cookies
            ResponseCookie accessCookie = jwtUtil.generateJwtCookie(newAccessToken);
            ResponseCookie refreshCookie = jwtUtil.generateRefreshTokenCookie(newRefreshToken.getToken());

            return ResponseEntity.ok()
                    .header(HttpHeaders.SET_COOKIE, accessCookie.toString())
                    .header(HttpHeaders.SET_COOKIE, refreshCookie.toString())
                    .body(Map.of("message", "Token refreshed successfully"));

        } catch (TokenRefreshException ex) {
            log.error("Token refresh failed: {}", ex.getMessage());
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", ex.getMessage()));
        }
    }

    private String extractRefreshTokenFromCookies(HttpServletRequest request) {
        if (request.getCookies() == null)
            return null;
        for (Cookie cookie : request.getCookies()) {
            if ("refreshToken".equalsIgnoreCase(cookie.getName())) {
                return cookie.getValue();
            }
        }
        return null;
    }

    @PostMapping("/logout")
    public ResponseEntity<Map<String, String>> logout(HttpServletRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        // Revoke all refresh tokens for user if authenticated
        if (userDetails != null) {
            try {
                User user = userService.findUserEntityByUsername(userDetails.getUsername())
                        .orElseThrow(() -> new RuntimeException("User not found"));
                refreshTokenService.revokeAllUserTokens(user);
                log.info("Revoked all refresh tokens for user: {}", userDetails.getUsername());
            } catch (Exception ex) {
                log.error("Error revoking tokens during logout: {}", ex.getMessage());
            }
        }

        // Clear both cookies
        ResponseCookie cleanJwtCookie = jwtUtil.getCleanJwtCookie();
        ResponseCookie cleanRefreshCookie = jwtUtil.getCleanRefreshTokenCookie();

        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, cleanJwtCookie.toString())
                .header(HttpHeaders.SET_COOKIE, cleanRefreshCookie.toString())
                .body(Map.of("message", "Logged out successfully"));
    }
}
