package com.learning.tribetalk.service.postgres.impl;

import com.learning.tribetalk.dto.NotificationDTO;
import com.learning.tribetalk.dto.response.UserResponse;
import com.learning.tribetalk.entity.NotificationType;
import com.learning.tribetalk.entity.postgres.Follow;
import com.learning.tribetalk.entity.postgres.User;
import com.learning.tribetalk.exception.DuplicateResourceException;
import com.learning.tribetalk.exception.ResourceNotFoundException;
import com.learning.tribetalk.repository.postgres.FollowRepository;
import com.learning.tribetalk.repository.postgres.UserRepository;
import com.learning.tribetalk.service.NotificationProducer;
import com.learning.tribetalk.service.mongo.S3Service;
import com.learning.tribetalk.service.postgres.FollowService;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.CachePut;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@EnableCaching
@Service
public class FollowServiceImpl implements FollowService {

    private final FollowRepository followRepository;
    private final UserRepository userRepository;
    private final NotificationProducer notificationProducer;
    private final S3Service s3Service;

    private static final Logger log = LoggerFactory.getLogger(FollowServiceImpl.class);

    public FollowServiceImpl(FollowRepository followRepository,
            UserRepository userRepository,
            NotificationProducer notificationProducer,
            S3Service s3Service) {
        this.followRepository = followRepository;
        this.userRepository = userRepository;
        this.notificationProducer = notificationProducer;
        this.s3Service = s3Service;
    }

    @Override
    @Transactional
    @CacheEvict(value = { "followingList_Cache", "followersList_Cache", "followingCount_Cache",
            "followersCount_Cache" }, key = "#followerId", allEntries = true)
    public void follow(Long followerId, Long followingId) {
        Optional<Follow> existing = followRepository.findByFollowerIdAndFollowingId(followerId, followingId);
        if (existing.isPresent()) {
            // Already following - this is fine, just return success (idempotent operation)
            return;
        }

        User follower = userRepository.findById(followerId)
                .orElseThrow(() -> new ResourceNotFoundException("Follower not found"));

        User following = userRepository.findById(followingId)
                .orElseThrow(() -> new ResourceNotFoundException("User to follow not found"));

        Follow newFollow = new Follow();
        newFollow.setFollower(follower);
        newFollow.setFollowing(following);
        followRepository.save(newFollow);

        follower.setFollowingCount(safeLong(follower.getFollowingCount()) + 1);
        following.setFollowersCount(safeLong(following.getFollowersCount()) + 1);

        userRepository.save(follower);
        userRepository.save(following);

        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCommit() {
                // Send notification asynchronously - don't block the follow operation
                try {
                    sendFollowNotification(follower, following);
                } catch (Exception e) {
                    // Log error but don't fail the follow operation
                    log.error("Failed to send follow notification: " + e.getMessage(), e);
                    System.err.println("Failed to send follow notification: " + e.getMessage());
                }
            }
        });
    }

    @Override
    @Transactional
    @CacheEvict(value = { "followingList_Cache", "followersList_Cache", "followingCount_Cache",
            "followersCount_Cache" }, key = "#followerId", allEntries = true)
    public void unFollow(Long followerId, Long followingId) {
        Optional<Follow> follow = followRepository.findByFollowerIdAndFollowingId(followerId, followingId);
        if (follow.isEmpty()) {
            throw new ResourceNotFoundException("Follow doesn't exist !!");
        }

        User follower = userRepository.findById(followerId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found !!"));

        User following = userRepository.findById(followingId)
                .orElseThrow(() -> new ResourceNotFoundException("User to Unfollow not found !!"));

        follower.setFollowingCount(Math.max(0L, safeLong(follower.getFollowingCount()) - 1));
        following.setFollowersCount(Math.max(0L, safeLong(following.getFollowersCount()) - 1));
        userRepository.save(follower);
        userRepository.save(following);

        followRepository.delete(follow.get());
    }

    @Override
    @Cacheable(value = "followersCount_Cache", key = "#userId")
    public long getFollowersCount(Long userId) {
        return followRepository.countByFollowingId(userId);
    }

    @Override
    @Cacheable(value = "followingCount_Cache", key = "#userId")
    public long getFollowingCount(Long userId) {
        return followRepository.countByFollowerId(userId);
    }

    @Override
    @Cacheable(value = "followersList_Cache", key = "#userId")
    public List<UserResponse> getFollwersList(Long userId) {
        userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        return followRepository.findByFollowingId(userId)
                .stream()
                .map(f -> new UserResponse(
                        f.getFollower().getId(),
                        f.getFollower().getUsername(),
                        f.getFollower().getEmail(),
                        f.getFollower().getDisplayname(),
                        generatePresignedUrl(f.getFollower().getProfileImageUrl())))
                .toList();
    }

    @Override
    @Cacheable(value = "followingList_Cache", key = "#userId")
    public List<UserResponse> getFollwingList(Long userId) {
        userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        return followRepository.findByFollowerId(userId)
                .stream()
                .map(f -> new UserResponse(
                        f.getFollowing().getId(),
                        f.getFollowing().getUsername(),
                        f.getFollowing().getEmail(),
                        f.getFollowing().getDisplayname(),
                        generatePresignedUrl(f.getFollowing().getProfileImageUrl())))
                .toList();
    }

    // Helper method to generate presigned URL from S3 key
    private String generatePresignedUrl(String s3Key) {
        if (s3Key == null || s3Key.isBlank()) {
            return null;
        }
        try {
            return s3Service.generatePresignedUrl(s3Key, Duration.ofHours(1));
        } catch (Exception e) {
            return null;
        }
    }

    private void sendFollowNotification(User follower, User following) {
        NotificationDTO notification = NotificationDTO.builder()
                .id(UUID.randomUUID().toString())
                .actorId(follower.getId().toString())
                .recipientId(following.getId().toString())
                .actorUsername(follower.getUsername())
                .type(NotificationType.FOLLOW)
                .resourceId(follower.getId().toString())
                .createdAt(Instant.now())
                .readStatus(false)
                .build();

        notificationProducer.sendNotification(notification);
    }

    private long safeLong(Long l) {
        return l == null ? 0L : l;
    }
}
