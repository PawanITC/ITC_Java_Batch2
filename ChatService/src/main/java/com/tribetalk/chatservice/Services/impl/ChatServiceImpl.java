package com.tribetalk.chatservice.Services.impl;

import com.tribetalk.chatservice.DTO.ChatMessageResponse;
import com.tribetalk.chatservice.Entity.ChatMessage;
import com.tribetalk.chatservice.Repository.ChatMessageRepository;
import com.tribetalk.chatservice.Services.ChatService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class ChatServiceImpl implements ChatService {

    @Autowired
    ChatMessageRepository chatMessageRepository;
    public List<ChatMessageResponse> getChatMessages(String roomId) {
        return chatMessageRepository.findByChatRoomIdOrderByTimestampAsc(roomId)
                .stream()
                .map(chatMessage -> {
                    ChatMessageResponse dto = new ChatMessageResponse();
                    dto.setSenderId(chatMessage.getSenderId());
                    dto.setReceiverId(chatMessage.getReceiverId());
                    dto.setContent(chatMessage.getContent());
                    dto.setTimestamp(chatMessage.getTimestamp());
                    return dto;
                })
                .collect(Collectors.toList());

    }

    public Map<String, List<ChatMessageResponse>> getGroupedChatsForUser(String userId) {
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
    }

    public void     markMessagesAsRead(String senderId, String receiverId) {
        List<ChatMessage> unreadMessages = chatMessageRepository
                .findBySenderIdAndReceiverIdAndIsReadFalse(senderId, receiverId);

        for (ChatMessage message : unreadMessages) {
            message.setRead(true);
        }

        chatMessageRepository.saveAll(unreadMessages);
    }

    public Map<String, List<ChatMessageResponse>> getUnreadGroupedChatsForUser(String userId) {
        List<ChatMessage> unreadMessages = chatMessageRepository
                .findByReceiverIdAndIsReadFalseOrderByTimestampDesc(userId);

        return unreadMessages.stream()
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
    }


}
