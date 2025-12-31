package com.learning.tribetalk.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;

import java.time.Instant;
import java.util.List;
import java.util.Set;

public record PostCreateRequest(
        @NotNull(message = "User ID is required")
        Long userId,
        @NotBlank(message = "Post text cannot be blank")
        String text,
        @FutureOrPresent(message = "Scheduled time must be in the future or present")
        Instant scheduledAt,
        @NotBlank(message = "Visibility is required")
        String visibility,
        @NotBlank(message = "Reply permission is required")
        String replyPermission,
        @Valid
        List<@NotBlank(message = "Hashtag cannot be blank") String> hashtags,
        @Valid
        List<@NotBlank(message = "Mention cannot be blank") String> mentions,
        @Valid
        List<@NotBlank(message = "URL cannot be blank") String> urls,
        @Valid
        List<MediaDTO> mediaList,
        @Valid
        PollDTO poll,
        String replyToPostId,
        String replyToUsername,
        Set<Long> likedBy,
        Set<Long> bookmarkedBy) {

    public record MediaDTO(
            @NotBlank(message = "Media URL cannot be blank")
            String url,
            @NotBlank(message = "Media type is required")
            String type
    ) {
    }

    public record PollDTO(
            @Size(min = 2, message = "Poll must have at least two options")
            List<@Valid PollOptionDTO> options,
            @Future(message = "Poll expiration must be in the future")
            Instant expiresAt
    ) {
    }

    public record PollOptionDTO(
            @NotBlank(message = "Poll option cannot be blank")
            String option,
            @Min(value = 0, message = "Votes must be zero or positive")
            int votes
    ) {
    }

}
