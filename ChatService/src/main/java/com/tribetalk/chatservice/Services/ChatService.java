package com.tribetalk.chatservice.Services;

import com.tribetalk.chatservice.DTO.ChatMessageResponse;
import com.tribetalk.chatservice.Entity.ChatMessage;

import java.util.List;
import java.util.Map;

public interface ChatService {

    public List<ChatMessageResponse> getChatMessages(String roomId);

    public Map<String, List<ChatMessageResponse>> getGroupedChatsForUser(String userId);

    public void markMessagesAsRead(String senderId, String receiverId);

    public Map<String, List<ChatMessageResponse>> getUnreadGroupedChatsForUser(String userId) ;

    }