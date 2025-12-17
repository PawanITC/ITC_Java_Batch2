package com.learning.tribetalk.service.mongo.impl;

import com.learning.tribetalk.dto.NotificationDTO;
import com.learning.tribetalk.dto.request.PostCreateRequest;
import com.learning.tribetalk.dto.response.PostResponse;
import com.learning.tribetalk.dto.response.UserResponse;
import com.learning.tribetalk.entity.NotificationType;
import com.learning.tribetalk.entity.mongo.Post;
import com.learning.tribetalk.mapper.PostMapper;
import com.learning.tribetalk.repository.mongo.PostRepository;
import com.learning.tribetalk.service.NotificationProducer;
import com.learning.tribetalk.service.mongo.PostService;
import com.learning.tribetalk.service.mongo.S3Service;
import com.learning.tribetalk.service.postgres.FollowService;
import com.learning.tribetalk.service.postgres.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class PostServiceImpl implements PostService {

    private final PostRepository postRepository;
    private final S3Service s3Service;
    private final FollowService followService;
    private final NotificationProducer notificationProducer;
    private final UserService userService;
    private final RedisTemplate<String, PostResponse> redisTemplate;

    private String postKey(String postId) {
        return "tribetalk:post:" + postId;
    }

    // Helper: write-through update
    private PostResponse writeThrough(Post post) {
        PostResponse response = mapToResponse(post);
        redisTemplate.opsForValue().set(postKey(post.getId()), response);
        return response;
    }

    // Helper: read from Redis first, fallback to DB
    private PostResponse loadPost(String postId) {
        String key = postKey(postId);

        PostResponse cached = redisTemplate.opsForValue().get(key);
        if (cached != null) return cached;

        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("Post not found"));

        return writeThrough(post);
    }

    @Override
    @CacheEvict(value = {"posts", "userPosts", "likedPosts", "bookmarkedPosts", "replies"}, allEntries = true)
    public PostResponse save(PostCreateRequest request, List<MultipartFile> media) throws IOException {
        //Map DTO -> Entity
        Post post = PostMapper.toEntity(request);

        // Handle media upload
        if (media != null && !media.isEmpty()) {
            List<Post.Media> mediaList = new ArrayList<>();
            for (MultipartFile file : media) {
                String key = s3Service.uploadFile(file);
                mediaList.add(new Post.Media(key, file.getContentType()));
            }
            post.setMediaList(mediaList);
        }

        Post savedPost = postRepository.save(post);
        // Write-through cache
        PostResponse response = writeThrough(savedPost);
        afterPostPublished(savedPost);

        return response;
    }

    @Override
    public void afterPostPublished(Post savedPost) {
        // Handle reply logic
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

        // If this is a reply, notify ONLY the parent post owner
        if (savedPost.getReplyToPostId() != null) {
            postRepository.findById(savedPost.getReplyToPostId()).ifPresent(parent -> {
                NotificationDTO event = NotificationDTO.builder()
                        .recipientId(parent.getUserId().toString())
                        .actorId(savedPost.getUserId().toString())
                        .type(NotificationType.REPLY)
                        .resourceId(savedPost.getId())
                        .createdAt(Instant.now())
                        .build();

                notificationProducer.sendNotification(event);
            });

        } else {
            // Normal post → notify all followers
            List<UserResponse> followers = followService.getFollwersList(savedPost.getUserId());

            for (UserResponse follower : followers) {
                NotificationDTO event = NotificationDTO.builder()
                        .recipientId(follower.id().toString())
                        .actorId(savedPost.getUserId().toString())
                        .type(NotificationType.POST)
                        .resourceId(savedPost.getId())
                        .createdAt(Instant.now())
                        .build();

                notificationProducer.sendNotification(event);
            }
        }

        // Refresh Redis cache
        writeThrough(savedPost);
    }

    @Override
    @Cacheable(value = "userPosts", key = "#userId")
    public List<PostResponse> findByUserId(Long userId) {
        Instant now = Instant.now();
        return postRepository
                .findByUserIdAndScheduledAtIsNullOrderByCreatedAtDesc(userId, now)
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Override
    @Cacheable(value = "posts")
    public List<PostResponse> getAll() {
        // Instant now = Instant.now();
        return postRepository
                .findByScheduledAtIsNullOrderByCreatedAtDesc()
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Override
    @CacheEvict(value = {"posts", "userPosts", "likedPosts", "bookmarkedPosts", "replies"}, allEntries = true)
    public PostResponse vote(String postId, int optionIndex, Long userId) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new IllegalArgumentException("Post not found"));

        if (post.getPoll() == null || post.getPoll().expiresAt().isBefore(Instant.now())) {
            throw new IllegalStateException("Poll expired or not available");
        }

        List<Post.PollOption> options = new ArrayList<>(post.getPoll().options());

        // Undo previous vote
        if (post.getUserVotes().containsKey(userId)) {
            int previousIndex = post.getUserVotes().get(userId);
            Post.PollOption prev = options.get(previousIndex);
            options.set(previousIndex, new Post.PollOption(prev.option(), prev.votes() - 1));

            post.getUserVotes().remove(userId);
            post.getVotedBy().remove(userId);
        }

        //  Apply new vote
        if (!post.getVotedBy().contains(userId)) {
            Post.PollOption selected = options.get(optionIndex);
            options.set(optionIndex, new Post.PollOption(selected.option(), selected.votes() + 1));

            post.getVotedBy().add(userId);
            post.getUserVotes().put(userId, optionIndex);
        }

        post.setPoll(new Post.Poll(options, post.getPoll().expiresAt()));
        Post updated = postRepository.save(post);

        return writeThrough(post);
    }


    @Override
    @CacheEvict(value = {"posts", "userPosts", "likedPosts", "bookmarkedPosts", "replies"}, allEntries = true)
    public PostResponse likePost(String postId, Long userId) {
        PostResponse cached = loadPost(postId);
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

        return writeThrough(post);
    }

    @Override
    @CacheEvict(value = {"posts", "userPosts", "likedPosts", "bookmarkedPosts", "replies"}, allEntries = true)
    public PostResponse unlikePost(String postId, Long userId) {

        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new IllegalArgumentException("Post not found"));

        if (post.getLikedBy().remove(userId)) {
            post.setLikeCount(post.getLikeCount() - 1);
            postRepository.save(post);
        }
        return writeThrough(post);
    }

    @Override
    @Cacheable(value = "likedPosts", key = "#userId")
    public List<PostResponse> getLikedPostsByUser(Long userId) {
        return postRepository
                .findByLikedByContains(userId)
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Override
    @CacheEvict(value = {"posts", "userPosts", "likedPosts", "bookmarkedPosts", "replies"}, allEntries = true)
    public PostResponse addBookmark(String postId, Long userId) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new IllegalArgumentException("Post not found"));
        if (post.getBookmarkedBy().add(userId)) {
            postRepository.save(post);
        }

        return writeThrough(post);
    }

    @Override
    @CacheEvict(value = {"posts", "userPosts", "likedPosts", "bookmarkedPosts", "replies"}, allEntries = true)
    public PostResponse removeBookmark(String postId, Long userId) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new IllegalArgumentException("Post not found"));

        if (post.getBookmarkedBy() != null && post.getBookmarkedBy().remove(userId)) {
            postRepository.save(post);
        }
        return writeThrough(post);
    }

    @Override
    @Cacheable(value = "bookmarkedPosts", key = "#userId")
    public List<PostResponse> getBookmarkedByUser(Long userId) {
        return postRepository.findByBookmarkedByContains(userId)
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Override
    @Cacheable(value = "replies", key = "#postId")
    public List<PostResponse> getReplies(String postId) {
        return postRepository.findByReplyToPostIdOrderByCreatedAtDesc(postId)
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Override
    @CacheEvict(value = {"posts", "userPosts", "likedPosts", "bookmarkedPosts", "replies"}, allEntries = true)
    public void deletePost(String postId) {
        Post post = postRepository.findById(postId).orElseThrow(() -> new IllegalArgumentException("Post not found"));

        //  update parent reply count
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

        // Delete all media
        deleteAllMedia(post);

        postRepository.delete(post);

        // Also clear single post cache in Redis
        redisTemplate.delete(postKey(postId));

        log.info("Deleted post {} and cleaned up related data", postId);
    }

    @Override
    @CacheEvict(value = {"posts", "userPosts", "likedPosts", "bookmarkedPosts", "replies"}, allEntries = true)
    public PostResponse findByPostId(String postId) {
        PostResponse cached = loadPost(postId);

        Post post = postRepository.findById(postId).orElseThrow(() -> new RuntimeException("Post not found"));
        // Increment view count
        post.setViewCount(post.getViewCount() + 1);
        postRepository.save(post);
        return writeThrough(post);
    }


    //Helper methods

    private List<String> generatePresignedUrls(Post post) {
        if (post.getMediaList() == null) return null;

        return post.getMediaList().stream()
                .map(m -> s3Service.generatePresignedUrl(m.url(), Duration.ofMinutes(15)))
                .toList();
    }
    @Override
     public PostResponse mapToResponse(Post post) {
        List<String> urls = generatePresignedUrls(post);
        return PostMapper.toResponse(post, urls);
    }

    private void deleteAllMedia(Post post) {
        if (post.getMediaList() == null) return;

        for (Post.Media m : post.getMediaList()) {
            try {
                s3Service.deleteFile(m.url());
            } catch (Exception e) {
                log.error("Failed to delete media from S3 for post {}", post.getId(), e);
            }
        }
    }
}


