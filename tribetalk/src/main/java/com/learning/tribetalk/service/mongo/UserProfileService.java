package com.learning.tribetalk.service.mongo;

import com.learning.tribetalk.dto.request.UserProfileRequest;
import com.learning.tribetalk.dto.response.UserProfileResponse;

public interface UserProfileService {

    UserProfileResponse getProfile(Long userId);

    UserProfileResponse updateProfile(Long userId, UserProfileRequest request);
}