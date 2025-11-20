package com.learning.tribetalk.service.postgres;

import com.learning.tribetalk.dto.request.RegistrationRequest;
import com.learning.tribetalk.dto.response.UserResponse;
import com.learning.tribetalk.entity.postgres.User;

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
