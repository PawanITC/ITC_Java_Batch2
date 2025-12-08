package com.learning.tribetalk.service.mongo.impl;

import com.learning.tribetalk.dto.NotificationDTO;
import com.learning.tribetalk.dto.request.PostCreateRequest;
import com.learning.tribetalk.dto.response.PostResponse;
import com.learning.tribetalk.entity.NotificationType;
import com.learning.tribetalk.entity.mongo.Post;
import com.learning.tribetalk.mapper.PostMapper;
import com.learning.tribetalk.repository.mongo.PostRepository;
import com.learning.tribetalk.service.NotificationProducer;
import com.learning.tribetalk.service.mongo.PostService;
import com.learning.tribetalk.service.mongo.S3Service;
import com.learning.tribetalk.service.postgres.FollowService;
import com.learning.tribetalk.service.postgres.UserService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Slf4j
@Service
public class PostServiceImpl implements PostService {

    private final PostRepository postRepository;
    private final S3Service s3Service;
    private final FollowService followService;
    private final NotificationProducer notificationProducer;
    private final UserService userService;

    //private static final Logger log = LoggerFactory.getLogger(PostServiceImpl.class);

    public PostServiceImpl(PostRepository postRepository, S3Service s3Service, FollowService followService, NotificationProducer notificationProducer, UserService userService) {
        this.postRepository = postRepository;
        this.s3Service = s3Service;
        this.followService = followService;
        this.notificationProducer = notificationProducer;
        this.userService = userService;
    }

    @Override
    @CacheEvict(value = {"posts", "userPosts"}, allEntries = true)
    public PostResponse save(PostCreateRequest request, MultipartFile media) throws IOException {
        //Map DTO -> Entity
        Post post = PostMapper.toEntity(request);

        // Handle media upload
        if (media != null && !media.isEmpty()) {
            String key = s3Service.uploadFile(media);
            post.setMedia(new Post.Media(key, media.getContentType()));
        }

        Post savedPost = postRepository.save(post);

        if (savedPost.getReplyToPostId() != null) {
            postRepository.findById(savedPost.getReplyToPostId()).ifPresent(parent -> {
                parent.setReplyCount(parent.getReplyCount() + 1);
                postRepository.save(parent);

                userService.findByUserId(parent.getUserId()).ifPresent(parentUser -> {
                    String replyToUsername = parentUser.username();
                    savedPost.setReplyToUsername(replyToUsername);
                    postRepository.save(savedPost);
                });

            });
        }

        String presignedUrl = null;
        if (savedPost.getMedia() != null) {
            presignedUrl = s3Service.generatePresignedUrl(savedPost.getMedia().url(), Duration.ofMinutes(15));
        }

        //  Notify followers
//        List<Long> followerIds = followService.getFollowersIds(savedPost.getUserId());
//        for (Long followerId : followerIds) {
//            NotificationDTO event = NotificationDTO.builder()
//                    .recipientId(followerId.toString())
//                    .actorId(savedPost.getUserId().toString())
//                    .type(NotificationType.POST)
//                    .resourceId(savedPost.getId())
//                    .createdAt(Instant.now())
//                    .build();
//
//            notificationProducer.sendNotification(event);
//        }

        return PostMapper.toResponse(savedPost, presignedUrl);
    }

    @Override
    @Cacheable(value = "userPosts", key = "#userId")
    public List<PostResponse> findByUserId(Long userId) {
        Instant now = Instant.now();
        return postRepository
                .findByUserIdAndScheduledAtBeforeOrScheduledAtIsNull(userId, now)
                .stream()
                .map(post -> {
                    String presignedUrl = post.getMedia() != null
                            ? s3Service.generatePresignedUrl(post.getMedia().url(), Duration.ofMinutes(15))
                            : null;
                    return PostMapper.toResponse(post, presignedUrl);
                })
                .toList();

    }

    @Override
    @Cacheable(value = "posts")
    public List<PostResponse> getAll() {
        System.out.println("Fetching posts from DB...");
        Instant now = Instant.now();
        return postRepository
                .findByScheduledAtBeforeOrScheduledAtIsNullOrderByCreatedAtDesc(now)
                .stream()
                .map(post -> {
                    String presignedUrl = post.getMedia() != null
                            ? s3Service.generatePresignedUrl(post.getMedia().url(), Duration.ofMinutes(15))
                            : null;
                    return PostMapper.toResponse(post, presignedUrl);
                }).toList();
    }

    @Override
    @CacheEvict(value = {"posts", "userPosts"}, allEntries = true)
    public PostResponse vote(String postId, int optionIndex) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new IllegalArgumentException("Post not found"));

        if (post.getPoll() == null || post.getPoll().expiresAt().isBefore(Instant.now())) {
            throw new IllegalStateException("Poll expired or not available");
        }

        List<Post.PollOption> options = new ArrayList<>(post.getPoll().options());
        if (optionIndex < 0 || optionIndex >= options.size()) {
            throw new IllegalArgumentException("Invalid option index");
        }
        Post.PollOption selected = options.get(optionIndex);
        options.set(optionIndex, new Post.PollOption(selected.option(), selected.votes() + 1));

        post.setPoll(new Post.Poll(options, post.getPoll().expiresAt()));
        Post updated = postRepository.save(post);

        String presignedUrl = updated.getMedia() != null
                ? s3Service.generatePresignedUrl(updated.getMedia().url(), Duration.ofMinutes(15))
                : null;
        return PostMapper.toResponse(updated, presignedUrl);
    }


    @Override
    @CacheEvict(value = {"posts", "userPosts"}, allEntries = true)
    public PostResponse likePost(String postId, Long userId) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new IllegalArgumentException("Post not found"));

        if (post.getLikedBy().add(userId)) {
            post.setLikeCount(post.getLikeCount() + 1);
            postRepository.save(post);

            // Notify post owner about the like
            NotificationDTO event = NotificationDTO.builder()
                    .recipientId(post.getUserId().toString())
                    .actorId(userId.toString())
                    .type(NotificationType.LIKE)
                    .resourceId(post.getId())
                    .createdAt(Instant.now())
                    .build();

            notificationProducer.sendNotification(event);
        }

        String presignedUrl = post.getMedia() != null
                ? s3Service.generatePresignedUrl(post.getMedia().url(), Duration.ofMinutes(15))
                : null;
        return PostMapper.toResponse(post, presignedUrl);
    }

    @Override
    @CacheEvict(value = {"posts", "userPosts"}, allEntries = true)
    public PostResponse unlikePost(String postId, Long userId) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new IllegalArgumentException("Post not found"));

        if (post.getLikedBy().remove(userId)) {
            post.setLikeCount(post.getLikeCount() - 1);
            postRepository.save(post);
        }

        String presignedUrl = null;
        try {
            if (post.getMedia() != null) {
                presignedUrl = s3Service.generatePresignedUrl(post.getMedia().url(), Duration.ofMinutes(15));
            }
        } catch (Exception e) {
            log.error("Failed to generate presigned URL", e);
            // Don’t block response — just return null
        }
        return PostMapper.toResponse(post, presignedUrl);
    }

    @Override
    public List<PostResponse> getLikedPostsByUser(Long userId) {
        return postRepository
                .findByLikedByContains(userId)
                .stream()
                .map(post -> {
                    String presignedUrl = post.getMedia() != null
                            ? s3Service.generatePresignedUrl(post.getMedia().url(), Duration.ofMinutes(15))
                            : null;
                    return PostMapper.toResponse(post, presignedUrl);
                }).toList();
    }

    @Override
    @CacheEvict(value = {"posts", "userPosts"}, allEntries = true)
    public PostResponse addBookmark(String postId, Long userId) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new IllegalArgumentException("Post not found"));
        if (post.getBookmarkedBy().add(userId)) {
            postRepository.save(post);
        }
        String presignedUrl = post.getMedia() != null
                ? s3Service.generatePresignedUrl(post.getMedia().url(), Duration.ofMinutes(15))
                : null;
        return PostMapper.toResponse(post, presignedUrl);
    }

    @Override
    @CacheEvict(value = {"posts", "userPosts"}, allEntries = true)
    public PostResponse removeBookmark(String postId, Long userId) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new IllegalArgumentException("Post not found"));

        if (post.getBookmarkedBy() != null && post.getBookmarkedBy().remove(userId)) {
            postRepository.save(post);
        }

        String presignedUrl = post.getMedia() != null
                ? s3Service.generatePresignedUrl(post.getMedia().url(), Duration.ofMinutes(15))
                : null;

        return PostMapper.toResponse(post, presignedUrl);
    }

    @Override
    public List<PostResponse> getBookmarkedByUser(Long userId) {
        return postRepository.findByBookmarkedByContains(userId)
                .stream()
                .map(post -> {
                    String presignedUrl = post.getMedia() != null
                            ? s3Service.generatePresignedUrl(post.getMedia().url(), Duration.ofMinutes(15))
                            : null;
                    return PostMapper.toResponse(post, presignedUrl);
                })
                .toList();
    }

    @Override
    public List<PostResponse> getReplies(String postId) {
        return postRepository.findByReplyToPostIdOrderByCreatedAtDesc(postId)
                .stream()
                .map(post -> {
                    String presignedUrl = post.getMedia() != null
                            ? s3Service.generatePresignedUrl(post.getMedia().url(), Duration.ofMinutes(15))
                            : null;
                    return PostMapper.toResponse(post, presignedUrl);
                })
                .toList();
    }

    @Override
    @CacheEvict(value = {"posts", "userPosts"}, allEntries = true)
    public void deletePost(String postId) {
        Post post = postRepository.findById(postId).orElseThrow(() -> new IllegalArgumentException("Post not found"));

        // If reply, update parent reply count
        if (post.getReplyToPostId() != null) {
            postRepository.findById(post.getReplyToPostId()).ifPresent(parent -> {
                parent.setReplyCount(Math.max(0, parent.getReplyCount() - 1));
                postRepository.save(parent);
            });
        }

        // If this is an original post, delete all replies recursively
        List<Post> replies = postRepository.findByReplyToPostIdOrderByCreatedAtDesc(postId);
        for (Post reply : replies) {
            deletePost(reply.getId());
        }

        // Remove media from S3 if present
        if (post.getMedia() != null && post.getMedia().url() != null) {
            try {
                s3Service.deleteFile(post.getMedia().url());
            } catch (Exception e) {
                log.error("Failed to delete media from S3 for post {}", postId, e);
            }
        }

         // Finally delete post
        postRepository.delete(post);

        log.info("Deleted post {} and cleaned up related data", postId);
    }

}


