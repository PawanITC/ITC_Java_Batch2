package com.learning.tribetalk.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.learning.tribetalk.dto.response.MessageResponse;
import com.learning.tribetalk.dto.response.UserResponse;
import com.learning.tribetalk.service.postgres.FollowService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.Arrays;
import java.util.List;

import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
class FollowControllerTest {

    @Mock
    private FollowService followService;

    @InjectMocks
    private FollowController followController;

    private MockMvc mockMvc;
    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(followController).build();
        objectMapper = new ObjectMapper();
    }

    @Test
    void testFollow_Success() throws Exception {
        // Arrange
        FollowController.FollowRequest request = new FollowController.FollowRequest(1L, 2L);
        doNothing().when(followService).follow(1L, 2L);

        // Act & Assert
        mockMvc.perform(post("/api/follow/follow-user")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Followed successfully!"));

        verify(followService, times(1)).follow(1L, 2L);
    }

    @Test
    void testUnfollow_Success() throws Exception {
        // Arrange
        FollowController.FollowRequest request = new FollowController.FollowRequest(1L, 2L);
        doNothing().when(followService).unFollow(1L, 2L);

        // Act & Assert
        mockMvc.perform(delete("/api/follow/unfollow-user")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Unfollowed successfully!"));

        verify(followService, times(1)).unFollow(1L, 2L);
    }

    @Test
    void testGetFollowersList_Success() throws Exception {
        // Arrange
        Long userId = 1L;
        List<UserResponse> followers = Arrays.asList(
                new UserResponse(2L, "user2", "user2@example.com", "User Two", null),
                new UserResponse(3L, "user3", "user3@example.com", "User Three", null));
        when(followService.getFollwersList(userId)).thenReturn(followers);

        // Act & Assert
        mockMvc.perform(get("/api/follow/followers-list/{userId}", userId)
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].id").value(2))
                .andExpect(jsonPath("$[0].username").value("user2"))
                .andExpect(jsonPath("$[1].id").value(3))
                .andExpect(jsonPath("$[1].username").value("user3"));

        verify(followService, times(1)).getFollwersList(userId);
    }

    @Test
    void testGetFollowingList_Success() throws Exception {
        // Arrange
        Long userId = 1L;
        List<UserResponse> following = Arrays.asList(
                new UserResponse(4L, "user4", "user4@example.com", "User Four", null),
                new UserResponse(5L, "user5", "user5@example.com", "User Five", null));
        when(followService.getFollwingList(userId)).thenReturn(following);

        // Act & Assert
        mockMvc.perform(get("/api/follow/following-list/{userId}", userId)
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].id").value(4))
                .andExpect(jsonPath("$[0].username").value("user4"))
                .andExpect(jsonPath("$[1].id").value(5))
                .andExpect(jsonPath("$[1].username").value("user5"));

        verify(followService, times(1)).getFollwingList(userId);
    }

    @Test
    void testGetFollowersList_EmptyList() throws Exception {
        // Arrange
        Long userId = 1L;
        when(followService.getFollwersList(userId)).thenReturn(Arrays.asList());

        // Act & Assert
        mockMvc.perform(get("/api/follow/followers-list/{userId}", userId)
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$.length()").value(0));

        verify(followService, times(1)).getFollwersList(userId);
    }

    @Test
    void testFollow_WithNullFollowerId() throws Exception {
        // Arrange
        FollowController.FollowRequest request = new FollowController.FollowRequest(null, 2L);

        // Act & Assert
        mockMvc.perform(post("/api/follow/follow-user")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk());

        verify(followService, times(1)).follow(null, 2L);
    }

    private UserResponse createUserResponse(Long id, String username, String email) {
        return new UserResponse(id, username, email, "Display Name", null);
    }
}