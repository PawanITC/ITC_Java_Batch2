package com.learning.tribetalk.controller;

import com.learning.tribetalk.dto.response.MessageResponse;
import com.learning.tribetalk.dto.request.RegistrationRequest;
import com.learning.tribetalk.dto.response.UserResponse;
import com.learning.tribetalk.service.postgres.FollowService;
import com.learning.tribetalk.service.postgres.UserService;
import io.swagger.v3.oas.annotations.Operation;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.User;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/users")
public class UserController {
    private final UserService userService;
    private final FollowService followService;

    public UserController(UserService userService, FollowService followService) {
        this.userService = userService;
        this.followService = followService;
    }

    @GetMapping("/loggedUser")
    public ResponseEntity<UserResponse> getUserByUsername(@AuthenticationPrincipal User user) {
        if (user == null) {
            return ResponseEntity.status(401).build();
        }
        return userService.findByUsername(user.getUsername()).map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/all")
    public ResponseEntity<List<UserResponse>> getAllUsers() {
        List<UserResponse> users = userService.getAllUsers();
        return ResponseEntity.ok(users);
    }

    @GetMapping("/{id}")
    public ResponseEntity<UserResponse> getUserById(@PathVariable Long id) {
        return userService.findByUserId(id).map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build());
    }

    @Operation(summary = "Register a new user", description = "Creates a new user with username, email, and password")
    @PostMapping("/save")
    public ResponseEntity<MessageResponse> registerUser(@RequestBody @Valid RegistrationRequest request) {
        userService.registerUser(request);
        return ResponseEntity.ok(new MessageResponse("User Registered Successfully"));
    }

    @PutMapping("/{id}")
    public ResponseEntity<MessageResponse> updateUser(@PathVariable Long id, @RequestBody RegistrationRequest request) {
        userService.updateUser(id, request);
        return ResponseEntity.ok(new MessageResponse("User updated Successfully"));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<MessageResponse> deleteUser(@PathVariable Long id) {
        userService.deleteUser(id);
        return ResponseEntity.ok(new MessageResponse("User removed Successfully"));
    }

    @GetMapping("/suggested-users/{userId}")
    public ResponseEntity<List<UserResponse>> getSuggestedUsers(@PathVariable Long userId) {
        List<UserResponse> suggestedUsers = userService.findSuggestedUsers(userId);
        return ResponseEntity.ok(suggestedUsers);
    }

    @GetMapping("/{userId}/followers-count")
    public ResponseEntity<Long> getFollowersCount(@PathVariable Long userId) {
        long count = followService.getFollowersCount(userId);
        return ResponseEntity.ok(count);
    }

    @GetMapping("/{userId}/following-count")
    public ResponseEntity<Long> getFollowingCount(@PathVariable Long userId) {
        long count = followService.getFollowingCount(userId);
        return ResponseEntity.ok(count);
    }
}
