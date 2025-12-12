package com.learning.tribetalk.scheduler;

import com.learning.tribetalk.entity.mongo.Post;
import com.learning.tribetalk.repository.mongo.PostRepository;
import com.learning.tribetalk.service.mongo.PostService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class ScheduledPostPublisher {
    private final PostRepository postRepository;
    private final PostService postService;

    @Scheduled(fixedRate = 30000)
    public void publishDuePosts() {
        Instant now = Instant.now();
        List<Post> duePosts = postRepository.findByScheduledAtBefore(now);

        if (duePosts.isEmpty()) {
            return;
        }
        log.info("Found {} scheduled posts to publish at {}", duePosts.size(), now);

        for (Post post : duePosts) {
            try {
                post.setScheduledAt(null);
                post.setCreatedAt(now);
                postRepository.save(post);
                postService.afterPostPublished(post);
                log.info("Published scheduled post {}", post.getId());
            } catch (Exception e) {
                log.error("Failed to publish scheduled post {}", post.getId(), e);
            }
        }
    }


}
