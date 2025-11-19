package com.learning.tribetalk.service;

import com.learning.tribetalk.dto.PostCreateRequest;
import com.learning.tribetalk.dto.PostResponse;
import com.learning.tribetalk.entity.Post;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;


public interface PostService {
    PostResponse save(PostCreateRequest request, MultipartFile media) throws IOException;

    List<PostResponse> findByUserId(Long userId);

    List<PostResponse> getAll();

    PostResponse vote(String postId, int optionIndex);
}
