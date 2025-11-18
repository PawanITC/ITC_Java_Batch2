package com.learning.notification_service.service;

import com.learning.notification_service.dto.NotificationDTO;
import org.springframework.data.domain.Page;

public interface NotificationService {
    void createAndPushNotification(NotificationDTO event);

    Page<NotificationDTO> getUserNotification(String recipientId, int page, int size);

    void markAsRead(String id);

    void markAllAsRead(String recipientId);

    Long getUnReadCount(String recipientId);
}
