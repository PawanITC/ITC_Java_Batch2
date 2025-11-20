package com.learning.tribetalk.service.mongo.impl;

import com.learning.tribetalk.dto.request.PostCreateRequest;
import com.learning.tribetalk.dto.response.PostResponse;
import com.learning.tribetalk.entity.mongo.Post;
import com.learning.tribetalk.mapper.PostMapper;
import com.learning.tribetalk.repository.mongo.PostRepository;
import com.learning.tribetalk.service.mongo.PostService;
import com.learning.tribetalk.service.mongo.S3Service;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Service
public class PostServiceImpl implements PostService {

    private final PostRepository postRepository;
    private final S3Service s3Service;

    public PostServiceImpl(PostRepository postRepository, S3Service s3Service) {
        this.postRepository = postRepository;
        this.s3Service = s3Service;
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

        String presignedUrl = null;
        if (savedPost.getMedia() != null) {
            presignedUrl = s3Service.generatePresignedUrl(savedPost.getMedia().url(), Duration.ofMinutes(15));
        }
        PostResponse response = PostMapper.toResponse(savedPost, presignedUrl);

        return response;
    }

    @Override
    @Cacheable(value = "userPosts", key = "#userId")
    public List<PostResponse> findByUserId(Long userId) {
        int times = 0;
        System.out.println("Fetching posts from DB - userid "+times++);
        Instant now = Instant.now();
        return postRepository
                .findScheduledOrUnscheduledByUserIdOrderByCreatedAtDesc(userId, now)
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
    @CacheEvict(value = {"posts","userPosts"}, allEntries = true)
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


}