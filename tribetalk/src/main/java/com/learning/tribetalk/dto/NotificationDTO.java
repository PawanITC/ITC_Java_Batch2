package com.learning.tribetalk.dto;

import com.learning.tribetalk.entity.NotificationType;
import lombok.*;

import java.time.Instant;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@ToString
public class NotificationDTO {
    private String id;
    private String actorId;
    private String recipientId;
    private String actorUsername;
    private String actorProfileImage;
    private NotificationType type;
    private String resourceId;
    private Instant createdAt;
    private boolean readStatus;

}
