package com.learning.tribetalk.controller;

import com.learning.tribetalk.dto.response.MessageResponse;
import com.learning.tribetalk.service.postgres.FollowService;
import io.swagger.v3.oas.annotations.Operation;
import lombok.Getter;
import lombok.Setter;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;


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

    @Getter
    @Setter
    public static class FollowRequest {
        private Long followerId;
        private Long followingId;
    }
}
