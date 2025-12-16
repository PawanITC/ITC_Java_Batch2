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

    private final UserProfileRepository profileRepo;
    private final UserRepository userRepo;
    private final S3Service s3Service;

    public UserProfileServiceImpl(
            UserProfileRepository profileRepo,
            UserRepository userRepo,
            S3Service s3Service
    ) {
        this.profileRepo = profileRepo;
        this.userRepo = userRepo;
        this.s3Service = s3Service;
    }

    // =====================================================
    // UPDATE PROFILE
    // =====================================================
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

        User user = userRepo.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        UserProfile profile = profileRepo.findByUserId(userId)
                .orElseGet(() -> UserProfile.builder()
                        .userId(userId)
                        .username(user.getUsername())
                        .createdAt(Instant.now())
                        .build());

        if (displayName != null && !displayName.isBlank()) {
            profile.setDisplayName(displayName);
        }
        if (bio != null) profile.setBio(bio);
        if (location != null) profile.setLocation(location);

        // ---- Profile Image ----
        if (profileImage != null && !profileImage.isEmpty()) {
            if (profile.getUserProfilePicture() != null) {
                s3Service.deleteFile(profile.getUserProfilePicture());
            }
            String key = s3Service.uploadFile(profileImage);
            profile.setUserProfilePicture(key);
        }

        // ---- Cover Image ----
        if (coverImage != null && !coverImage.isEmpty()) {
            if (profile.getUserCoverPicture() != null) {
                s3Service.deleteFile(profile.getUserCoverPicture());
            }
            String key = s3Service.uploadFile(coverImage);
            profile.setUserCoverPicture(key);
        }

        profileRepo.save(profile);
        return mapToResponse(profile);
    }

    // =====================================================
    // GET PROFILE
    // =====================================================
    @Override
    public UserProfileResponse getProfile(Long userId) {

        User user = userRepo.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        UserProfile profile = profileRepo.findByUserId(userId)
                .orElseGet(() ->
                        profileRepo.save(
                                UserProfile.builder()
                                        .userId(userId)
                                        .username(user.getUsername())
                                        .createdAt(Instant.now())
                                        .build()
                        )
                );

        return mapToResponse(profile);
    }

    // =====================================================
    // MAPPING
    // =====================================================
    private UserProfileResponse mapToResponse(UserProfile profile) {

        String profileUrl = profile.getUserProfilePicture() != null
                ? s3Service.generatePresignedUrl(
                profile.getUserProfilePicture(),
                Duration.ofHours(1)
        )
                : null;

        String coverUrl = profile.getUserCoverPicture() != null
                ? s3Service.generatePresignedUrl(
                profile.getUserCoverPicture(),
                Duration.ofHours(1)
        )
                : null;

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
