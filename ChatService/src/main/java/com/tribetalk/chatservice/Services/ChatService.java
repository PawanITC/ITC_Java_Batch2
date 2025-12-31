package com.tribetalk.chatservice.Services;

import com.tribetalk.chatservice.DTO.ChatMessageResponse;
import com.tribetalk.chatservice.Entity.ChatMessage;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Map;

public interface ChatService {

    public Flux<ChatMessageResponse> getChatMessages(String roomId);

    public Mono<Map<String, List<ChatMessageResponse>>> getGroupedChatsForUser(String userId) ;

    public Mono<Void> markMessagesAsRead(String senderId, String receiverId) ;

    public Mono<Map<String, List<ChatMessageResponse>>> getUnreadGroupedChatsForUser(String userId) ;

    public void sendNotication(ChatMessage message) ;


    }