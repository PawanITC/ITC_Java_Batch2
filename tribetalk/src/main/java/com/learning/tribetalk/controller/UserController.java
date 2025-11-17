package com.learning.tribetalk.controller;

import com.learning.tribetalk.dto.MessageResponse;
import com.learning.tribetalk.dto.RegistrationRequest;
import com.learning.tribetalk.dto.UserResponse;
import com.learning.tribetalk.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.User;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/users")
public class UserController {
    private final UserService userService;

    public UserController(UserService userService){
        this.userService=userService;
    }

    @GetMapping("/loggedUser")
    public ResponseEntity<UserResponse> getUserByUsername(@AuthenticationPrincipal User user){
        return userService.findByUsername(user.getUsername()).map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build());
    }
    @GetMapping("/all")
    public ResponseEntity<List<UserResponse>> getAllUsers(){
        List<UserResponse> users=userService.getAllUsers();
        return ResponseEntity.ok(users);
    }

    @GetMapping("/{id}")
    public ResponseEntity<UserResponse> getUserById(@PathVariable Long id){
        return userService.findByUserId(id).map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build());
    }

    @Operation(summary = "Register a new user", description = "Creates a new user with username, email, and password")
    @PostMapping("/save")
    public ResponseEntity<MessageResponse> registerUser(@RequestBody @Valid RegistrationRequest request){
        userService.registerUser(request);
        return ResponseEntity.ok(new MessageResponse("User Registered Successfully"));
    }

    @PutMapping("/{id}")
    public ResponseEntity<MessageResponse> updateUser(@PathVariable Long id,@RequestBody RegistrationRequest request){
        userService.updateUser(id,request);
        return ResponseEntity.ok(new MessageResponse("User updated Successfully"));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<MessageResponse> deleteUser(@PathVariable Long id){
        userService.deleteUser(id);
        return ResponseEntity.ok(new MessageResponse("User removed Successfully"));
    }
}
