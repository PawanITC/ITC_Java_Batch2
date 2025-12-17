package com.learning.tribetalk.controller;

import com.learning.tribetalk.dto.NotificationDTO;
import com.learning.tribetalk.service.NotificationProducer;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * REST controller for notification management.
 * Provides endpoints for sending notifications via Kafka.
 */
@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    private static final Logger log = LoggerFactory.getLogger(NotificationController.class);
    
    private final NotificationProducer notificationProducer;

    public NotificationController(NotificationProducer notificationProducer) {
        this.notificationProducer = notificationProducer;
    }

    /**
     * Send a notification to a specific user.
     * The notification will be published to Kafka and then broadcast via WebSocket.
     */
    @PostMapping("/send")
    public ResponseEntity<String> sendNotification(@RequestBody NotificationDTO notification) {
        try {
            log.info("Sending notification via API: type={}, recipientId={}", 
                    notification.getType(), notification.getRecipientId());
            
            notificationProducer.sendNotification(notification);
            
            return ResponseEntity.ok("Notification sent successfully");
        } catch (Exception e) {
            log.error("Error sending notification", e);
            return ResponseEntity.internalServerError()
                    .body("Failed to send notification: " + e.getMessage());
        }
    }

    /**
     * Health check endpoint for WebSocket connectivity.
     */
    @GetMapping("/health")
    public ResponseEntity<String> health() {
        return ResponseEntity.ok("Notification service is running");
    }
}
