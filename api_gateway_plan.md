# API Gateway Implementation Plan for TribeTalk

## Overview

Implement **Spring Cloud Gateway** as a centralized API Gateway to route requests to TribeTalk microservices (tribetalk, chatservice, notification-service).

**Benefits**:
- Single entry point for all API requests
- Centralized authentication & authorization
- Rate limiting & throttling
- Request/response transformation
- Load balancing
- Circuit breaking
- Monitoring & logging

---

## Current Architecture vs Target Architecture

### Current (Without Gateway)
```
┌─────────┐
│ Client  │
└────┬────┘
     │
     ▼
┌─────────────┐
│   Ingress   │ (ALB)
└──────┬──────┘
       │
       ├──────────────┬──────────────┬────────────────┐
       ▼              ▼              ▼                ▼
  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐
  │tribetalk │  │chatservice│  │notification│  │frontend │
  │  :8080   │  │  :8081   │  │  :8082    │  │  :80    │
  └──────────┘  └──────────┘  └──────────┘  └──────────┘
```

### Target (With API Gateway)
```
┌─────────┐
│ Client  │
└────┬────┘
     │
     ▼
┌─────────────┐
│   Ingress   │ (ALB)
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────────────┐
│          API Gateway (:8090)            │
│  - Authentication                       │
│  - Rate Limiting                        │
│  - Request Routing                      │
│  - Circuit Breaking                     │
└──────┬──────────────┬──────────────┬───┘
       │              │              │
       ▼              ▼              ▼
  ┌──────────┐  ┌──────────┐  ┌──────────┐
  │tribetalk │  │chatservice│  │notification│
  │  :8080   │  │  :8081   │  │  :8082    │
  └──────────┘  └──────────┘  └──────────┘
```

---

## Implementation Steps

### Phase 1: Create API Gateway Service

#### 1.1 Initialize Spring Cloud Gateway Project

**Create new module**: `api-gateway`

```bash
cd /path/to/ITC_Java_Batch2
mkdir api-gateway
cd api-gateway
```

**pom.xml**:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 
         http://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>
    
    <parent>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-parent</artifactId>
        <version>3.5.6</version>
        <relativePath/>
    </parent>
    
    <groupId>com.learning</groupId>
    <artifactId>api-gateway</artifactId>
    <version>1.0.0</version>
    <name>TribeTalk API Gateway</name>
    
    <properties>
        <java.version>21</java.version>
        <spring-cloud.version>2024.0.0</spring-cloud.version>
    </properties>
    
    <dependencies>
        <!-- Spring Cloud Gateway -->
        <dependency>
            <groupId>org.springframework.cloud</groupId>
            <artifactId>spring-cloud-starter-gateway</artifactId>
        </dependency>
        
        <!-- Redis for rate limiting -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-data-redis-reactive</artifactId>
        </dependency>
        
        <!-- Circuit Breaker -->
        <dependency>
            <groupId>org.springframework.cloud</groupId>
            <artifactId>spring-cloud-starter-circuitbreaker-reactor-resilience4j</artifactId>
        </dependency>
        
        <!-- Actuator for monitoring -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-actuator</artifactId>
        </dependency>
        
        <!-- JWT for authentication -->
        <dependency>
            <groupId>io.jsonwebtoken</groupId>
            <artifactId>jjwt-api</artifactId>
            <version>0.12.6</version>
        </dependency>
        <dependency>
            <groupId>io.jsonwebtoken</groupId>
            <artifactId>jjwt-impl</artifactId>
            <version>0.12.6</version>
            <scope>runtime</scope>
        </dependency>
        <dependency>
            <groupId>io.jsonwebtoken</groupId>
            <artifactId>jjwt-jackson</artifactId>
            <version>0.12.6</version>
            <scope>runtime</scope>
        </dependency>
        
        <dependency>
            <groupId>org.projectlombok</groupId>
            <artifactId>lombok</artifactId>
            <optional>true</optional>
        </dependency>
    </dependencies>
    
    <dependencyManagement>
        <dependencies>
            <dependency>
                <groupId>org.springframework.cloud</groupId>
                <artifactId>spring-cloud-dependencies</artifactId>
                <version>${spring-cloud.version}</version>
                <type>pom</type>
                <scope>import</scope>
            </dependency>
        </dependencies>
    </dependencyManagement>
    
    <build>
        <plugins>
            <plugin>
                <groupId>org.springframework.boot</groupId>
                <artifactId>spring-boot-maven-plugin</artifactId>
            </plugin>
        </plugins>
    </build>
</project>
```

#### 1.2 Main Application Class

**ApiGatewayApplication.java**:
```java
package com.learning.apigateway;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class ApiGatewayApplication {
    public static void main(String[] args) {
        SpringApplication.run(ApiGatewayApplication.class, args);
    }
}
```

---

### Phase 2: Configure Routes

#### 2.1 application.yml Configuration

```yaml
server:
  port: 8090

spring:
  application:
    name: api-gateway
    
  cloud:
    gateway:
      # Global CORS configuration
      globalcors:
        cors-configurations:
          '[/**]':
            allowed-origins: 
              - "${FRONTEND_URL:http://localhost:5173}"
              - "${FRONTEND_URL_PROD:http://k8s-default-tribetal-089de13287-2075252521.eu-north-1.elb.amazonaws.com}"
            allowed-methods:
              - GET
              - POST
              - PUT
              - DELETE
              - OPTIONS
            allowed-headers: "*"
            allow-credentials: true
            max-age: 3600
      
      # Route definitions
      routes:
        # TribeTalk Service Routes
        - id: tribetalk-service
          uri: ${TRIBETALK_SERVICE_URL:http://tribetalk:8080}
          predicates:
            - Path=/api/users/**, /api/posts/**, /api/follow/**, /api/auth/**
          filters:
            - name: CircuitBreaker
              args:
                name: tribetalkCircuitBreaker
                fallbackUri: forward:/fallback/tribetalk
            - name: RequestRateLimiter
              args:
                redis-rate-limiter.replenishRate: 10
                redis-rate-limiter.burstCapacity: 20
                redis-rate-limiter.requestedTokens: 1
            - StripPrefix=0
        
        # ChatService Routes
        - id: chat-service
          uri: ${CHATSERVICE_URL:http://chatservice:8081}
          predicates:
            - Path=/api/chat/**
          filters:
            - name: CircuitBreaker
              args:
                name: chatCircuitBreaker
                fallbackUri: forward:/fallback/chat
            - name: RequestRateLimiter
              args:
                redis-rate-limiter.replenishRate: 20
                redis-rate-limiter.burstCapacity: 40
                redis-rate-limiter.requestedTokens: 1
            - StripPrefix=0
        
        # Notification Service Routes
        - id: notification-service
          uri: ${NOTIFICATION_SERVICE_URL:http://notification-service:8082}
          predicates:
            - Path=/notification/**
          filters:
            - name: CircuitBreaker
              args:
                name: notificationCircuitBreaker
                fallbackUri: forward:/fallback/notification
            - StripPrefix=0
        
        # WebSocket Routes (for chat)
        - id: websocket-chat
          uri: ${CHATSERVICE_WS_URL:ws://chatservice:8081}
          predicates:
            - Path=/chat/**
          filters:
            - StripPrefix=0
        
        # WebSocket Routes (for notifications)
        - id: websocket-notification
          uri: ${NOTIFICATION_WS_URL:ws://notification-service:8082}
          predicates:
            - Path=/ws/**
          filters:
            - StripPrefix=0
      
      # Default filters applied to all routes
      default-filters:
        - name: Retry
          args:
            retries: 3
            statuses: BAD_GATEWAY,SERVICE_UNAVAILABLE
            methods: GET,POST
            backoff:
              firstBackoff: 50ms
              maxBackoff: 500ms
              factor: 2
              basedOnPreviousValue: false
        - AddResponseHeader=X-Response-Time, ${responseTime}
        - AddResponseHeader=X-Gateway-Version, 1.0

  # Redis configuration for rate limiting
  redis:
    host: ${SPRING_REDIS_HOST:localhost}
    port: 6379

# Resilience4j Circuit Breaker configuration
resilience4j:
  circuitbreaker:
    instances:
      tribetalkCircuitBreaker:
        sliding-window-size: 10
        failure-rate-threshold: 50
        wait-duration-in-open-state: 10000
        permitted-number-of-calls-in-half-open-state: 3
        automatic-transition-from-open-to-half-open-enabled: true
      chatCircuitBreaker:
        sliding-window-size: 10
        failure-rate-threshold: 50
        wait-duration-in-open-state: 10000
      notificationCircuitBreaker:
        sliding-window-size: 10
        failure-rate-threshold: 50
        wait-duration-in-open-state: 10000

# JWT configuration
jwt:
  secret: ${JWT_SECRET:change_this_to_a_long_random_secret_with_min_256_bits}

# Actuator endpoints
management:
  endpoints:
    web:
      exposure:
        include: health,info,gateway,metrics
  endpoint:
    gateway:
      enabled: true
    health:
      show-details: always
```

---

### Phase 3: Implement Authentication Filter

#### 3.1 JWT Authentication Filter

**JwtAuthenticationFilter.java**:
```java
package com.learning.apigateway.filter;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cloud.gateway.filter.GatewayFilter;
import org.springframework.cloud.gateway.filter.factory.AbstractGatewayFilterFactory;
import org.springframework.http.HttpCookie;
import org.springframework.http.HttpStatus;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.http.server.reactive.ServerHttpResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.security.Key;
import java.util.List;

@Component
@Slf4j
public class JwtAuthenticationFilter extends AbstractGatewayFilterFactory<JwtAuthenticationFilter.Config> {

    @Value("${jwt.secret}")
    private String jwtSecret;

    public JwtAuthenticationFilter() {
        super(Config.class);
    }

    @Override
    public GatewayFilter apply(Config config) {
        return (exchange, chain) -> {
            ServerHttpRequest request = exchange.getRequest();
            
            // Skip authentication for public endpoints
            if (isPublicEndpoint(request.getPath().toString())) {
                return chain.filter(exchange);
            }

            // Extract JWT from cookie
            String token = extractTokenFromCookie(request);
            
            if (token == null || !validateToken(token)) {
                ServerHttpResponse response = exchange.getResponse();
                response.setStatusCode(HttpStatus.UNAUTHORIZED);
                return response.setComplete();
            }

            // Add user info to request headers
            Claims claims = extractClaims(token);
            ServerHttpRequest modifiedRequest = request.mutate()
                    .header("X-User-Id", claims.getSubject())
                    .header("X-User-Roles", claims.get("roles", String.class))
                    .build();

            return chain.filter(exchange.mutate().request(modifiedRequest).build());
        };
    }

    private boolean isPublicEndpoint(String path) {
        List<String> publicPaths = List.of(
            "/api/auth/login",
            "/api/auth/refresh",
            "/api/users/save",
            "/actuator/health"
        );
        return publicPaths.stream().anyMatch(path::startsWith);
    }

    private String extractTokenFromCookie(ServerHttpRequest request) {
        HttpCookie cookie = request.getCookies().getFirst("jwt");
        return cookie != null ? cookie.getValue() : null;
    }

    private boolean validateToken(String token) {
        try {
            Key key = Keys.hmacShaKeyFor(jwtSecret.getBytes());
            Jwts.parserBuilder()
                .setSigningKey(key)
                .build()
                .parseClaimsJws(token);
            return true;
        } catch (Exception e) {
            log.error("JWT validation failed: {}", e.getMessage());
            return false;
        }
    }

    private Claims extractClaims(String token) {
        Key key = Keys.hmacShaKeyFor(jwtSecret.getBytes());
        return Jwts.parserBuilder()
                .setSigningKey(key)
                .build()
                .parseClaimsJws(token)
                .getBody();
    }

    public static class Config {
        // Configuration properties if needed
    }
}
```

---

### Phase 4: Implement Fallback Controllers

**FallbackController.java**:
```java
package com.learning.apigateway.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/fallback")
public class FallbackController {

    @GetMapping("/tribetalk")
    public ResponseEntity<Map<String, String>> tribetalkFallback() {
        return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                .body(Map.of(
                    "error", "TribeTalk service is currently unavailable",
                    "message", "Please try again later"
                ));
    }

    @GetMapping("/chat")
    public ResponseEntity<Map<String, String>> chatFallback() {
        return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                .body(Map.of(
                    "error", "Chat service is currently unavailable",
                    "message", "Please try again later"
                ));
    }

    @GetMapping("/notification")
    public ResponseEntity<Map<String, String>> notificationFallback() {
        return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                .body(Map.of(
                    "error", "Notification service is currently unavailable",
                    "message", "Please try again later"
                ));
    }
}
```

---

### Phase 5: Custom Rate Limiter (Optional)

**UserKeyResolver.java** - Rate limit by user:
```java
package com.learning.apigateway.config;

import org.springframework.cloud.gateway.filter.ratelimit.KeyResolver;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import reactor.core.publisher.Mono;

@Configuration
public class RateLimiterConfig {

    @Bean
    public KeyResolver userKeyResolver() {
        return exchange -> {
            // Rate limit by user (from JWT)
            String userId = exchange.getRequest().getHeaders().getFirst("X-User-Id");
            return Mono.just(userId != null ? userId : exchange.getRequest().getRemoteAddress().getAddress().getHostAddress());
        };
    }
}
```

---

### Phase 6: Kubernetes Deployment

#### 6.1 Dockerfile

**api-gateway/Dockerfile**:
```dockerfile
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /app
COPY pom.xml .
RUN mvn dependency:go-offline
COPY src ./src
RUN mvn clean package -DskipTests

FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
RUN addgroup -g 1001 appuser && adduser -D -u 1001 -G appuser appuser
COPY --from=build /app/target/*.jar app.jar
RUN chown -R appuser:appuser /app
USER appuser
EXPOSE 8090
ENTRYPOINT ["java", "-jar", "app.jar"]
```

#### 6.2 Kubernetes Deployment

**k8s/deployments/api-gateway.yaml**:
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: api-gateway
  labels:
    app: api-gateway
spec:
  replicas: 2
  selector:
    matchLabels:
      app: api-gateway
  template:
    metadata:
      labels:
        app: api-gateway
    spec:
      serviceAccountName: tribetalk-sa
      containers:
      - name: api-gateway
        image: 430006376054.dkr.ecr.eu-north-1.amazonaws.com/api-gateway:v1.0
        imagePullPolicy: Always
        ports:
        - containerPort: 8090
        env:
        - name: SPRING_REDIS_HOST
          valueFrom:
            secretKeyRef:
              name: tribetalk-database-secrets
              key: redis_host
        - name: JWT_SECRET
          valueFrom:
            secretKeyRef:
              name: tribetalk-app-secrets
              key: jwt_secret
        - name: TRIBETALK_SERVICE_URL
          value: "http://tribetalk:8080"
        - name: CHATSERVICE_URL
          value: "http://chatservice:8081"
        - name: NOTIFICATION_SERVICE_URL
          value: "http://notification-service:8082"
        - name: CHATSERVICE_WS_URL
          value: "ws://chatservice:8081"
        - name: NOTIFICATION_WS_URL
          value: "ws://notification-service:8082"
        - name: FRONTEND_URL_PROD
          value: "http://k8s-default-tribetal-089de13287-2075252521.eu-north-1.elb.amazonaws.com"
        livenessProbe:
          httpGet:
            path: /actuator/health/liveness
            port: 8090
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /actuator/health/readiness
            port: 8090
          initialDelaySeconds: 20
          periodSeconds: 5
        resources:
          requests:
            memory: "512Mi"
            cpu: "250m"
          limits:
            memory: "1Gi"
            cpu: "500m"
---
apiVersion: v1
kind: Service
metadata:
  name: api-gateway
spec:
  selector:
    app: api-gateway
  ports:
  - protocol: TCP
    port: 8090
    targetPort: 8090
  type: ClusterIP
```

#### 6.3 Update Ingress

**k8s/ingress.yaml** - Route all API traffic through gateway:
```yaml
# Update ingress to route to API Gateway instead of individual services
- path: /api
  pathType: Prefix
  backend:
    service:
      name: api-gateway
      port:
        number: 8090
- path: /chat
  pathType: Prefix
  backend:
    service:
      name: api-gateway
      port:
        number: 8090
- path: /ws
  pathType: Prefix
  backend:
    service:
      name: api-gateway
      port:
        number: 8090
- path: /notification
  pathType: Prefix
  backend:
    service:
      name: api-gateway
      port:
        number: 8090
```

---

## Implementation Checklist

### Phase 1: Setup (2-3 hours)
- [ ] Create api-gateway module
- [ ] Add dependencies (pom.xml)
- [ ] Create main application class
- [ ] Configure application.yml with routes

### Phase 2: Authentication (2 hours)
- [ ] Implement JWT authentication filter
- [ ] Configure public endpoints
- [ ] Test authentication flow

### Phase 3: Advanced Features (2-3 hours)
- [ ] Implement rate limiting
- [ ] Configure circuit breakers
- [ ] Add fallback controllers
- [ ] Configure CORS

### Phase 4: Testing (2 hours)
- [ ] Test routing to all services
- [ ] Test authentication
- [ ] Test rate limiting
- [ ] Test circuit breaker
- [ ] Test WebSocket routing

### Phase 5: Deployment (1-2 hours)
- [ ] Build Docker image
- [ ] Create Kubernetes deployment
- [ ] Update ingress configuration
- [ ] Deploy to cluster
- [ ] Verify all routes work

---

## Benefits Summary

✅ **Single Entry Point**: All API requests go through gateway  
✅ **Centralized Auth**: JWT validation in one place  
✅ **Rate Limiting**: Protect services from abuse  
✅ **Circuit Breaking**: Prevent cascade failures  
✅ **Load Balancing**: Distribute traffic across instances  
✅ **Monitoring**: Centralized metrics and logging  
✅ **CORS**: Simplified cross-origin configuration  
✅ **Retry Logic**: Automatic retry for failed requests  

---

## Estimated Effort

**Total**: 9-12 hours

- Setup & Configuration: 2-3 hours
- Authentication Implementation: 2 hours
- Advanced Features: 2-3 hours
- Testing: 2 hours
- Deployment: 1-2 hours
- Documentation: 1 hour
