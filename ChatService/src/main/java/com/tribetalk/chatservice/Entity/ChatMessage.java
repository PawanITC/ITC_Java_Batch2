package com.tribetalk.chatservice.Entity;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "chat_messages")
public class ChatMessage {

    @Id
    private String id;              // MongoDB document ID

    private String chatRoomId;      // optional if multiple chat rooms
    private String senderId;        // sender userId
    private String senderUsername;  // optional username for display
    private String receiverId;      // userId of receiver
    private String content;         // message text
    private Long timestamp;         // epoch millis for ordering
    private boolean isRead;

    private boolean isGroup;        // flag to indicate group chat
    private java.util.List<String> groupMembers; // list of userIds in the group
    private String groupName;
}
