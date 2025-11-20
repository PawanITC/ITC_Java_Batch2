package com.learning.tribetalk.entity.mongo;

import com.learning.tribetalk.entity.NotificationType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

@Document(collection = "notifications")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Notification {
    @Id
    private String id;

    @Indexed
    private String recipientId;
    private String actorId;
    private String payload;
    private String resourceId;
    private NotificationType type;
    @Builder.Default
    private Instant createdAt = Instant.now();
    @Builder.Default
    private boolean readStatus = false;
}
