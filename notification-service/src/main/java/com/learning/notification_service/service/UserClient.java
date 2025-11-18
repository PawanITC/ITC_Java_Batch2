package com.learning.notification_service.service;

import com.learning.notification_service.dto.UserResponse;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

@Service
public class UserClient {

    private final WebClient webClient;


    public UserClient(WebClient.Builder builder) {
        this.webClient = builder.baseUrl("http://localhost:8080/api/users").build();
    }

    public UserResponse getUserById(String userId){
        try{
            return webClient.get()
                    .uri("/{id}",userId)
                    .retrieve()
                    .bodyToMono(UserResponse.class)
                    .block();
        }
        catch (Exception e){
            System.out.println("Exception while accessing user via WebClient "+e.getMessage());
        }
        return null;
    }

}
