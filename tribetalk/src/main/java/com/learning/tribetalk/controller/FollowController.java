package com.learning.tribetalk.controller;

import com.learning.tribetalk.dto.response.MessageResponse;
import com.learning.tribetalk.dto.response.UserResponse;
import com.learning.tribetalk.service.postgres.FollowService;
import io.swagger.v3.oas.annotations.Operation;
import lombok.Getter;
import lombok.Setter;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;


@RestController
@RequestMapping("/api/follow")// adjust for your React dev server
public class FollowController {

    private final FollowService followService;

    public FollowController(FollowService followService)
    {
        this.followService = followService;
    }

    @Operation(summary = "Follow a user", description = "Follows the user , creating a row in follow entity")
    @PostMapping("/follow-user")
    public ResponseEntity<MessageResponse> follow(@RequestBody FollowRequest request) {
        followService.follow(request.getFollowerId(), request.getFollowingId());
        return ResponseEntity.ok(new MessageResponse("Followed successfully!"));
    }

    @Operation(summary = "Unfollow a user", description = "unfollows the user , deletes  the corresponding  row in follow entity")
    @DeleteMapping("/unfollow-user")
    public ResponseEntity<MessageResponse> unfollow(@RequestBody FollowRequest request) {
        followService.unFollow(request.getFollowerId(), request.getFollowingId());
        return ResponseEntity.ok(new MessageResponse("Unfollowed successfully!"));

    }

    @Operation(summary = "Give a list of Followers for the particular userID", description = "checks the user id in following ids list in the follow table , gets the list of followers ids and gets their user details")
    @GetMapping("/followers-list/{userId}")
    public ResponseEntity<List<UserResponse>> getFollowersList(@PathVariable Long userId) {

        return ResponseEntity.ok(followService.getFollwersList(userId));

    }

    @Operation(summary = "Give a list of Followers for the particular userID", description = "checks the user id in the followers ids follow table , gets the list of corresponding following ids and gets their user details")
    @GetMapping("/following-list/{userId}")
    public ResponseEntity<List<UserResponse>> getFollowingList(@PathVariable Long userId) {

        return ResponseEntity.ok(followService.getFollwingList(userId));

    }


    @Getter
    @Setter
    public static class FollowRequest {
        private Long followerId;
        private Long followingId;
    }
}
