package com.tribetalk.chatservice.Controller;

import com.tribetalk.chatservice.Entity.ChatMessage;
import com.tribetalk.chatservice.Repository.ChatMessageRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.time.Instant;

@Controller
public class ChatController {

    @Autowired
    private SimpMessagingTemplate messagingTemplate;
    @Autowired
    private ChatMessageRepository chatMessageRepository;

    // WebSocket endpoint: /app/chat.send
    @MessageMapping("/chat.send")
    public ChatMessage sendMessage(ChatMessage message) {
        message.setTimestamp(Instant.now().toEpochMilli());
        // Generate room ID based on participants
        String roomId = getChatRoomId(message.getSenderId(), message.getReceiverId());
        message.setChatRoomId(roomId);
        // save message to MongoDB
        chatMessageRepository.save(message);
        // Broadcast only to the room
        messagingTemplate.convertAndSend("/topic/chat/" + roomId,message);
        return message;
    }

    private String getChatRoomId(String sender, String receiver) {
        return sender.compareTo(receiver) < 0
                ? sender + "_" + receiver
                : receiver + "_" + sender;
    }
}
