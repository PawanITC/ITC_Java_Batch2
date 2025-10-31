package com.learning.tribetalk.config;

import com.learning.tribetalk.security.JwtAuthenticationFilter;
import com.learning.tribetalk.security.JwtUtil;
import com.learning.tribetalk.security.OAuth2LoginSuccessHandler;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
public class SecurityConfig {
    @Autowired
    OAuth2LoginSuccessHandler oAuth2LoginSuccessHandler;
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
                        .requestMatchers("/api/users/**").permitAll()
                        .requestMatchers("/h2-console/**").permitAll()
                        .requestMatchers("oauth2/**").permitAll()
                        .requestMatchers("/actuator/prometheus").permitAll()  // allow Prometheus
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
                        .anyRequest().authenticated())
                .oauth2Login(oAuth2->{
                        oAuth2.successHandler(oAuth2LoginSuccessHandler);
                });
        // Allow frames for H2 cons



        // allow frames for H2 console (dev only)
        httpSecurity.headers(headers -> headers.frameOptions(frame -> frame.disable()));

        // add JWT filter BEFORE UsernamePasswordAuthenticationFilter so it runs for other endpoints
        httpSecurity.addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class);
        return httpSecurity.build();
    }


}
