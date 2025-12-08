package com.learning.tribetalk.repository.mongo;


import com.learning.tribetalk.entity.mongo.Post;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;

@Repository
public interface PostRepository extends MongoRepository<Post, String> {

    @Query("{ 'userId': ?0, $or: [ { 'scheduledAt': { $lt: ?1 } }, { 'scheduledAt': null } ] }")
    List<Post> findByUserIdAndScheduledAtBeforeOrScheduledAtIsNull(Long userId, Instant now);


    List<Post> findByScheduledAtBeforeOrScheduledAtIsNullOrderByCreatedAtDesc(Instant now);
    List<Post> findByLikedByContains(Long userId);
    List<Post> findByBookmarkedByContains(Long userId);

    List<Post> findByReplyToPostIdOrderByCreatedAtDesc(String postId);
}
