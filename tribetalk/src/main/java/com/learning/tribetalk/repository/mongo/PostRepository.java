package com.learning.tribetalk.repository.mongo;


import com.learning.tribetalk.entity.mongo.Post;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Repository
public interface PostRepository extends MongoRepository<Post, String> {
    List<Post> findByUserIdAndScheduledAtIsNullOrderByCreatedAtDesc(Long userId, Instant now);
    List<Post> findByScheduledAtIsNullOrderByCreatedAtDesc();
    List<Post> findByLikedByContains(Long userId);
    List<Post> findByBookmarkedByContains(Long userId);
    List<Post> findByReplyToPostIdOrderByCreatedAtDesc(String postId);
    Optional<Post> findById(String id);
    List<Post> findByScheduledAtBefore(Instant now);
}
