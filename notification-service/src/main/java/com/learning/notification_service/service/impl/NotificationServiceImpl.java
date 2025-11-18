package com.learning.notification_service.service.impl;

import com.learning.notification_service.dto.NotificationDTO;
import com.learning.notification_service.dto.UserResponse;
import com.learning.notification_service.entity.Notification;
import com.learning.notification_service.repository.NotificationRepository;
import com.learning.notification_service.service.NotificationService;
import com.learning.notification_service.service.UserClient;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Slf4j
@Service
public class NotificationServiceImpl implements NotificationService {

    private final NotificationRepository repository;
    private final SimpMessagingTemplate messagingTemplate;
    private final UserClient userClient;

    public NotificationServiceImpl(NotificationRepository repository, SimpMessagingTemplate messagingTemplate, UserClient userClient){
        this.repository=repository;
        this.messagingTemplate=messagingTemplate;
        this.userClient=userClient;
    }

    public void createAndPushNotification(NotificationDTO event){
        if(event.getActorId().equalsIgnoreCase(event.getRecipientId())){
            return;
        }

        Notification notification=buildNotification(event);
        Notification saved=repository.save(notification);

        log.info("Created Notification: {}",saved.getId());

        //Push Realtime notification using WebSockets

        UserResponse userResponse=userClient.getUserById(event.getActorId());
        event.setActorUsername(userResponse.username());
        event.setActorDisplayName(userResponse.displayname());
        event.setPayload(buildNotificationMessage(event));
        pushNotification(event);

    }

    private void pushNotification(NotificationDTO notification) {
        try{
            messagingTemplate.convertAndSend("/topic/notifications/"+notification.getRecipientId(),notification);
        } catch (Exception e) {
            log.info("Error pushing notification via websocket {}",e.getMessage());
            throw new RuntimeException(e);
        }
    }

    public Notification buildNotification(NotificationDTO event){
        String message=buildNotificationMessage(event);

        return Notification.builder()
                .recipientId(event.getRecipientId())
                .type(event.getType())
                .actorId(event.getActorId())
                .resourceId(event.getResourceId())
                .readStatus(false)
                .payload(message)
                .createdAt(Instant.now())
                .build();
    }

    private String buildNotificationMessage(NotificationDTO event) {
        return switch (event.getType()){
            case LIKE -> "liked your tweet";
            case REPLY -> "replied to your tweet";
            case FOLLOW -> "started following you";
            case MENTION -> "mentioned you";
            case RETWEET -> "re-tweeted your post";
        };
    }


    public Page<NotificationDTO> getUserNotification(String recipientId,int page,int size){
        Pageable pageable= PageRequest.of(page,size);
        Page<Notification> notificationPage=repository.findByRecipientIdOrderByCreatedAtDesc(recipientId,pageable);
        List<NotificationDTO> notificationDTOList= notificationPage.stream().map(notification -> {
            UserResponse userResponse=userClient.getUserById(notification.getActorId());
            return NotificationDTO.builder()
                   .id(notification.getId())
                   .actorId(notification.getActorId())
                   .type(notification.getType())
                   .resourceId(notification.getResourceId())
                   .payload(notification.getPayload())
                   .recipientId(notification.getRecipientId())
                   .actorProfileImage("")
                   .actorDisplayName(userResponse.displayname())
                   .actorUsername(userResponse.username())
                   .readStatus(notification.isReadStatus())
                   .createdAt(notification.getCreatedAt()).build();
        }).collect(Collectors.toList());

        return new PageImpl<>(notificationDTOList,pageable,notificationPage.getTotalElements());
    }

    public Long getUnReadCount(String recipientId){
        return repository.countByRecipientIdAndReadStatusFalse(recipientId);
    }

    @Transactional
    public void markAsRead(String notificationId){
        Optional<Notification> existingNotification=repository.findById(notificationId);
        if(existingNotification.isPresent()){
            Notification notification=existingNotification.get();
            notification.setReadStatus(true);
            repository.save(notification);
            log.info("Marked notification as read {}",notification.getId());
        }
    }

    @Transactional
    public void markAllAsRead(String recipientId){
        Page<Notification> notifications=repository.findByRecipientIdOrderByCreatedAtDesc(recipientId,PageRequest.of(0,1000));

        notifications.forEach(notification -> {
            notification.setReadStatus(true);
        });

        repository.saveAll(notifications);

        log.info("Marked All notifications as read for user: {}",recipientId);

    }

    /*

    public boolean isAlreadyProcessed(String notificationId) {
        return mongoTemplate.exists(Query.query(Criteria.where("_id").is(notificationId)), "processed_notifications");
    }

    public void markProcessed(String notificationId) {
        mongoTemplate.save(Map.of("_id", notificationId, "processedAt", new Date()), "processed_notifications");
    }

    */

}
