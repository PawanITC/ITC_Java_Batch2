package com.learning.tribetalk.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.learning.tribetalk.dto.NotificationDTO;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.KafkaException;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.kafka.support.SendResult;
import org.springframework.retry.annotation.Backoff;
import org.springframework.retry.annotation.EnableRetry;
import org.springframework.retry.annotation.Retryable;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.util.concurrent.CompletableFuture;

@Service
@EnableRetry
public class NotificationProducer {

    private static final Logger log = LoggerFactory.getLogger(NotificationProducer.class);

    private final KafkaTemplate<String, NotificationDTO> kafkaTemplate;
    private final ObjectMapper mapper;

    public NotificationProducer(KafkaTemplate<String, NotificationDTO> kafkaTemplate, ObjectMapper mapper) {
        this.kafkaTemplate = kafkaTemplate;
        this.mapper = mapper;
    }

    @Async
    @Retryable(retryFor = { KafkaException.class }, maxAttempts = 3, backoff = @Backoff(delay = 500, multiplier = 2))
    public void sendNotification(NotificationDTO event) {
        try {
            // Send notification without transaction for better performance
            CompletableFuture<SendResult<String, NotificationDTO>> future = kafkaTemplate.send("notifications-topic",
                    event);
            future.whenComplete((result, ex) -> {
                if (ex == null) {
                    log.info("Notification sent successfully, partition={}, offset={}",
                            result.getRecordMetadata().partition(), result.getRecordMetadata().offset());
                } else {
                    log.error("Failed to send notification", ex);
                }
            });
        } catch (Exception e) {
            log.error("Error sending notification: {}", e.getMessage(), e);
            // Don't throw exception - notification failure shouldn't break the main
            // operation
        }
    }
}
