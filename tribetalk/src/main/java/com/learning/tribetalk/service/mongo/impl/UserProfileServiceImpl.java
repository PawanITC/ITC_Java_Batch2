package com.learning.tribetalk.service.mongo.impl;

import com.learning.tribetalk.dto.request.UserProfileRequest;
import com.learning.tribetalk.dto.response.UserProfileResponse;
import com.learning.tribetalk.entity.mongo.UserProfile;
import com.learning.tribetalk.exception.ResourceNotFoundException;
import com.learning.tribetalk.repository.mongo.UserProfileRepository;
import com.learning.tribetalk.service.mongo.S3Service;
import com.learning.tribetalk.service.mongo.UserProfileService;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.Duration;

@Service
public class UserProfileServiceImpl implements UserProfileService {

    private static final String DEFAULT_AVATAR_URL =
            "https://s3://tribetalk-media-images/default_profile_icon.jpg";

    private static final String DEFAULT_COVER_URL =
            "https://s3://tribetalk-media-images/default_cover_picture_tribetalk_logo.png";
    private final UserProfileRepository repository;
    private final S3Service s3Service;

    public UserProfileServiceImpl(UserProfileRepository repository, S3Service s3Service) {
        this.repository = repository;
        this.s3Service = s3Service;
    }

    @Override
    public UserProfileResponse getProfile(Long userId) {
        UserProfile profile = repository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Profile not found"));

        return mapToResponse(profile);
    }

    @Override
    public UserProfileResponse updateProfile(
            Long userId,
            String bio,
            String location,
            MultipartFile profileImage,
            MultipartFile coverImage
    ) {

        UserProfile profile = repository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Profile not found"));

        try {
            if (profileImage != null) {
                if (profile.getUserProfilePicture() != null) {
                    s3Service.deleteFile(profile.getUserProfilePicture());
                }
                profile.setUserProfilePicture(s3Service.uploadFile(profileImage));
            }

            if (coverImage != null) {
                if (profile.getUserCoverPicture() != null) {
                    s3Service.deleteFile(profile.getUserCoverPicture());
                }
                profile.setUserCoverPicture(s3Service.uploadFile(coverImage));
            }
        } catch (IOException e) {
            throw new RuntimeException("S3 upload failed", e);
        }

        if (bio != null) profile.setBio(bio);
        if (location != null) profile.setLocation(location);

        repository.save(profile);
        return mapToResponse(profile);
    }

    private UserProfileResponse mapToResponse(UserProfile profile) {

        String profileUrl = profile.getUserProfilePicture() != null
                ? s3Service.generatePresignedUrl(
                profile.getUserProfilePicture(), Duration.ofHours(1))
                : DEFAULT_AVATAR_URL;

        String coverUrl = profile.getUserCoverPicture() != null
                ? s3Service.generatePresignedUrl(
                profile.getUserCoverPicture(), Duration.ofHours(1))
                : DEFAULT_COVER_URL;

        return new UserProfileResponse(
                profile.getUserId(),
                profile.getUsername(),
                profile.getDisplayName(),
                profile.getBio(),
                profile.getLocation(),
                profileUrl,
                coverUrl,
                profile.getCreatedAt()
        );
    }

}
