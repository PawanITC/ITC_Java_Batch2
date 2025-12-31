package com.tribetalk.chatservice.DTO;

import lombok.Builder;
import lombok.Data;
import lombok.Getter;
import lombok.Setter;

@Data
@Builder
@Getter
@Setter
public class ChatMessageResponse {
    private String senderId;
    private String receiverId;
    private String content;
    private Long timestamp;
    private String senderUsername;
    private boolean isRead;
    private boolean isGroup;        // flag to indicate group chat
    private java.util.List<String> groupMembers; // list of userIds in the group
    private String groupName;
}
