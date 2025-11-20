package com.learning.tribetalk.repository.postgres;

import com.learning.tribetalk.entity.postgres.Follow;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface FollowRepository extends JpaRepository<Follow, Long> {
    Optional<Follow> findByFollowerIdAndFollowingId(Long followerId, Long followingId);
    long countByFollowingId(Long followerId); // number of followers for followedId
    long countByFollowerId(Long followingId);
    List<Follow> findByFollowingId(Long followingId);
    List<Follow> findByFollowerId(Long followerId);

}
