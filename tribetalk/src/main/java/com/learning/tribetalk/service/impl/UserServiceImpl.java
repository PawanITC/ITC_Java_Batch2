package com.learning.tribetalk.service.impl;

import com.learning.tribetalk.dto.RegistrationRequest;
import com.learning.tribetalk.dto.UserResponse;
import com.learning.tribetalk.entity.User;
import com.learning.tribetalk.exception.DuplicateResourceException;
import com.learning.tribetalk.exception.ResourceNotFoundException;
import com.learning.tribetalk.repository.UserRepository;
import com.learning.tribetalk.service.UserService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.List;

@Service
public class UserServiceImpl implements UserService {

    private final UserRepository repo;
    private final PasswordEncoder passwordEncoder;
    public UserServiceImpl(UserRepository repo,PasswordEncoder passwordEncoder){
        this.repo=repo;
        this.passwordEncoder=passwordEncoder;
    }

    @Override
    @Transactional
    public void registerUser(RegistrationRequest request) {
        if(repo.existsByUsername(request.username())){
            throw new DuplicateResourceException("Username already in use: " + request.username());
        }
        if(repo.existsByEmail(request.email())){
            throw new DuplicateResourceException("Email already in use: " + request.username());
        }
        String encodedpassword= passwordEncoder.encode(request.password());
        User user=new User();
        user.setPassword(encodedpassword);
        user.setUsername(request.username());
        user.setEmail(request.email());
        repo.save(user);
    }

    @Override
    @Transactional
    public void updateUser(Long id, RegistrationRequest request) {
        User user=repo.findById(id).orElseThrow(()->new ResourceNotFoundException("User not found"));

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

        if (request.password() != null && !request.password().isBlank()) {
            user.setPassword(passwordEncoder.encode(request.password()));
        }

        repo.save(user);
    }

    @Override
    @Transactional
    public void deleteUser(Long id) {
        User user=repo.findById(id).orElseThrow(()->new ResourceNotFoundException("No User Found"));
        repo.delete(user);
    }

    @Override
    public List<UserResponse> getAllUsers() {
        return repo.findAll().stream().map(user->new UserResponse(user.getId(),user.getUsername(),user.getEmail())).toList();
    }
}
