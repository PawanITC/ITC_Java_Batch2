package com.learning.tribetalk.repository;


import com.learning.tribetalk.entity.Post;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;

@Repository
public interface PostRepository extends MongoRepository<Post, String> {
    List<Post> findByUserIdAndScheduledAtBeforeOrScheduledAtIsNullOrderByCreatedAtDesc(Long userId, Instant now);

    List<Post> findByScheduledAtBeforeOrScheduledAtIsNullOrderByCreatedAtDesc(Instant now);
}
