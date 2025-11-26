package com.learning.tribetalk.service.postgres.impl;

import com.learning.tribetalk.dto.response.UserResponse;
import com.learning.tribetalk.entity.postgres.Follow;
import com.learning.tribetalk.entity.postgres.User;
import com.learning.tribetalk.exception.DuplicateResourceException;
import com.learning.tribetalk.exception.ResourceNotFoundException;
import com.learning.tribetalk.repository.postgres.FollowRepository;
import com.learning.tribetalk.repository.postgres.UserRepository;
import com.learning.tribetalk.service.postgres.FollowService;
import org.springframework.cache.annotation.CachePut;
import org.springframework.stereotype.Service;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
public class FollowServiceImpl implements FollowService {

    private final FollowRepository followRepository;
    private final UserRepository userRepository;

    public FollowServiceImpl(FollowRepository followRepository, UserRepository userRepository) {
        this.followRepository = followRepository;
        this.userRepository = userRepository;

    }

    @Override
    @Transactional
    public void follow(Long followerId, Long followingId) {
        Optional<Follow> follow = followRepository.findByFollowerIdAndFollowingId(followerId, followingId);
        if(follow.isPresent())
        {
            throw new DuplicateResourceException(" Follow already exists !!");
        }

                User follower = userRepository.findById(followerId)
                .orElseThrow(() -> new ResourceNotFoundException("Follower not found"));

        User following = userRepository.findById(followingId)
                .orElseThrow(() -> new ResourceNotFoundException("User to follow not found"));


        Follow newFollow= new Follow();
        newFollow.setFollower(follower);
        newFollow.setFollowing(following);
        followRepository.save(newFollow);


        follower.setFollowingCount(safeLong(follower.getFollowingCount()) + 1);
        following.setFollowersCount(safeLong(following.getFollowersCount()) + 1);
        userRepository.save(follower);
        userRepository.save(following);

    }

    @Override
    @Transactional
    public void unFollow(Long followerId, Long followingId) {
        Optional<Follow> follow = followRepository.findByFollowerIdAndFollowingId(followerId, followingId);
        if(follow.isEmpty())
        {
            throw new ResourceNotFoundException(" Follow doesnt exist !!");
        }

        User follower = userRepository.findById(followerId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found !!"));

        User following = userRepository.findById(followingId)
                .orElseThrow(() -> new ResourceNotFoundException("User to Unfollow not found !!"));


        // update counters in DB
        follower.setFollowingCount(Math.max(0L, safeLong(follower.getFollowingCount()) - 1));
        following.setFollowersCount(Math.max(0L, safeLong(following.getFollowersCount()) - 1));
        userRepository.save(follower);
        userRepository.save(following);

        // delete follow row after adjusting counts (order can vary, but within same tx)
        followRepository.delete(follow.get());



        // update caches
        updateFollowingCountCache(followerId, follower.getFollowingCount());
        updateFollowersCountCache(followingId, following.getFollowersCount());

    }

    // update counters in DB


    @Override
    @Cacheable(value = "followersCount", key = "#userId")
    public long getFollowersCount(Long userId) {
        // If cache miss, compute from DB
        return followRepository.countByFollowingId(userId);
    }

    /**
     * Returns following count; cached by cache name "followingCount" keyed by userId.
     */
    @Override
    @Cacheable(value = "followingCount", key = "#userId")
    public long getFollowingCount(Long userId) {
        return followRepository.countByFollowerId(userId);
    }




    @Override
    public List<UserResponse> getFollwersList(Long userId) {

        // Ensure user exists
        userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        // Fetch all followers (rows where userId is being followed)
        List<Follow> followers = followRepository.findByFollowingId(userId);

        // Map directly to UserResponse (NO helper method)
        return followers.stream()
                .map(f -> new UserResponse(
                        f.getFollower().getId(),
                        f.getFollower().getUsername(),
                        f.getFollower().getEmail(),
                        f.getFollower().getDisplayname()
                ))
                .toList();
    }



    @Override
    public List<UserResponse> getFollwingList(Long userId) {

        // Ensure user exists
        userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        // Fetch all followings (rows where userId is the follower)
        List<Follow> followings = followRepository.findByFollowerId(userId);

        // Map directly to UserResponse (NO helper method)
        return followings.stream()
                .map(f -> new UserResponse(
                        f.getFollowing().getId(),
                        f.getFollowing().getUsername(),
                        f.getFollowing().getEmail(),
                        f.getFollowing().getDisplayname()
                ))
                .toList();
    }



    // ===== helper methods to update cache after DB change =====
    // Because @CachePut only applies when the annotated method is called,
    // we declare small public methods and call them after state changes.

    @CachePut(value = "followersCount", key = "#userId")
    public long updateFollowersCountCache(Long userId, long newCount) {
        return newCount;
    }

    @CachePut(value = "followingCount", key = "#userId")
    public long updateFollowingCountCache(Long userId, long newCount) {
        return newCount;
    }

    // convenience wrappers to keep names consistent:
    private void updateFollowersCountCache(Long userId, Long count) {
        updateFollowersCountCache(userId, count == null ? 0L : count);
    }
    private void updateFollowingCountCache(Long userId, Long count) {
        updateFollowingCountCache(userId, count == null ? 0L : count);
    }

    private long safeLong(Long l) {
        return l == null ? 0L : l;
    }


}



