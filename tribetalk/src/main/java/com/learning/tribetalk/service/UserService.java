package com.learning.tribetalk.service;

import com.learning.tribetalk.dto.RegistrationRequest;
import com.learning.tribetalk.dto.UserResponse;

import java.util.List;

public interface UserService {
    void registerUser(RegistrationRequest request);
    void updateUser(Long id,RegistrationRequest request);
    void deleteUser(Long id);
    List<UserResponse> getAllUsers();
}
