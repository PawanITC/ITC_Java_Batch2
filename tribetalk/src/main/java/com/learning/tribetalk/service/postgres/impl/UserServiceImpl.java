package com.learning.tribetalk.service.postgres.impl;

import com.learning.tribetalk.dto.request.RegistrationRequest;
import com.learning.tribetalk.dto.response.UserResponse;
import com.learning.tribetalk.entity.mongo.UserProfile;
import com.learning.tribetalk.entity.postgres.User;
import com.learning.tribetalk.exception.DuplicateResourceException;
import com.learning.tribetalk.exception.ResourceNotFoundException;
import com.learning.tribetalk.metrics.annotations.BusinessMetric;
import com.learning.tribetalk.repository.mongo.UserProfileRepository;
import com.learning.tribetalk.repository.postgres.FollowRepository;
import com.learning.tribetalk.repository.postgres.UserRepository;
import com.learning.tribetalk.service.postgres.UserService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final FollowRepository followRepository;
    private final UserProfileRepository userProfileRepository;
    private final PasswordEncoder passwordEncoder;

    public UserServiceImpl(
            UserRepository userRepository,
            FollowRepository followRepository,
            UserProfileRepository userProfileRepository,
            PasswordEncoder passwordEncoder
    ) {
        this.userRepository = userRepository;
        this.followRepository = followRepository;
        this.userProfileRepository = userProfileRepository;
        this.passwordEncoder = passwordEncoder;
    }

    // =========================
    // REGISTER USER
    // =========================
    @Override
    @Transactional
    @BusinessMetric("user.registration")
    public void registerUser(RegistrationRequest request) {

        if (userRepository.existsByUsername(request.username())) {
            throw new DuplicateResourceException("Username already in use: " + request.username());
        }

        if (userRepository.existsByEmail(request.email())) {
            throw new DuplicateResourceException("Email already in use: " + request.email());
        }

        // 1️⃣ Save auth user (Postgres)
        User user = new User();
        user.setUsername(request.username());
        user.setEmail(request.email());
        user.setDisplayname(request.displayname());
        user.setPassword(passwordEncoder.encode(request.password()));

        User savedUser = userRepository.save(user);

        // 2️⃣ Create profile (Mongo)
        UserProfile profile = UserProfile.builder()
                .userId(savedUser.getId())
                .username(savedUser.getUsername())
                .displayName(savedUser.getDisplayname())
                .build();

        userProfileRepository.save(profile);
    }

    // =========================
    // UPDATE USER
    // =========================
    @Override
    @Transactional
    public void updateUser(Long id, RegistrationRequest request) {

        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (!user.getEmail().equalsIgnoreCase(request.email())
                && userRepository.existsByEmail(request.email())) {
            throw new DuplicateResourceException("Email already in use: " + request.email());
        }

        if (!user.getUsername().equalsIgnoreCase(request.username())
                && userRepository.existsByUsername(request.username())) {
            throw new DuplicateResourceException("Username already in use: " + request.username());
        }

        user.setUsername(request.username());
        user.setEmail(request.email());
        user.setDisplayname(request.displayname());

        if (request.password() != null && !request.password().isBlank()) {
            user.setPassword(passwordEncoder.encode(request.password()));
        }

        userRepository.save(user);
    }

    // =========================
    // DELETE USER
    // =========================
    @Override
    @Transactional
    public void deleteUser(Long id) {

        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("No User Found"));

        // delete profile first
        userProfileRepository.deleteByUserId(id);

        // then delete auth user
        userRepository.delete(user);
    }

    // =========================
    // READ OPERATIONS
    // =========================
    @Override
    public List<UserResponse> getAllUsers() {
        return userRepository.findAll()
                .stream()
                .map(user -> new UserResponse(
                        user.getId(),
                        user.getUsername(),
                        user.getEmail(),
                        user.getDisplayname()))
                .toList();
    }

    @Override
    public Optional<User> findByEmail(String email) {
        return userRepository.findByEmail(email);
    }

    @Override
    public Optional<UserResponse> findByUsername(String username) {
        return userRepository.findByUsername(username)
                .map(user -> new UserResponse(
                        user.getId(),
                        user.getUsername(),
                        user.getEmail(),
                        user.getDisplayname()));
    }

    @Override
    public Optional<UserResponse> findByUserId(Long userId) {
        return userRepository.findById(userId)
                .map(user -> new UserResponse(
                        user.getId(),
                        user.getUsername(),
                        user.getEmail(),
                        user.getDisplayname()));
    }

    // =========================
    // SUGGESTED USERS
    // =========================
    public List<UserResponse> findSuggestedUsers(Long userId) {

        List<User> users = userRepository.findAll()
                .stream()
                .filter(user -> !user.getId().equals(userId))
                .toList();

        List<Long> followingIds = followRepository.findAll()
                .stream()
                .filter(f -> f.getFollower().getId().equals(userId))
                .map(f -> f.getFollowing().getId())
                .distinct()
                .toList();

        List<User> suggestedUsers = users.stream()
                .filter(user -> !followingIds.contains(user.getId()))
                .collect(Collectors.toList());

        Collections.shuffle(suggestedUsers);

        return suggestedUsers.stream()
                .limit(3)
                .map(user -> new UserResponse(
                        user.getId(),
                        user.getUsername(),
                        user.getEmail(),
                        user.getDisplayname()))
                .toList();
    }

    // =========================
    // METRICS
    // =========================
    public long getTotalUsers() {
        return userRepository.count();
    }
}
