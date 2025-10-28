package com.learning.tribetalk.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
public class SecurityConfig {

    @Bean
    public PasswordEncoder passwordEncoder(){
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity httpSecurity) throws Exception{
        httpSecurity
                .csrf(csrf->csrf.disable())
                .authorizeHttpRequests(auth->auth
                        .requestMatchers("/api/users/**").permitAll()
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
                        .requestMatchers("/", "/**").permitAll()
                        .anyRequest().authenticated())
                            // Allow frames for H2 console
                            .headers(headers -> headers.frameOptions(frame -> frame.disable()));;
        /*httpSecurity
                .csrf(csrf -> csrf.disable())   // Disable CSRF if you use REST/API
                .authorizeHttpRequests(auth -> auth
                        .anyRequest().permitAll()   // Permit all requests
                );*/

        return httpSecurity.build();
    }

}
