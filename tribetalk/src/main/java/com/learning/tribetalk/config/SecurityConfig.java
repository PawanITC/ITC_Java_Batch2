package com.learning.tribetalk.config;

import com.learning.tribetalk.security.JwtAuthenticationFilter;
import com.learning.tribetalk.security.JwtUtil;
import com.learning.tribetalk.security.OAuth2LoginSuccessHandler;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpHeaders;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.filter.CorsFilter;

import java.util.Arrays;

@Configuration
public class SecurityConfig {

    @Value("${app.url}")
    private String url;

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
                .sessionManagement(session -> session
                        .sessionCreationPolicy(SessionCreationPolicy.STATELESS)  // ADD THIS
                )
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


    @Bean
    public CorsFilter corsFilter(){
        CorsConfiguration corsConfig=new CorsConfiguration();
        corsConfig.setAllowedOrigins(Arrays.asList(url));
        corsConfig.setAllowedMethods(Arrays.asList("GET","POST","PUT","PATCH","DELETE"));
        corsConfig.setAllowCredentials(true);
        corsConfig.setAllowedHeaders(Arrays.asList("*"));
        corsConfig.setExposedHeaders(Arrays.asList("Authorization", "Content-Type"));
        UrlBasedCorsConfigurationSource source=new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**",corsConfig);
        return new CorsFilter(source);
    }
}
