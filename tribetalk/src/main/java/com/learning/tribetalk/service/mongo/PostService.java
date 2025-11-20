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
}
