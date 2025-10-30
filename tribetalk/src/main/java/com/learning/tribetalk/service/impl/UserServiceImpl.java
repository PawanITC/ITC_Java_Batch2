package com.learning.tribetalk.service.impl;

import com.learning.tribetalk.dto.RegistrationRequest;
import com.learning.tribetalk.dto.UserResponse;
import com.learning.tribetalk.entity.Authority;
import com.learning.tribetalk.entity.User;
import com.learning.tribetalk.exception.DuplicateResourceException;
import com.learning.tribetalk.exception.ResourceNotFoundException;
import com.learning.tribetalk.repository.UserRepository;
import com.learning.tribetalk.service.UserService;

import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.Timer;
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
    private final MeterRegistry meterRegistry;

    private final Counter registerSuccessCounter;
    private final Counter registerFailureCounter;
    private final Timer registerTimer;

    public UserServiceImpl(UserRepository repo,PasswordEncoder passwordEncoder,MeterRegistry meterRegistry){
        this.repo=repo;
        this.passwordEncoder=passwordEncoder;
        this.meterRegistry=meterRegistry;

        this.registerSuccessCounter=Counter.builder("user_registration_total")
                .description("Number of successful user registrations")
                .tag("status","success")
                .register(meterRegistry);

        this.registerFailureCounter=Counter.builder("user_registration_total")
                .description("Number of failed user registrations")
                .tag("status","failure")
                .register(meterRegistry);

        this.registerTimer= Timer.builder("user_registration_duration_seconds")
                .description("Time taken to register a user")
                .register(meterRegistry);
    }

    @Override
    @Transactional
    public void registerUser(RegistrationRequest request) {

        registerTimer.record(()->{
            try{
                if(repo.existsByUsername(request.username())){
                    registerFailureCounter.increment();
                    throw new DuplicateResourceException("Username already in use: " + request.username());
                }
                if(repo.existsByEmail(request.email())){
                    registerFailureCounter.increment();
                    throw new DuplicateResourceException("Email already in use: " + request.username());
                }
                String encodedpassword= passwordEncoder.encode(request.password());
                User user=new User();
                user.setPassword(encodedpassword);
                user.setUsername(request.username());
                user.setEmail(request.email());
                //            Set<Authority> authorities;
//            if (request.authorities() == null || request.authorities().isEmpty()) {
//                Authority defaultAuthority = new Authority();
//                defaultAuthority.setAuthority("ROLE_USER");
//                defaultAuthority.setUser(user);
//                authorities = Set.of(defaultAuthority);
//            } else {
//                // Use authorities provided in the request
//                authorities = request.authorities();
//                authorities.forEach(auth -> auth.setUser(user)); // link each authority to user
//            }
                repo.save(user);
                meterRegistry.counter("user_registrations_total").increment();
                registerSuccessCounter.increment();
            }
            catch (Exception e){
                registerFailureCounter.increment();
                throw e;
            }
        });


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


}
