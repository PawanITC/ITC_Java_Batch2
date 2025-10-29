package com.learning.tribetalk.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record RegistrationRequest(
        @NotBlank(message = "Username is required")
        @Size(min = 3,max = 40,message = "Username must be between 3 to 40 chars")
        String username,
        @NotBlank(message = "Email is required")
        @Email(message = "Invalid email format")
        String email,
        @NotBlank(message = "Password is required")
        @Size(min = 6, message = "Password must be min 6 chars")
        String password) {

}
