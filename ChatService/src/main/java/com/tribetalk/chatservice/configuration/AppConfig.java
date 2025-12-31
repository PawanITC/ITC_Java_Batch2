package com.tribetalk.chatservice.configuration;

import org.springframework.context.annotation.Configuration;

@Configuration
public class AppConfig {
    // Kafka beans removed - using KafkaProducerConfig instead
    // This fixes transaction errors and compression issues
}
