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

import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class UserServiceImpl implements UserService, UserDetailsService {

    private final UserRepository repo;
    private final FollowRepository followRepo;
    private final PasswordEncoder passwordEncoder;
    private final UserProfileRepository userProfileRepository;

    public UserServiceImpl(UserRepository repo, FollowRepository followRepo, PasswordEncoder passwordEncoder,
            UserProfileRepository userProfileRepository) {
        this.repo = repo;
        this.passwordEncoder = passwordEncoder;
        this.followRepo = followRepo;
        this.userProfileRepository = userProfileRepository;
    }

    @Override
    @Transactional
    @BusinessMetric("user.registration")
    public User registerUser(RegistrationRequest request) {
        if (repo.existsByUsername(request.username())) {
            throw new DuplicateResourceException("Username already in use: " + request.username());
        }
        if (repo.existsByEmail(request.email())) {
            throw new DuplicateResourceException("Email already in use: " + request.email());
        }
        String encodedpassword = passwordEncoder.encode(request.password());
        System.out.println("User Details " + request);
        System.out.println("encoded " + encodedpassword);
        System.out.println("Repo Object Name is  " + repo.toString());
        User user = new User();
        user.setPassword(encodedpassword);
        user.setUsername(request.username());
        user.setEmail(request.email());
        user.setDisplayname(request.displayname());

        User savedUser = repo.save(user);

        // 2️⃣ Create Mongo profile (NO security impact)
        UserProfile profile = UserProfile.builder()
                .userId(savedUser.getId())
                .username(savedUser.getUsername())
                .displayName(savedUser.getDisplayname())
                .build();

        userProfileRepository.save(profile);

        return savedUser;
    }

    @Override
    public Optional<User> findUserEntityByUsername(String username) {
        return repo.findByUsername(username);
    }

    @Override
    @Transactional
    public void updateUser(Long id, RegistrationRequest request) {
        User user = repo.findById(id).orElseThrow(() -> new ResourceNotFoundException("User not found"));

        // Check email uniqueness
        if (!user.getEmail().equalsIgnoreCase(request.email()) && repo.existsByEmail(request.email())) {
            throw new DuplicateResourceException("Email already in use: " + request.email());
        }

        // Check username uniqueness
        if (!user.getUsername().equalsIgnoreCase(request.username()) && repo.existsByUsername(request.username())) {
            throw new DuplicateResourceException("Username already in use: " + request.username());
        }

        user.setUsername(request.username());
        user.setEmail(request.email());
        user.setDisplayname(request.displayname());
        if (request.password() != null && !request.password().isBlank()) {
            user.setPassword(passwordEncoder.encode(request.password()));
        }

        repo.save(user);
    }

    @Override
    @Transactional
    public void deleteUser(Long id) {
        User user = repo.findById(id).orElseThrow(() -> new ResourceNotFoundException("No User Found"));
        repo.delete(user);
    }

    @Override
    public List<UserResponse> getAllUsers() {
        return repo.findAll().stream()
                .map(user -> new UserResponse(user.getId(), user.getUsername(), user.getEmail(), user.getDisplayname()))
                .toList();
    }

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        System.out.println("Trying to load user: " + username);

        var user = repo.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + username));

        System.out.println("User found: " + user.getUsername() + ", password: " + user.getPassword());

        var authorities = user.getAuthorities().stream()
                .map(a -> new SimpleGrantedAuthority(a.getAuthority()))
                .toList();

        System.out.println("Authorities: " + authorities);

        return org.springframework.security.core.userdetails.User.builder()
                .username(user.getUsername())
                .password(user.getPassword()) // {noop} prefix if plain password
                .authorities(authorities)
                .build();
    }

    public long getTotalUsers() {
        return 0;
    }

    @Override
    public Optional<User> findByEmail(String email) {
        return repo.findByEmail(email);
    }

    @Override
    public Optional<UserResponse> findByUsername(String username) {
        return Optional.ofNullable(repo.findByUsername(username)
                .map(user -> new UserResponse(user.getId(), user.getUsername(), user.getEmail(), user.getDisplayname()))
                .orElseThrow(() -> new ResourceNotFoundException("User not found")));
    }

    @Override
    public Optional<UserResponse> findByUserId(Long userId) {
        return Optional.ofNullable(repo.findById(userId)
                .map(user -> new UserResponse(user.getId(), user.getUsername(), user.getEmail(), user.getDisplayname()))
                .orElseThrow(() -> new ResourceNotFoundException("User not found")));
    }

    public List<UserResponse> findSuggestedUsers(Long userId) {

        // Step 1: Fetch all users except the current one
        List<User> users = repo.findAll()
                .stream()
                .filter(user -> !user.getId().equals(userId)) // exclude current user
                .toList();

        // Step 2: Get IDs of users the current user is following
        List<Long> followingIds = followRepo.findAll().stream()
                .filter(f -> f.getFollower().getId().equals(userId))
                .map(f -> f.getFollowing().getId())
                .distinct()
                .toList();

        // Step 3: Exclude already-followed users
        List<User> suggestedUsers = users.stream()
                .filter(user -> !followingIds.contains(user.getId())) // ✅ correct filter
                .collect(Collectors.toList());

        // Step 4: Randomize order (optional)
        Collections.shuffle(suggestedUsers);

        // Step 5: Limit results and map to DTOs
        return suggestedUsers.stream()
                .limit(3)
                .map(user -> new UserResponse(
                        user.getId(),
                        user.getUsername(),
                        user.getEmail(),
                        user.getDisplayname()))
                .toList();
    }

}
