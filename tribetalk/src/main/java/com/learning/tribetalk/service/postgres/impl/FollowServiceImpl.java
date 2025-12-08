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
import com.learning.tribetalk.service.postgres.FollowService;
import org.springframework.cache.annotation.CachePut;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class FollowServiceImpl implements FollowService {

    private final FollowRepository followRepository;
    private final UserRepository userRepository;
    private final NotificationProducer notificationProducer;

    public FollowServiceImpl(FollowRepository followRepository,
                             UserRepository userRepository,
                             NotificationProducer notificationProducer) {
        this.followRepository = followRepository;
        this.userRepository = userRepository;
        this.notificationProducer = notificationProducer;
    }

    @Override
    @Transactional
    public void follow(Long followerId, Long followingId) {
        Optional<Follow> existing = followRepository.findByFollowerIdAndFollowingId(followerId, followingId);
        if (existing.isPresent()) {
            throw new DuplicateResourceException("Follow already exists !!");
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

        // AFTER TRANSACTION COMMIT → Send Kafka Notification
        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCommit() {
                sendFollowNotification(follower, following);
            }
        });
    }

    @Override
    @Transactional
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

        updateFollowingCountCache(followerId, follower.getFollowingCount());
        updateFollowersCountCache(followingId, following.getFollowersCount());
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
                        f.getFollower().getDisplayname()
                ))
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
                        f.getFollowing().getDisplayname()
                ))
                .toList();
    }

    // Cache Updates
    @CachePut(value = "followersCount_Cache", key = "#userId")
    public long updateFollowersCountCache(Long userId, long newCount) {
        return newCount;
    }

    @CachePut(value = "followingCount_Cache", key = "#userId")
    public long updateFollowingCountCache(Long userId, long newCount) {
        return newCount;
    }

    private void updateFollowersCountCache(Long userId, Long count) {
        updateFollowersCountCache(userId, count == null ? 0L : count);
    }

    private void updateFollowingCountCache(Long userId, Long count) {
        updateFollowingCountCache(userId, count == null ? 0L : count);
    }

    // Notification Builder
    private void sendFollowNotification(User follower, User following) {
        NotificationDTO notification = NotificationDTO.builder()
                .id(UUID.randomUUID().toString())
                .actorId(follower.getId().toString())
                .recipientId(following.getId().toString())
                .actorUsername(follower.getUsername())
                //.actorProfileImage(follower.getProfileImage())
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
