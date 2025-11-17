package com.tribetalk.chatservice.DTO;

import lombok.Data;

@Data
public class ChatMessageResponse {
    private String senderId;
    private String receiverId;
    private String content;
    private Long timestamp;
    private String senderUsername;
    private boolean isRead;
}
