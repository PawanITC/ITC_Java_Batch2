package com.learning.tribetalk.dto;

import java.time.Instant;
import java.util.List;

public record PostResponse(String id,
                           Long userId,
                           String text,
                           Instant scheduledAt,
                           String visibility,
                           String replyPermission,
                           List<String> hashtags,
                           List<String> mentions,
                           List<String> urls,
                           MediaDTO media,
                           PollDTO poll,
                           int likeCount,
                           int viewCount,
                           Instant createdAt) {
    public record MediaDTO(String url, String type) {
    }

    public record PollDTO(List<PollOptionDTO> options, Instant expiresAt, Integer totalVotes) {
    }

    public record PollOptionDTO(String option, int votes, double percentage) {
    }
}
