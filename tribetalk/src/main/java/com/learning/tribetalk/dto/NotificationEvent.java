package com.learning.tribetalk.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class NotificationEvent {
    private String fromUserId;
    private String toUserId;
    private String tweetId;
    private Instant createdAt;
    private String message;
    private String type;
}
