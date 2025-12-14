package com.learning.tribetalk.service.mongo.impl;

import com.learning.tribetalk.dto.request.UserProfileRequest;
import com.learning.tribetalk.dto.response.UserProfileResponse;
import com.learning.tribetalk.entity.mongo.UserProfile;
import com.learning.tribetalk.exception.ResourceNotFoundException;
import com.learning.tribetalk.repository.mongo.UserProfileRepository;
import com.learning.tribetalk.service.mongo.UserProfileService;
import org.springframework.stereotype.Service;

@Service
public class UserProfileServiceImpl implements UserProfileService {

    private final UserProfileRepository repository;

    public UserProfileServiceImpl(UserProfileRepository repository) {
        this.repository = repository;
    }

    @Override
    public UserProfileResponse getProfile(Long userId) {
        UserProfile profile = repository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Profile not found"));

        return mapToResponse(profile);
    }

    @Override
    public UserProfileResponse updateProfile(Long userId, UserProfileRequest request) {
        UserProfile profile = repository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Profile not found"));

        if (request.bio() != null) profile.setBio(request.bio());
        if (request.location() != null) profile.setLocation(request.location());
        if (request.profilePicture() != null) profile.setUserProfilePicture(request.profilePicture());
        if (request.coverPicture() != null) profile.setUserCoverPicture(request.coverPicture());

        repository.save(profile);
        return mapToResponse(profile);
    }

    private UserProfileResponse mapToResponse(UserProfile profile) {
        return new UserProfileResponse(
                profile.getUserId(),
                profile.getUsername(),
                profile.getDisplayName(),
                profile.getBio(),
                profile.getLocation(),
                profile.getUserProfilePicture(),
                profile.getUserCoverPicture()
        );
    }
}
