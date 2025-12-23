package com.learning.tribetalk.controller;

import com.learning.tribetalk.entity.mongo.UserProfile;
import com.learning.tribetalk.entity.postgres.User;
import com.learning.tribetalk.repository.mongo.UserProfileRepository;
import com.learning.tribetalk.repository.postgres.UserRepository;
import com.learning.tribetalk.service.mongo.S3Service;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Duration;
import java.util.List;
import java.util.concurrent.atomic.AtomicInteger;

@RestController
@RequestMapping("/api/admin")
public class MigrationController {

    private final UserProfileRepository profileRepo;
    private final UserRepository userRepo;
    private final S3Service s3Service;

    public MigrationController(
            UserProfileRepository profileRepo,
            UserRepository userRepo,
            S3Service s3Service) {
        this.profileRepo = profileRepo;
        this.userRepo = userRepo;
        this.s3Service = s3Service;
    }

    /**
     * One-time migration to sync profile images from MongoDB to PostgreSQL
     */
    @PostMapping("/migrate-profile-images")
    public ResponseEntity<String> migrateProfileImages() {
        List<UserProfile> profiles = profileRepo.findAll();
        AtomicInteger synced = new AtomicInteger(0);

        profiles.forEach(profile -> {
            if (profile.getUserProfilePicture() != null) {
                userRepo.findById(profile.getUserId()).ifPresent(user -> {
                    String profileUrl = s3Service.generatePresignedUrl(
                            profile.getUserProfilePicture(),
                            Duration.ofDays(365));
                    user.setProfileImageUrl(profileUrl);
                    userRepo.save(user);
                    synced.incrementAndGet();
                });
            }
        });

        return ResponseEntity.ok(
                String.format("Migration complete! Synced %d profile images from MongoDB to PostgreSQL", synced.get()));
    }
}
