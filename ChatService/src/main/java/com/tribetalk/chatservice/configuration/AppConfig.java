package com.tribetalk.chatservice.configuration;

import com.tribetalk.chatservice.DTO.NotificationDTO;
import org.apache.kafka.clients.producer.ProducerConfig;
import org.apache.kafka.common.serialization.StringSerializer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.core.DefaultKafkaProducerFactory;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.kafka.core.ProducerFactory;
import org.springframework.kafka.support.serializer.JsonSerializer;

import java.util.HashMap;
import java.util.Map;

@Configuration
public class AppConfig {
    @Bean
    public ProducerFactory<String, NotificationDTO> producerFactory() {
        Map<String, Object> configProps = new HashMap<>();
        configProps.put(ProducerConfig.BOOTSTRAP_SERVERS_CONFIG, "localhost:9092");
        configProps.put(ProducerConfig.KEY_SERIALIZER_CLASS_CONFIG, StringSerializer.class);
        configProps.put(ProducerConfig.VALUE_SERIALIZER_CLASS_CONFIG, JsonSerializer.class);
        // Optional: prevent type headers (useful if consumer is plain Kafka)
        configProps.put(JsonSerializer.ADD_TYPE_INFO_HEADERS, false);

        configProps.put(ProducerConfig.ACKS_CONFIG, "all");
        configProps.put(ProducerConfig.RETRIES_CONFIG, 5);
        configProps.put(ProducerConfig.MAX_IN_FLIGHT_REQUESTS_PER_CONNECTION, 1);
        configProps.put(ProducerConfig.LINGER_MS_CONFIG, 20);
        configProps.put(ProducerConfig.BATCH_SIZE_CONFIG, 131072); //128 KB
        configProps.put(ProducerConfig.COMPRESSION_TYPE_CONFIG, "snappy");
        configProps.put(ProducerConfig.BUFFER_MEMORY_CONFIG, 67108864); //64 MB
        configProps.put(ProducerConfig.TRANSACTIONAL_ID_CONFIG, "notification-producer-tx"); // ✅

        return new DefaultKafkaProducerFactory<>(configProps);
    }

    @Bean
    public KafkaTemplate<String, NotificationDTO> kafkaTemplate() {
        KafkaTemplate<String, NotificationDTO> kafkaTemplate = new KafkaTemplate<>(producerFactory());
        //kafkaTemplate.setTransactionIdPrefix("notification-producer-tx");
        return kafkaTemplate;
        //return new KafkaTemplate<>(producerFactory());
    }
}
