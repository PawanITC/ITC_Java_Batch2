package com.learning.notification_service.service;

import com.learning.notification_service.dto.NotificationDTO;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.annotation.RetryableTopic;
import org.springframework.retry.annotation.Backoff;
import org.springframework.stereotype.Service;

@Slf4j
@Service
public class NotificationConsumer {

    private final NotificationService notificationService;

    public NotificationConsumer(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @KafkaListener(topics = "notifications-topic", groupId = "notification-group")
    @RetryableTopic(attempts = "3", backoff = @Backoff(delay = 5000, multiplier = 2), dltTopicSuffix = ".DLT")
    public void handle(NotificationDTO event) {
        try {
            log.info("Consumed message {}", event);

            // For Idempotency if id is passed
            /*
             * if(notificationService.isAlreadyProcessed(event.getNotificationId())){
             * log.info("Notification {} already processed, skipping",event);
             * }
             */

            notificationService.createAndPushNotification(event);
        } catch (Exception e) {
            System.out.println(e);
            throw new RuntimeException(e);
        }
    }
}
