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
            log.info("Sending notification: type={}, recipientId={}, actorId={}",
                    event.getType(), event.getRecipientId(), event.getActorId());
            System.out.println(String.format("Sending notification: type=%s, recipientId=%s, actorId=%s",
                    event.getType(), event.getRecipientId(), event.getActorId()));
            // Send notification without transaction - use sendDefault or send with explicit
            // topic
            CompletableFuture<SendResult<String, NotificationDTO>> future = kafkaTemplate.send("notifications-topic",
                    event);

            future.whenComplete((result, ex) -> {
                if (ex == null) {
                    log.info("✅ Notification sent successfully! type={}, partition={}, offset={}, recipientId={}",
                            event.getType(),
                            result.getRecordMetadata().partition(),
                            result.getRecordMetadata().offset(),
                            event.getRecipientId());
                    System.out.println(String.format(
                            "✅ Notification sent successfully! type=%s, partition=%d, offset=%d, recipientId=%s",
                            event.getType(),
                            result.getRecordMetadata().partition(),
                            result.getRecordMetadata().offset(),
                            event.getRecipientId()));
                } else {
                    log.error("❌ Failed to send notification: type={}, recipientId={}, error={}",
                            event.getType(), event.getRecipientId(), ex.getMessage(), ex);
                    System.out.println(String.format("❌ Failed to send notification: type=%s, recipientId=%s, error=%s",
                            event.getType(), event.getRecipientId(), ex.getMessage()));
                }
            });
        } catch (Exception e) {
            log.error("❌ Error sending notification: type={}, recipientId={}, error={}",
                    event.getType(), event.getRecipientId(), e.getMessage(), e);
            // Don't throw exception - notification failure shouldn't break the main
            // operation
            System.err.println(String.format("❌ Error sending notification: type=%s, recipientId=%s, error=%s",
                    event.getType(), event.getRecipientId(), e.getMessage()));
        }
    }
}
