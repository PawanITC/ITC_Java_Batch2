package com.learning.tribetalk.service.mongo;

import com.learning.tribetalk.dto.request.PostCreateRequest;
import com.learning.tribetalk.dto.response.PostResponse;
import com.learning.tribetalk.entity.mongo.Post;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;


public interface PostService {
    PostResponse save(PostCreateRequest request, List<MultipartFile> media) throws IOException;
    void afterPostPublished(Post savedPost);
    List<PostResponse> findByUserId(Long userId);
    List<PostResponse> getAll();
    PostResponse vote(String postId, int optionIndex, Long userId);
    PostResponse likePost(String postId, Long userId);
    PostResponse unlikePost(String postId, Long userId);
    List<PostResponse> getLikedPostsByUser(Long userId);
    PostResponse addBookmark(String postId, Long userId);
    PostResponse removeBookmark(String postId, Long userId);
    List<PostResponse> getBookmarkedByUser(Long userId);
    List<PostResponse> getReplies(String postId);
    void deletePost(String postId);
    PostResponse findByPostId(String postId);
    PostResponse mapToResponse(Post post);
}
