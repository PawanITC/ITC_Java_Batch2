package com.learning.tribetalk.controller;

import com.learning.tribetalk.dto.MessageResponse;
import com.learning.tribetalk.dto.RegistrationRequest;
import com.learning.tribetalk.dto.UserResponse;
import com.learning.tribetalk.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")
public class UserController {
    private final UserService userService;

    public UserController(UserService userService){
        this.userService=userService;
    }

    @GetMapping("/all")
    public ResponseEntity<List<UserResponse>> getAllUsers(){
        List<UserResponse> users=userService.getAllUsers();
        return ResponseEntity.ok(users);
    }

    @Operation(summary = "Register a new user", description = "Creates a new user with username, email, and password")
    @PostMapping("/save")
    public ResponseEntity<MessageResponse> registerUser(@RequestBody RegistrationRequest request){
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
