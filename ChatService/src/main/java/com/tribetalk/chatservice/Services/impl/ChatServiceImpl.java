package com.tribetalk.chatservice.Services.impl;

import com.tribetalk.chatservice.DTO.ChatMessageResponse;
import com.tribetalk.chatservice.DTO.NotificationDTO;
import com.tribetalk.chatservice.Entity.ChatMessage;
import com.tribetalk.chatservice.Entity.NotificationType;
import com.tribetalk.chatservice.Repository.ChatMessageRepository;
import com.tribetalk.chatservice.Services.ChatService;
import com.tribetalk.chatservice.Services.NotificationProducer;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class ChatServiceImpl implements ChatService {

    @Autowired
    ChatMessageRepository chatMessageRepository;

    @Autowired
    NotificationProducer notificationProducer;


    //public List<ChatMessageResponse> getChatMessages(String roomId) {

    public Flux<ChatMessageResponse> getChatMessages(String roomId) {
        return chatMessageRepository.findByChatRoomIdOrderByTimestampAsc(roomId)
                .map(msg -> ChatMessageResponse.builder()
                        .senderId(msg.getSenderId())
                        .receiverId(msg.getReceiverId())
                        .content(msg.getContent())
                        .timestamp(msg.getTimestamp())
                        .senderUsername(msg.getSenderUsername())
                        .isRead(msg.isRead())
                        .build());


    }


  /*     public Map<String, List<ChatMessageResponse>> getGroupedChatsForUser(String userId) {
        List<ChatMessage> messages = chatMessageRepository
                .findBySenderIdOrReceiverIdOrderByTimestampDesc(userId, userId);

        return messages.stream()
                .collect(Collectors.groupingBy(
                        ChatMessage::getChatRoomId,
                        Collectors.mapping(chatMessage -> {
                            ChatMessageResponse dto = new ChatMessageResponse();
                            dto.setSenderId(chatMessage.getSenderId());
                            dto.setReceiverId(chatMessage.getReceiverId());
                            dto.setContent(chatMessage.getContent());
                            dto.setTimestamp(chatMessage.getTimestamp());
                            dto.setSenderUsername(chatMessage.getSenderUsername());
                            dto.setRead(chatMessage.isRead());
                            return dto;
                        }, Collectors.toList())
                ));
    }*/

    public Mono<Map<String, List<ChatMessageResponse>>> getGroupedChatsForUser(String userId) {

        return chatMessageRepository
                .findBySenderIdOrReceiverIdOrderByTimestampDesc(userId, userId)
                .collectMultimap(ChatMessage::getChatRoomId)  // group by the entity field
                .map(roomMap -> roomMap.entrySet().stream()
                        .collect(Collectors.toMap(
                                Map.Entry::getKey,
                                e -> e.getValue().stream()
                                        .map(chatMessage -> ChatMessageResponse.builder()
                                                .senderId(chatMessage.getSenderId())
                                                .receiverId(chatMessage.getReceiverId())
                                                .content(chatMessage.getContent())
                                                .timestamp(chatMessage.getTimestamp())
                                                .senderUsername(chatMessage.getSenderUsername())
                                                .isRead(chatMessage.isRead())
                                                .build())
                                        .collect(Collectors.toList())
                        ))
                );
    }


    /*public void     markMessagesAsRead(String senderId, String receiverId) {
        List<ChatMessage> unreadMessages = chatMessageRepository
                .findBySenderIdAndReceiverIdAndIsReadFalse(senderId, receiverId);

        for (ChatMessage message : unreadMessages) {
            message.setRead(true);
        }

        chatMessageRepository.saveAll(unreadMessages);
    }*/
    public Mono<Void> markMessagesAsRead(String senderId, String receiverId) {
        return chatMessageRepository
                .findBySenderIdAndReceiverIdAndIsReadFalse(senderId, receiverId)
                .flatMap(msg -> {
                    msg.setRead(true);
                    return chatMessageRepository.save(msg);
                })
                .then(); // returns Mono<Void>
    }

    public Mono<Map<String, List<ChatMessageResponse>>> getUnreadGroupedChatsForUser(String userId) {


        return chatMessageRepository
                .findByReceiverIdAndIsReadFalseOrderByTimestampDesc(userId)
                .collectMultimap(ChatMessage::getChatRoomId)  // group by the entity field
                .map(roomMap -> roomMap.entrySet().stream()
                        .collect(Collectors.toMap(
                                Map.Entry::getKey,
                                e -> e.getValue().stream()
                                        .map(chatMessage -> ChatMessageResponse.builder()
                                                .senderId(chatMessage.getSenderId())
                                                .receiverId(chatMessage.getReceiverId())
                                                .content(chatMessage.getContent())
                                                .timestamp(chatMessage.getTimestamp())
                                                .senderUsername(chatMessage.getSenderUsername())
                                                .isRead(chatMessage.isRead())
                                                .build())
                                        .collect(Collectors.toList())
                        ))
                );
    }

    public void sendNotication(ChatMessage message) {
        NotificationDTO event = NotificationDTO.builder()
                .recipientId(message.getReceiverId()) // random recipient
                .actorId(message.getSenderId())
                .type(NotificationType.REPLY)
                .resourceId(message.getChatRoomId())
                .createdAt(Instant.now())
                .build();
        notificationProducer.sendNotification(event);
    }

}
