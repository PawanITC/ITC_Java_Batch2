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


    @Retryable(retryFor = {KafkaException.class}, maxAttempts = 5, backoff = @Backoff(delay = 1000, multiplier = 2))
    public void sendNotification(NotificationDTO event){
        try{

            Boolean notificationStatus = kafkaTemplate.executeInTransaction(kafkaTemplate -> {
                CompletableFuture<SendResult<String, NotificationDTO>> future = kafkaTemplate.send("notifications-topic", event);
                future.whenComplete((result, ex) -> {
                    if (ex == null) {
                        log.info("Notification sent successfully, partition={}, offset={}", result.getRecordMetadata().partition(), result.getRecordMetadata().offset());
                    } else {
                        log.error("Failed to send notification", ex);
                    }
                });
                return true;
            });

            //System.out.println("Sent notification to Kafka: " + mapper.writeValueAsString(event));
        } catch (Exception e) {
            System.out.println(e.getMessage());
            throw new RuntimeException(e);
        }
    }
}
