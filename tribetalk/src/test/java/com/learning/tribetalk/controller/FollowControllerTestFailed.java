//package com.learning.tribetalk.controller;
//
//
//import com.fasterxml.jackson.databind.ObjectMapper;
//import com.learning.tribetalk.controller.FollowController.FollowRequest;
//import com.learning.tribetalk.dto.response.UserResponse;
//import com.learning.tribetalk.service.postgres.FollowService;
//import org.junit.jupiter.api.Test;
//import org.mockito.Mockito;
//import org.springframework.beans.factory.annotation.Autowired;
//import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
//import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
//import org.springframework.http.MediaType;
//import org.springframework.test.web.servlet.MockMvc;
//import static org.mockito.Mockito.times;
//import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
//import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
//
//import java.util.List;
//
//import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
//
//@AutoConfigureMockMvc(addFilters = false)
//@WebMvcTest
//public class FollowControllerTest {
//
//    @Autowired
//    private FollowService followService;
//
//    @Autowired
//    private ObjectMapper objectMapper;
//
//    @Autowired
//    private MockMvc mockMvc;
//
//
//    @Test
//    void testFollowUser() throws Exception {
//        FollowRequest request = new FollowRequest();
//        request.setFollowerId(1L);
//        request.setFollowingId(2L);
//
//        mockMvc.perform(post("/api/follow/follow-user")
//                        .contentType(MediaType.APPLICATION_JSON)
//                        .content(objectMapper.writeValueAsString(request)))
//                .andExpect(status().isOk())
//                .andExpect(jsonPath("$.message").value("Followed successfully!"));
//
//        Mockito.verify(followService, times(1))
//                .follow(1L, 2L);
//    }
//
//    @Test
//    void testUnfollowUser() throws Exception {
//        FollowRequest request = new FollowRequest();
//        request.setFollowerId(1L);
//        request.setFollowingId(2L);
//
//        mockMvc.perform(delete("/api/follow/unfollow-user")
//                        .contentType(MediaType.APPLICATION_JSON)
//                        .content(objectMapper.writeValueAsString(request)))
//                .andExpect(status().isOk())
//                .andExpect(jsonPath("$.message").value("Unfollowed successfully!"));
//
//        Mockito.verify(followService, times(1))
//                .unFollow(1L, 2L);
//    }
//
//    @Test
//    void testGetFollowersList() throws Exception {
//        Long userId = 10L;
//
//        List<UserResponse> mockFollowers = List.of(
//                new UserResponse(1L, "user1", "user1@example.com", "User One"),
//                new UserResponse(2L, "user2", "user2@example.com", "User Two")
//        );
//
//        Mockito.when(followService.getFollwersList(userId)).thenReturn(mockFollowers);
//
//        mockMvc.perform(get("/api/follow/followers-list/{userId}", userId))
//                .andExpect(status().isOk())
//                .andExpect(jsonPath("$.length()").value(2))
//                .andExpect(jsonPath("$[0].username").value("user1"))
//                .andExpect(jsonPath("$[1].username").value("user2"));
//
//        Mockito.verify(followService, times(1)).getFollwersList(userId);
//    }
//
//    @Test
//    void testGetFollowingList() throws Exception {
//        Long userId = 5L;
//
//        List<UserResponse> mockFollowing = List.of(
//                new UserResponse(3L, "user3", "user3@example.com", "User Three")
//        );
//
//        Mockito.when(followService.getFollwingList(userId)).thenReturn(mockFollowing);
//
//        mockMvc.perform(get("/api/follow/following-list/{userId}", userId))
//                .andExpect(status().isOk())
//                .andExpect(jsonPath("$.length()").value(1))
//                .andExpect(jsonPath("$[0].username").value("user3"));
//
//        Mockito.verify(followService, times(1)).getFollwingList(userId);
//    }
//
//
//}
