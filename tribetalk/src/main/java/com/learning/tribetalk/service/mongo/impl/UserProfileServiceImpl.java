package com.learning.tribetalk.service.mongo.impl;

import com.learning.tribetalk.dto.response.UserProfileResponse;
import com.learning.tribetalk.entity.mongo.UserProfile;
import com.learning.tribetalk.entity.postgres.User;
import com.learning.tribetalk.exception.ResourceNotFoundException;
import com.learning.tribetalk.repository.mongo.UserProfileRepository;
import com.learning.tribetalk.repository.postgres.UserRepository;
import com.learning.tribetalk.service.mongo.S3Service;
import com.learning.tribetalk.service.mongo.UserProfileService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.Duration;
import java.time.Instant;

@Service
public class UserProfileServiceImpl implements UserProfileService {

    private static final String DEFAULT_AVATAR_URL =
            "https://s3://tribetalk-media-images/default_profile_icon.jpg";

    private static final String DEFAULT_COVER_URL =
            "https://s3://tribetalk-media-images/default_cover_picture_tribetalk_logo.png";

    private final UserProfileRepository profileRepo;
    private final UserRepository userRepo;
    private final S3Service s3Service;

    public UserProfileServiceImpl(UserProfileRepository profileRepo,
                                  UserRepository userRepo,
                                  S3Service s3Service) {
        this.profileRepo = profileRepo;
        this.userRepo = userRepo;
        this.s3Service = s3Service;
    }

    @Override
    @Transactional
    public UserProfileResponse updateProfile(
            Long userId,
            String displayName,
            String bio,
            String location,
            MultipartFile profileImage,
            MultipartFile coverImage
    ) throws IOException {

        // ---- Validate User (Postgres) ----
        User user = userRepo.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        // ---- Load or Create Profile (Mongo) ----
        UserProfile profile = profileRepo.findByUserId(userId)
                .orElseGet(() -> UserProfile.builder()
                        .userId(userId)
                        .username(user.getUsername())
                        .createdAt(Instant.now())
                        .build());

        // ---- TEXT FIELDS ----
        if (displayName != null) profile.setDisplayName(displayName);
        if (bio != null) profile.setBio(bio);
        if (location != null) profile.setLocation(location);

        // ---- PROFILE IMAGE (S3) ----
        if (profileImage != null && !profileImage.isEmpty()) {
            String key = s3Service.uploadFile(profileImage);
            profile.setUserProfilePicture(key);
        }

        // ---- COVER IMAGE (S3) ----
        if (coverImage != null && !coverImage.isEmpty()) {
            String key = s3Service.uploadFile(coverImage);
            profile.setUserCoverPicture(key);
        }

        profileRepo.save(profile);
        return mapToResponse(profile);
    }

    @Override
    public UserProfileResponse getProfile(Long userId) {

        UserProfile profile = profileRepo.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Profile not found"));

        return mapToResponse(profile);
    }

    // ==============================
    // Mapping
    // ==============================
    private UserProfileResponse mapToResponse(UserProfile profile) {

        String profileUrl = profile.getUserProfilePicture() != null
                ? s3Service.generatePresignedUrl(
                profile.getUserProfilePicture(),
                Duration.ofHours(1))
                : DEFAULT_AVATAR_URL;

        String coverUrl = profile.getUserCoverPicture() != null
                ? s3Service.generatePresignedUrl(
                profile.getUserCoverPicture(),
                Duration.ofHours(1))
                : DEFAULT_COVER_URL;

        return new UserProfileResponse(
                profile.getUserId(),
                profile.getDisplayName(),
                profile.getBio(),
                profile.getLocation(),
                profileUrl,
                coverUrl,
                profile.getCreatedAt()
        );
    }
}
