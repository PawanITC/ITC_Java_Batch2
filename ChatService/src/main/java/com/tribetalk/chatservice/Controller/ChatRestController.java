package com.tribetalk.chatservice.Controller;

import com.tribetalk.chatservice.DTO.ChatMessageResponse;
import com.tribetalk.chatservice.DTO.MarkReadRequest;
import com.tribetalk.chatservice.Services.impl.ChatServiceImpl;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.Duration;
import java.util.List;
import java.util.Map;

@Tag(name = "Chat", description = "Endpoints for the chat Messages")
@RestController
@RequestMapping("api/chat")
public class ChatRestController {

    @Autowired
    private ChatServiceImpl chatService;
    private static final Logger log = LoggerFactory.getLogger(ChatRestController.class);

    @Operation(summary = "End Point To get Chat Messages", description = "To write history messages from a chat room assorted with respect to time")

    @GetMapping("/messages/{roomId}")
    public Flux<ChatMessageResponse> getChatMessages(@PathVariable String roomId) {
        log.info("getChatMessages called on thread: {}", Thread.currentThread().getName());
        return chatService.getChatMessages(roomId);
    }

    @GetMapping("/conversations/user/{userId}")
    public Mono<Map<String, List<ChatMessageResponse>>> getOneToOneConversations(@PathVariable String userId) {
        log.info("getOneToOneConversations called on thread: {}", Thread.currentThread().getName());
        return chatService.getGroupedChatsForUser(userId);
    }

    @PutMapping("/mark-as-read")
    public Mono<ResponseEntity<Void>> markMessagesAsRead(@RequestBody MarkReadRequest request) {
        log.info("markMessagesAsRead called on thread: {}", Thread.currentThread().getName());
        return chatService.markMessagesAsRead(request.getSenderId(), request.getReceiverId())
                .thenReturn(ResponseEntity.ok().build());
    }

    @GetMapping("/conversations/unread/{userId}")
    public Mono<Map<String, List<ChatMessageResponse>>> getUnreadConversations(@PathVariable String userId) {
        log.info("getUnreadConversations called on thread: {}", Thread.currentThread().getName());
        return chatService.getUnreadGroupedChatsForUser(userId);
    }

}