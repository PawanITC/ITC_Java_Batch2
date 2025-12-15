package com.learning.tribetalk.service.mongo;

import com.learning.tribetalk.dto.request.UserProfileRequest;
import com.learning.tribetalk.dto.response.UserProfileResponse;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

public interface UserProfileService {


    @Transactional
    UserProfileResponse updateProfile(
            Long userId,
            String displayName,
            String bio,
            String location,
            MultipartFile profileImage,
            MultipartFile coverImage
    ) throws IOException;

    UserProfileResponse getProfile(Long userId);
}
