package com.tribetalk.chatservice.Repository;

import com.tribetalk.chatservice.Entity.ChatMessage;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.ReactiveMongoRepository;
import reactor.core.publisher.Flux;

import java.util.List;

public interface ChatMessageRepository extends ReactiveMongoRepository<ChatMessage,String> {

    Flux<ChatMessage> findByChatRoomIdOrderByTimestampAsc(String chatRoomId);
    Flux<ChatMessage> findBySenderIdOrReceiverIdOrderByTimestampDesc(String senderId, String receiverId);
    Flux<ChatMessage> findBySenderIdAndReceiverIdAndIsReadFalse(String senderId, String receiverId);
    Flux<ChatMessage> findByReceiverIdAndIsReadFalseOrderByTimestampDesc(String receiverId);

}
