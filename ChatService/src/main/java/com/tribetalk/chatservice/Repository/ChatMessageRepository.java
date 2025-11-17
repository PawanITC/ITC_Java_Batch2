package com.tribetalk.chatservice.Repository;

import com.tribetalk.chatservice.Entity.ChatMessage;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface ChatMessageRepository extends MongoRepository<ChatMessage,String> {

    List<ChatMessage> findByChatRoomIdOrderByTimestampAsc(String chatRoomId);
    List<ChatMessage> findBySenderIdOrReceiverIdOrderByTimestampDesc(String senderId, String receiverId);
    List<ChatMessage> findBySenderIdAndReceiverIdAndIsReadFalse(String senderId, String receiverId);
    List<ChatMessage> findByReceiverIdAndIsReadFalseOrderByTimestampDesc(String receiverId);

}
