package com.learning.tribetalk.dto.response;

import java.time.Instant;

public record UserProfileResponse(

        Long userId,
        String displayName,

        String bio,
        String location,

        String profilePictureUrl,
        String coverPictureUrl,

        Instant createdAt
) {}
