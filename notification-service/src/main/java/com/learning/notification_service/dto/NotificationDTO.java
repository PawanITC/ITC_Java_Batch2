package com.learning.notification_service.dto;

import com.learning.notification_service.entity.NotificationType;
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
    private String actorDisplayName;
    private NotificationType type;
    private String resourceId;
    private Instant createdAt;
    private String payload;
    private boolean readStatus;

}
