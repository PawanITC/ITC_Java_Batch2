package com.tribetalk.tribetalk.service;

import com.tribetalk.tribetalk.dto.RegistrationRequest;
import com.tribetalk.tribetalk.dto.UserResponse;

import java.util.List;

public interface UserService {
    void registerUser(RegistrationRequest request);
    void updateUser(Long id,RegistrationRequest request);
    void deleteUser(Long id);
    List<UserResponse> getAllUsers();
}
