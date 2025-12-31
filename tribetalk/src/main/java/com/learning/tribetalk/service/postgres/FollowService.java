package com.learning.tribetalk.service.postgres;


import com.learning.tribetalk.dto.response.UserResponse;

import java.util.List;

public interface FollowService {

    public void follow(Long followerId, Long followingId);
    public void  unFollow(Long followerId, Long followingId);

    // cache-backed read APIs
    long getFollowersCount(Long userId);
    long getFollowingCount(Long userId);



    List<UserResponse> getFollwersList(Long userId);
    List<UserResponse> getFollwingList(Long userId);


}
