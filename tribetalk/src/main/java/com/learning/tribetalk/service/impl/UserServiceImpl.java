package com.learning.tribetalk.service.impl;

import com.learning.tribetalk.dto.RegistrationRequest;
import com.learning.tribetalk.dto.UserResponse;
import com.learning.tribetalk.entity.Authority;
import com.learning.tribetalk.entity.User;
import com.learning.tribetalk.exception.DuplicateResourceException;
import com.learning.tribetalk.exception.ResourceNotFoundException;
import com.learning.tribetalk.metrics.annotations.BusinessMetric;
import com.learning.tribetalk.repository.UserRepository;
import com.learning.tribetalk.service.UserService;

import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.Timer;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import io.micrometer.core.instrument.MeterRegistry;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.sql.Time;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.Set;

@Service
public class UserServiceImpl implements UserService, UserDetailsService {

    private final UserRepository repo;
    private final PasswordEncoder passwordEncoder;

    public UserServiceImpl(UserRepository repo,PasswordEncoder passwordEncoder){
        this.repo=repo;
        this.passwordEncoder=passwordEncoder;

    }

    @Override
    @Transactional
    @BusinessMetric("user.registration")
    public void registerUser(RegistrationRequest request) {
        if(repo.existsByUsername(request.username())){
            throw new DuplicateResourceException("Username already in use: " + request.username());
        }
        if(repo.existsByEmail(request.email())){
            throw new DuplicateResourceException("Email already in use: " + request.email());
        }
        String encodedpassword= passwordEncoder.encode(request.password());
        System.out.println("User Details"+request);
        System.out.println("encoded"+encodedpassword);
        User user=new User();
        user.setPassword(encodedpassword);
        user.setUsername(request.username());
        user.setEmail(request.email());
        user.setDisplayname(request.displayname());
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
        user.setDisplayname(request.displayname());
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
        return repo.findAll().stream().map(user->new UserResponse(user.getId(),user.getUsername(),user.getEmail(),user.getDisplayname())).toList();
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
        return Optional.ofNullable(repo.findByUsername(username).map(user -> new UserResponse(user.getId(), user.getUsername(), user.getEmail(), user.getDisplayname())).orElseThrow(() -> new ResourceNotFoundException("User not found")));
    }

    @Override
    public Optional<UserResponse> findByUserId(Long userId) {
        return Optional.ofNullable(repo.findById(userId).map(user -> new UserResponse(user.getId(), user.getUsername(), user.getEmail(), user.getDisplayname())).orElseThrow(() -> new ResourceNotFoundException("User not found")));
    }


}
