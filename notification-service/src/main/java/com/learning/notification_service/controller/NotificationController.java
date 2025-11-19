package com.learning.notification_service.controller;

import com.learning.notification_service.dto.NotificationDTO;
import com.learning.notification_service.service.NotificationService;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    private final NotificationService notificationService;

    public NotificationController(NotificationService notificationService){
        this.notificationService=notificationService;
    }

    @GetMapping
    public ResponseEntity<Page<NotificationDTO>> getNotification(@RequestParam String recipientId, @RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "20") int size){
        return ResponseEntity.ok(notificationService.getUserNotification(recipientId,page,size));
    }

    @PatchMapping("/{id}/read")
    public ResponseEntity<?> markAsRead(@PathVariable String id){
        notificationService.markAsRead(id);
        return ResponseEntity.ok().build();
    }

    @PatchMapping("/markAllRead")
    public ResponseEntity<?> markAllRead(@RequestParam String recipientId){
        notificationService.markAllAsRead(recipientId);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/unReadCount")
    public ResponseEntity<Long> getUnReadCount(@RequestParam String recipientId){
        return ResponseEntity.ok().body(notificationService.getUnReadCount(recipientId));
    }

}
