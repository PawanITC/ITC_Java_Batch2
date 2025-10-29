package com.learning.tribetalk.config;

import com.learning.tribetalk.security.JwtAuthenticationFilter;
import com.learning.tribetalk.security.JwtUtil;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
public class SecurityConfig {

    private final JwtUtil jwtUtil;
    private final UserDetailsService userDetailsService;

    public SecurityConfig(JwtUtil jwtUtil, UserDetailsService userDetailsService) {
        this.jwtUtil = jwtUtil;
        this.userDetailsService = userDetailsService;
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity httpSecurity) throws Exception{
        var jwtFilter = new JwtAuthenticationFilter(jwtUtil, userDetailsService);

        httpSecurity
                .csrf(csrf -> csrf.disable())
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/auth/**").permitAll()
                        .requestMatchers("/h2-console/**").permitAll()
                        .requestMatchers(
                                "/swagger-ui.html",
                                "/swagger-ui/**",
                                "/v3/api-docs/**",
                                "/v3/api-docs.yaml",
                                "/v3/api-docs.json"
                        ).permitAll()
                        .requestMatchers(
                                "/",
                                "/index.html",
                                "/favicon.ico",
                                "/manifest.json",
                                "/static/**",
                                "/assets/**"
                        ).permitAll()
                        //.requestMatchers("/").permitAll()
                        .anyRequest().authenticated());
        // Allow frames for H2 cons



        // allow frames for H2 console (dev only)
        httpSecurity.headers(headers -> headers.frameOptions(frame -> frame.disable()));

        // add JWT filter BEFORE UsernamePasswordAuthenticationFilter so it runs for other endpoints
        httpSecurity.addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class);
        return httpSecurity.build();
    }


}
