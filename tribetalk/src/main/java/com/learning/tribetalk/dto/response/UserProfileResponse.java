package com.learning.tribetalk.dto.response;

public record UserProfileResponse(
        Long userId,
        String username,
        String displayName,
        String bio,
        String location,
        String profilePicture,
        String coverPicture
) {}