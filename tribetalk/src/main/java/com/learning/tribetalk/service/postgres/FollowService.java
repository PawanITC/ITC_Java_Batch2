package com.learning.tribetalk.service.postgres;


import java.util.List;

public interface FollowService {

    public void follow(Long followerId, Long followingId);
    public void  unFollow(Long followerId, Long followingId);

    // cache-backed read APIs
    long getFollowersCount(Long userId);
    long getFollowingCount(Long userId);

    // get the list of follwers from userId
    List<Long> getFollowersIds(Long userId);
    List<Long> getFollowingIds(Long userId);

}
