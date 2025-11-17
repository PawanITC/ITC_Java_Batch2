package com.tribetalk.chatservice.Controller;

import com.tribetalk.chatservice.DTO.ChatMessageResponse;
import com.tribetalk.chatservice.DTO.MarkReadRequest;
import com.tribetalk.chatservice.Services.impl.ChatServiceImpl;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@Tag(name = "Chat", description = "Endpoints for the chat Messages")
@RestController
@RequestMapping("api/chat")
public class ChatRestController {

    @Autowired
    private  ChatServiceImpl chatService;


    @Operation(
            summary = "End Point To get Chat Messages",
            description = "To write history messages from a chat room assorted with respect to time"
    )
    @GetMapping("/messages/{roomId}")
    public List<ChatMessageResponse> getChatMessages(@PathVariable String roomId) {
        List<ChatMessageResponse> responseList = chatService.getChatMessages(roomId);
        return responseList;
    }

    @GetMapping("/conversations/user/{userId}")
    public Map<String, List<ChatMessageResponse>> getOneToOneConversations(@PathVariable String userId) {
        return chatService.getGroupedChatsForUser(userId);
    }

    @PutMapping("/mark-as-read")
    public ResponseEntity<Void> markMessagesAsRead(@RequestBody MarkReadRequest request) {
        chatService.markMessagesAsRead(request.getSenderId(), request.getReceiverId());
        return ResponseEntity.ok().build();
    }



    @GetMapping("/conversations/unread/{userId}")
    public Map<String, List<ChatMessageResponse>> getUnreadConversations(@PathVariable String userId) {
        return chatService.getUnreadGroupedChatsForUser(userId);
    }
}