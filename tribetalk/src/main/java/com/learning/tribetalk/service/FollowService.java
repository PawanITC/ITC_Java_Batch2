package com.learning.tribetalk.service;


public interface FollowService {

    public void follow(Long followerId, Long followingId);
    public void  unFollow(Long followerId, Long followingId);

    // cache-backed read APIs
    long getFollowersCount(Long userId);
    long getFollowingCount(Long userId);
}
