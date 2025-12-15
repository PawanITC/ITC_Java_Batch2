package com.learning.tribetalk.controller;

import com.learning.tribetalk.dto.request.UserProfileRequest;
import com.learning.tribetalk.dto.response.UserProfileResponse;
import com.learning.tribetalk.service.mongo.UserProfileService;
import jakarta.validation.Valid;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/users/user-profile")
public class UserProfileController {

    private final UserProfileService userProfileService;

    public UserProfileController(UserProfileService userProfileService) {
        this.userProfileService = userProfileService;
    }

    /**
     * Get user profile by userId
     * GET /api/user-profile/{userId}
     */
    @GetMapping("/{userId}")
    public ResponseEntity<UserProfileResponse> getUserProfile(
            @PathVariable Long userId) {

        UserProfileResponse response = userProfileService.getProfile(userId);
        return ResponseEntity.ok(response);
    }

    /**
     * Partially update user profile
     * PATCH /api/user-profile/{userId}
     */
    @PatchMapping(value = "/{userId}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public UserProfileResponse updateProfile(
            @PathVariable Long userId,
            @RequestPart(required = false) MultipartFile profileImage,
            @RequestPart(required = false) MultipartFile coverImage,
            @RequestPart(required = false) String bio,
            @RequestPart(required = false) String location
    ) {
        return userProfileService.updateProfile(
                userId, bio, location, profileImage, coverImage
        );
    }
}
