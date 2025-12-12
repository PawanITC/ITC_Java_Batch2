package com.learning.tribetalk.controller;

import com.learning.tribetalk.dto.response.UserResponse;
import com.learning.tribetalk.security.JwtUtil;
import com.learning.tribetalk.service.postgres.UserService;
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

    public AuthController(AuthenticationManager authenticationManager,
            UserDetailsService userDetailsService,
            JwtUtil jwtUtil,
            UserService userService) {
        this.authenticationManager = authenticationManager;
        this.userDetailsService = userDetailsService;
        this.jwtUtil = jwtUtil;
        this.userService = userService;
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

            String token = jwtUtil.generateToken(request.username(), roles);
            ResponseCookie cookie = jwtUtil.generateJwtCookie(token);
            Optional<UserResponse> userResponse = userService.findByUsername(request.username());
            return userResponse
                    .map(value -> ResponseEntity.ok().header(HttpHeaders.SET_COOKIE, cookie.toString())
                            .body(new AuthResponse(value.username(), value.id())))
                    .orElseGet(() -> ResponseEntity.badRequest().body(new AuthResponse("", 0L)));

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

    @PostMapping("/logout")
    public ResponseEntity<Map<String, String>> logout(HttpServletResponse response) {
        ResponseCookie cookie = jwtUtil.getCleanJwtCookie();
        return ResponseEntity.ok().header(HttpHeaders.SET_COOKIE, cookie.toString())
                .body(Map.of("message", "Logged out successfully"));
    }
}
