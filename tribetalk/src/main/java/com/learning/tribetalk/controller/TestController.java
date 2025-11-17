package com.learning.tribetalk.controller;

import com.learning.tribetalk.dto.NotificationDTO;
import com.learning.tribetalk.dto.NotificationEvent;
import com.learning.tribetalk.entity.NotificationType;
import com.learning.tribetalk.service.NotificationProducer;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.time.LocalDateTime;
import java.util.UUID;

@RestController
@RequestMapping("/api/test")
public class TestController {

    private final NotificationProducer notificationProducer;


    public TestController(NotificationProducer notificationProducer) {
        this.notificationProducer = notificationProducer;
    }

    @PostMapping("/send-notification")
    public ResponseEntity<NotificationDTO> sendTestNotification(@RequestBody NotificationDTO notificationRequest){
        NotificationDTO event = NotificationDTO.builder()
                .recipientId(notificationRequest.getRecipientId()) // random recipient
                .actorId(notificationRequest.getActorId())
                .type(notificationRequest.getType())
                .resourceId(notificationRequest.getResourceId())
                .createdAt(Instant.now())
                .build();
        notificationProducer.sendNotification(event);
        return ResponseEntity.ok().body(event);
    }
}
