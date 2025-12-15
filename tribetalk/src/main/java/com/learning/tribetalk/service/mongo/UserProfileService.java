package com.learning.tribetalk.service.mongo;

import com.learning.tribetalk.dto.request.UserProfileRequest;
import com.learning.tribetalk.dto.response.UserProfileResponse;
import org.springframework.web.multipart.MultipartFile;

public interface UserProfileService {

    UserProfileResponse getProfile(Long userId);

    UserProfileResponse updateProfile(
            Long userId,
            String bio,
            String location,
            MultipartFile profileImage,
            MultipartFile coverImage
    );
}
