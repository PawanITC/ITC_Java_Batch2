package com.learning.tribetalk.service;

import com.learning.tribetalk.dto.NotificationDTO;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

/**
 * Kafka consumer that listens to notification events and broadcasts them
 * to WebSocket clients via STOMP messaging.
 */
@Service
public class NotificationConsumer {

    private static final Logger log = LoggerFactory.getLogger(NotificationConsumer.class);
    
    private final SimpMessagingTemplate messagingTemplate;

    public NotificationConsumer(SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }

    /**
     * Consumes notification events from Kafka and broadcasts them to WebSocket subscribers.
     * Each notification is sent to a user-specific topic: /topic/notifications/{recipientId}
     */
    @KafkaListener(topics = "notifications-topic", groupId = "notification-consumer-group")
    public void consumeNotification(NotificationDTO notification) {
        try {
            log.info("Received notification from Kafka: type={}, recipientId={}", 
                    notification.getType(), notification.getRecipientId());
            
            // Send notification to the specific user's WebSocket topic
            String destination = "/topic/notifications/" + notification.getRecipientId();
            messagingTemplate.convertAndSend(destination, notification);
            
            log.info("Notification sent to WebSocket topic: {}", destination);
        } catch (Exception e) {
            log.error("Error processing notification", e);
        }
    }
}
