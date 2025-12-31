package com.learning.tribetalk.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;
import java.util.stream.Collectors;

public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtUtil jwtUtil;
    private final UserDetailsService userDetailsService;
    private static final Logger log = LoggerFactory.getLogger(JwtAuthenticationFilter.class);

    public JwtAuthenticationFilter(JwtUtil jwtUtil, UserDetailsService userDetailsService) {
        this.jwtUtil = jwtUtil;
        this.userDetailsService = userDetailsService;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain) throws ServletException, IOException {

        final String token = extractFromCookies(request);

        log.info("=== JWT Authentication Debug ===");
        log.info("Request URI: {}", request.getRequestURI());
        log.info("JWT token extracted: {}", token != null ? "YES (length: " + token.length() + ")" : "NO");

        try {
            if (token == null) {
                log.info("No JWT token found in cookies");
                filterChain.doFilter(request, response);
                return;
            }

            String username = jwtUtil.extractUsername(token);
            log.info("Username extracted from token: {}", username);

            if (username != null && SecurityContextHolder.getContext().getAuthentication() == null) {
                boolean isValid = jwtUtil.isTokenValid(token, username);
                log.info("Token valid for user '{}': {}", username, isValid);

                if (isValid) {
                    // Option A: load userDetails from DB (preferred)
                    var userDetails = userDetailsService.loadUserByUsername(username);
                    log.info("UserDetails loaded for: {}", username);

                    var authorities = userDetails.getAuthorities();

                    var authToken = new UsernamePasswordAuthenticationToken(
                            userDetails, null, authorities);
                    SecurityContextHolder.getContext().setAuthentication(authToken);
                    log.info("✅ Authentication set for user: {}", username);
                } else {
                    log.warn("Token validation failed for user: {}", username);
                }
            } else if (username == null) {
                log.warn("Username is null - token might be malformed");
            } else {
                log.info("User already authenticated or username is null");
            }
        } catch (Exception ex) {
            log.error("❌ JWT authentication failed: {}", ex.getMessage(), ex);
            // optionally set response status or continue as anonymous
        }

        log.info("================================");
        filterChain.doFilter(request, response);
    }

    private String extractFromCookies(HttpServletRequest request) {
        if (request.getCookies() == null)
            return null;
        for (Cookie cookie : request.getCookies()) {
            if ("jwt".equalsIgnoreCase(cookie.getName())) {
                return cookie.getValue();
            }
        }
        return null;
    }
}
