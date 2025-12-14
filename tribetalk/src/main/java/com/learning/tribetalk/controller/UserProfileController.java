package com.learning.tribetalk.controller;

import com.learning.tribetalk.dto.request.UserProfileRequest;
import com.learning.tribetalk.dto.response.UserProfileResponse;
import com.learning.tribetalk.service.mongo.UserProfileService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/user-profile")
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
    @PatchMapping("/{userId}")
    public ResponseEntity<UserProfileResponse> updateUserProfile(
            @PathVariable Long userId,
            @Valid @RequestBody UserProfileRequest request) {

        UserProfileResponse response =
                userProfileService.updateProfile(userId, request);

        return ResponseEntity.ok(response);
    }
}
