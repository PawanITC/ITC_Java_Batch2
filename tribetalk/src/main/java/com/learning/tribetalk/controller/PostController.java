package com.learning.tribetalk.controller;

import com.learning.tribetalk.dto.request.PostCreateRequest;
import com.learning.tribetalk.dto.response.PostResponse;
import com.learning.tribetalk.service.mongo.PostService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/api/v1/posts")
class PostController {

    private final PostService postService;

    public PostController(PostService postService) {
        this.postService = postService;

    }


    @PostMapping("/create")
    public ResponseEntity<PostResponse> createPost(
            @RequestPart("data") @Valid PostCreateRequest request,
            @RequestPart(value = "media", required = false) MultipartFile media) throws IOException {
        PostResponse saved = postService.save(request, media);
        return ResponseEntity.ok(saved);
    }


    @GetMapping("/userPost")
    public ResponseEntity<List<PostResponse>> getPostByUserId(@RequestParam Long userId) {
        List<PostResponse> posts = postService.findByUserId(userId);
        return ResponseEntity.ok(posts);
    }

    @GetMapping("/all")
    public ResponseEntity<List<PostResponse>> getAllPosts() {
        List<PostResponse> posts = postService.getAll();
        return ResponseEntity.ok(posts);
    }

    @PostMapping("/{postId}/vote")
    public ResponseEntity<PostResponse> vote(@PathVariable String postId, @RequestParam int optionIndex) {
        PostResponse response = postService.vote(postId, optionIndex);
        return ResponseEntity.ok(response);
    }


    @PostMapping("/{postId}/like")
    public ResponseEntity<PostResponse> likePost(@PathVariable String postId, @RequestParam Long userId) {
        PostResponse response = postService.likePost(postId, userId);
        return ResponseEntity.ok(response);
    }


    @DeleteMapping("/{postId}/unlike")
    public ResponseEntity<PostResponse> unlikePost(@PathVariable String postId, @RequestParam Long userId) {
        PostResponse response = postService.unlikePost(postId, userId);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/liked")
    public ResponseEntity<List<PostResponse>> getLikedPostByUser(@RequestParam Long userId) {
        List<PostResponse> responses = postService.getLikedPostsByUser(userId);
        return ResponseEntity.ok(responses);
    }

    @PostMapping("/{postId}/bookmark")
    public ResponseEntity<PostResponse> addBookmark(@PathVariable String postId, @RequestParam Long userId) {
        PostResponse response = postService.addBookmark(postId, userId);
        return ResponseEntity.ok(response);
    }


    @DeleteMapping("/{postId}/removeBookmark")
    public ResponseEntity<PostResponse> removeBookmark(@PathVariable String postId, @RequestParam Long userId) {
        PostResponse response = postService.removeBookmark(postId, userId);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/bookmarked")
    public ResponseEntity<List<PostResponse>> getBookmarkedByUser(@RequestParam Long userId) {
        List<PostResponse> responses = postService.getBookmarkedByUser(userId);
        return ResponseEntity.ok(responses);
    }

    @GetMapping("/{postId}/replies")
    public List<PostResponse> getReplies(@PathVariable String postId) {
        return postService.getReplies(postId);
    }

    @DeleteMapping("/{postId}")
    public ResponseEntity<Void> deletePost(@PathVariable String postId) {
        postService.deletePost(postId);
        return ResponseEntity.noContent().build();
    }


}

