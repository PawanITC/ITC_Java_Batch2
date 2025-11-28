package com.learning.tribetalk.service.mongo;

import com.learning.tribetalk.dto.request.PostCreateRequest;
import com.learning.tribetalk.dto.response.PostResponse;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;


public interface PostService {
    PostResponse save(PostCreateRequest request, MultipartFile media) throws IOException;

    List<PostResponse> findByUserId(Long userId);

    List<PostResponse> getAll();

    PostResponse vote(String postId, int optionIndex);
    PostResponse likePost(String postId, Long userId);
    PostResponse unlikePost(String postId, Long userId);

    List<PostResponse> getLikedPostsByUser(Long userId);

    PostResponse addBookmark(String postId, Long userId);

    PostResponse removeBookmark(String postId, Long userId);

    List<PostResponse> getBookmarkedByUser(Long userId);
    List<PostResponse> getReplies(String postId);

    void deletePost(String postId);
}
