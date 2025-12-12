package com.tribetalk.chatservice.Controller;

import com.tribetalk.chatservice.DTO.NotificationDTO;
import com.tribetalk.chatservice.Entity.ChatMessage;
import com.tribetalk.chatservice.Entity.NotificationType;
import com.tribetalk.chatservice.Repository.ChatMessageRepository;
import com.tribetalk.chatservice.Services.ChatService;
import com.tribetalk.chatservice.Services.NotificationProducer;
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
    @Autowired
    private ChatService chatService;
    @Autowired
    private NotificationProducer notificationProducer;

    // WebSocket endpoint: /app/chat.send
    @MessageMapping("/chat.send")
    public void sendMessage(ChatMessage message) {

        message.setTimestamp(Instant.now().toEpochMilli());

        chatMessageRepository.save(message)
                .doOnSuccess(saved -> {

                    // 1️⃣ Websocket broadcast
                    messagingTemplate.convertAndSend(
                            "/topic/chat/" + saved.getChatRoomId(),
                            saved
                    );

                    // 2️⃣ Send Kafka notification
                    NotificationDTO notification = NotificationDTO.builder()
                            .id(null)
                            .actorId(saved.getSenderId())
                            .recipientId(saved.getReceiverId())
                            .actorUsername(saved.getSenderUsername())
                            .actorProfileImage(null) // if you want, fetch profile later
                            .type(NotificationType.REPLY)
                            .resourceId(saved.getChatRoomId())
                            .createdAt(Instant.now())
                            .readStatus(false)
                            .build();

                    // FIRE & FORGET (Kafka is async)
                    notificationProducer.sendNotification(notification);

                })
                .subscribe();
    }


}
