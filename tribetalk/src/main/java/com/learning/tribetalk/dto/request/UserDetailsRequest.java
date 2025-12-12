package com.learning.tribetalk.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.FutureOrPresent;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import org.springframework.data.mongodb.core.index.Indexed;

import java.time.Instant;
import java.util.List;

public record UserDetailsRequest (
    @NotNull(message = "User ID is required")
    Long userId,
    @NotNull(message = "User DisplayName is required")
    String displayname,
    @NotNull(message = "Username is required")
    String username,
    String bio,
    String location,
    String userProfilePicture,
    String userCoverPicture ){
}
