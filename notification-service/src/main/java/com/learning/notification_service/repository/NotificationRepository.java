package com.learning.notification_service.repository;

import com.learning.notification_service.entity.Notification;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
@Repository
public interface NotificationRepository extends MongoRepository<Notification,String> {
    //List<Notification> findByToUserIdOrderByCreatedAtDesc(String toUserId);
    Page<Notification> findByRecipientIdOrderByCreatedAtDesc(String recipientId, Pageable pageable);

    long countByRecipientIdAndReadStatusFalse(String recipientId);

}
