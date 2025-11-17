package com.learning.tribetalk.service;

import com.learning.tribetalk.dto.RegistrationRequest;
import com.learning.tribetalk.dto.UserResponse;
import com.learning.tribetalk.entity.User;
import org.springframework.web.bind.annotation.PathVariable;

import java.util.List;
import java.util.Optional;

public interface UserService {
    void registerUser(RegistrationRequest request);
    void updateUser(Long id,RegistrationRequest request);
    void deleteUser(Long id);
    List<UserResponse> getAllUsers();
    long getTotalUsers();
    Optional<User> findByEmail(String email);
    Optional<UserResponse> findByUsername(String username);
    List<UserResponse> findSuggestedUsers(Long userId);
    Optional<UserResponse> findByUserId(Long userId);

}
