package com.learning.notification_service.service;

import com.learning.notification_service.dto.UserResponse;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

@Service
public class UserClient {

    private final WebClient webClient;

    public UserClient(WebClient.Builder builder) {
        // Use Kubernetes service name instead of localhost for inter-service
        // communication
        String baseUrl = System.getenv().getOrDefault("USER_SERVICE_URL", "http://tribetalk:8080/api/users");
        this.webClient = builder.baseUrl(baseUrl).build();
    }

    public UserResponse getUserById(String userId) {
        try {
            return webClient.get()
                    .uri("/{id}", userId)
                    .retrieve()
                    .bodyToMono(UserResponse.class)
                    .block();
        } catch (Exception e) {
            System.out.println("Exception while accessing user via WebClient " + e.getMessage());
        }
        return null;
    }

}
