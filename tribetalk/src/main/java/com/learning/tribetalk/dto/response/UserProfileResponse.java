package com.learning.tribetalk.dto.response;

import java.time.Instant;

public record UserProfileResponse(
        Long userId,
        String username,
        String displayName,
        String bio,
        String location,
        String profileImageUrl,
        String coverImageUrl,
        Instant createdAt
) {}
