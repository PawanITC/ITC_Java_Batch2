package com.learning.tribetalk.dto.request;

public record UserProfileRequest(
        String bio,
        String location,
        String profilePicture,
        String coverPicture
) {}
