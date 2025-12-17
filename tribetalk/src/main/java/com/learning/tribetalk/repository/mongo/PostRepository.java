package com.learning.tribetalk.repository.mongo;


import com.learning.tribetalk.entity.mongo.Post;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
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

    // Search feature
    List<Post> findByTextContainingIgnoreCaseOrderByCreatedAtDesc(String text);

    List<Post> findByHashtagsContainingIgnoreCaseOrderByCreatedAtDesc(String hashtag);

    List<Post> findByMentionsContainingIgnoreCaseOrderByCreatedAtDesc(String mention);

    // Autocomplete hashtags (for dropdown)
    @Query(value = "{ 'hashtags': { $regex: '^?0', $options: 'i' } }", fields = "{ 'hashtags': 1 }")
    List<Post> findDistinctHashtagsStartingWith(String prefix);
}
