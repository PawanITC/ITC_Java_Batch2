package com.tribetalk.chatservice.Services.impl;

import com.tribetalk.chatservice.DTO.ChatMessageResponse;
import com.tribetalk.chatservice.DTO.NotificationDTO;
import com.tribetalk.chatservice.Entity.ChatMessage;
import com.tribetalk.chatservice.Entity.NotificationType;
import com.tribetalk.chatservice.Repository.ChatMessageRepository;
import com.tribetalk.chatservice.Services.ChatService;
import com.tribetalk.chatservice.Services.NotificationProducer;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
public class ChatServiceImpl implements ChatService {

    @Autowired
    ChatMessageRepository chatMessageRepository;

    @Autowired
    NotificationProducer notificationProducer;

    public Flux<ChatMessageResponse> getChatMessages(String roomId) {
        return chatMessageRepository.findByChatRoomIdOrderByTimestampAsc(roomId)
                .map(msg -> ChatMessageResponse.builder()
                        .senderId(msg.getSenderId())
                        .receiverId(msg.getReceiverId())
                        .content(msg.getContent())
                        .timestamp(msg.getTimestamp())
                        .senderUsername(msg.getSenderUsername())
                        .isRead(msg.isRead())
                        .isGroup(msg.isGroup())
                        .groupMembers(msg.getGroupMembers())
                        .groupName(msg.getGroupName())
                        .build());
    }

    public Mono<Map<String, List<ChatMessageResponse>>> getGroupedChatsForUser(String userId) {
        return chatMessageRepository
                .findBySenderIdOrReceiverIdOrGroupMembersContainingOrderByTimestampDesc(userId, userId, userId)
                .collectMultimap(ChatMessage::getChatRoomId)
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
                                                .isGroup(chatMessage.isGroup())
                                                .groupMembers(chatMessage.getGroupMembers())
                                                .groupName(chatMessage.getGroupName())
                                                .build())
                                        .collect(Collectors.toList())
                        ))
                );
    }

    public Mono<Void> markMessagesAsRead(String senderId, String receiverId) {
        return chatMessageRepository
                .findBySenderIdAndReceiverIdAndIsReadFalse(senderId, receiverId)
                .flatMap(msg -> {
                    msg.setRead(true);
                    return chatMessageRepository.save(msg);
                })
                .then();
    }

    public Mono<Map<String, List<ChatMessageResponse>>> getUnreadGroupedChatsForUser(String userId) {
        return chatMessageRepository
                .findByReceiverIdAndIsReadFalseOrderByTimestampDesc(userId)
                .collectMultimap(ChatMessage::getChatRoomId)
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
                                                .isGroup(chatMessage.isGroup())
                                                .groupMembers(chatMessage.getGroupMembers() == null
                                                        ? List.of() // ✅ avoid nulls
                                                        : chatMessage.getGroupMembers().stream()
                                                        .filter(Objects::nonNull)
                                                        .collect(Collectors.toList()))
                                                .groupName(chatMessage.getGroupName())
                                                .build())
                                        .collect(Collectors.toList())
                        ))
                );
    }

    public void sendNotication(ChatMessage message) {
        NotificationDTO event = NotificationDTO.builder()
                .recipientId(message.getReceiverId())
                .actorId(message.getSenderId())
                .type(NotificationType.REPLY)
                .resourceId(message.getChatRoomId())
                .createdAt(Instant.now())
                .build();
        notificationProducer.sendNotification(event);
    }
}