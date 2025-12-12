package com.learning.tribetalk.controller;

import com.learning.tribetalk.dto.request.UserDetailsRequest;
import com.learning.tribetalk.dto.response.UserDetailsResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/userdetails")
public class UserDetailsController {
    private final UserDetailsService userDetailsService;

    public UserDetailsController(UserDetailsService userDetailsService) {
        this.userDetailsService = userDetailsService;
    }

    @PatchMapping("/{userId}/user-details")
    public ResponseEntity<UserDetailsResponse> getUserDetails(@PathVariable Long userId,@RequestBody UserDetailsRequest userDetailsRequest){
        UserDetailsResponse userDetailsResponse =userDetailsService.getUserDetails(userId);
        return ResponseEntity.ok(userDetailsResponse);

    }
    @PutMapping("/{userId}/user-details")
    public ResponseEntity<UserDetailsResponse> getUserDetails(@PathVariable Long userId,@RequestBody UserDetailsRequest userDetailsRequest){
        UserDetailsResponse userDetailsResponse =userDetailsService.getUserDetails(userId);
        return ResponseEntity.ok(userDetailsResponse);

    }
}
