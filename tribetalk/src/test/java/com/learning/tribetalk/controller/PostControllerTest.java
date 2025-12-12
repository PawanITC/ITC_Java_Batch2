//package com.learning.tribetalk.controller;
//
//import com.fasterxml.jackson.databind.ObjectMapper;
//import com.learning.tribetalk.dto.request.PostCreateRequest;
//import com.learning.tribetalk.dto.response.PostResponse;
//import com.learning.tribetalk.service.mongo.PostService;
//import org.junit.jupiter.api.DisplayName;
//import org.junit.jupiter.api.Test;
//import org.mockito.Mockito;
//import org.springframework.beans.factory.annotation.Autowired;
//import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
//import org.springframework.boot.test.context.TestConfiguration;
//import org.springframework.context.annotation.Bean;
//import org.springframework.mock.web.MockMultipartFile;
//import org.springframework.http.MediaType;
//import org.springframework.security.config.annotation.web.builders.HttpSecurity;
//import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
//import org.springframework.security.web.SecurityFilterChain;
//import org.springframework.test.context.bean.override.mockito.MockitoBean;
//import org.springframework.test.web.servlet.MockMvc;
//
//import java.time.Instant;
//import java.util.List;
//import java.util.Set;
//
//import static org.mockito.ArgumentMatchers.any;
//import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
//import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
//
//@WebMvcTest(PostController.class)
//class PostControllerTest {
//    @Autowired
//    private MockMvc mockMvc;
//    @MockitoBean
//    private PostService postService;
//    @Autowired
//    private ObjectMapper objectMapper;
//
//    // ✅ Disable security for this test class
//    @TestConfiguration
//    static class TestSecurityConfig {
//        @Bean
//        public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
//            return http
//                    .csrf(AbstractHttpConfigurer::disable)
//                    .authorizeHttpRequests(auth -> auth.anyRequest().permitAll())
//                    .build();
//        }
//    }
//
//    @Test
//    @DisplayName("POST /api/v1/posts/create - should create post successfully")
//    void createPost_success() throws Exception {
//        PostCreateRequest request = new PostCreateRequest(1L,
//                "Hello Tribe!",
//                Instant.now(),
//                "PUBLIC",
//                "EVERYONE",
//                List.of("#java", "#spring"),
//                List.of("@gowthami"),
//                List.of("https://example.com"),
//                new PostCreateRequest.MediaDTO("https://cdn/image.png", "IMAGE"),
//                new PostCreateRequest.PollDTO(
//                        List.of(
//                                new PostCreateRequest.PollOptionDTO("Option A", 0),
//                                new PostCreateRequest.PollOptionDTO("Option B", 0)
//                        ),
//                        Instant.now().plusSeconds(3600)
//                ),
//                null,
//                null,
//                Set.of(),
//                Set.of());
//
//        MockMultipartFile data = new MockMultipartFile("data",
//                "",
//                "application/json",
//                objectMapper.writeValueAsBytes(request));
//
//        MockMultipartFile media = new MockMultipartFile(
//                "media",
//                "file.png",
//                "image/png",
//                "dummy".getBytes()
//        );
//
//        PostResponse response = new PostResponse(
//                "123",
//                1L,
//                "Hello Tribe!",
//                Instant.now(),
//                "PUBLIC",
//                "EVERYONE",
//                List.of("#java", "#spring"),
//                List.of("@gowthami"),
//                List.of("https://example.com"),
//                new PostResponse.MediaDTO("https://cdn/image.png", "IMAGE"),
//                new PostResponse.PollDTO(
//                        List.of(
//                                new PostResponse.PollOptionDTO("Option A", 0, 0.0),
//                                new PostResponse.PollOptionDTO("Option B", 0, 0.0)
//                        ),
//                        Instant.now().plusSeconds(3600),
//                        0
//                ),
//                null,
//                null,
//                0,
//                Set.of(),
//                Set.of(),
//                0,
//                0,
//                Instant.now());
//
//        Mockito.when(postService.save(any(), any())).thenReturn(response);
//
//        mockMvc.perform(
//                        multipart("/api/v1/posts/create")
//                                .file(data)
//                                .file(media)
//                                .contentType(MediaType.MULTIPART_FORM_DATA)
//                )
//                .andExpect(status().isOk())
//                .andExpect(jsonPath("$.id").value("123"))
//                .andExpect(jsonPath("$.text").value("Hello Tribe!"));
//    }
//
//
//        // ❌ FAILURE CASE
//        @Test
//        void createPost_failure() throws Exception {
//
//            PostCreateRequest request = new PostCreateRequest(
//                    1L,
//                    "Hello Tribe!",
//                    Instant.now(),
//                    "PUBLIC",
//                    "EVERYONE",
//                    List.of("#java"),
//                    List.of("@gowthami"),
//                    List.of("https://example.com"),
//                    null,
//                    null,
//                    null,
//                    null,
//                    Set.of(),
//                    Set.of()
//            );
//
//            MockMultipartFile data = new MockMultipartFile(
//                    "data",
//                    "",
//                    "application/json",
//                    objectMapper.writeValueAsBytes(request)
//            );
//
//            Mockito.when(postService.save(any(), any()))
//                    .thenThrow(new RuntimeException("Failed to save post"));
//
//            mockMvc.perform(multipart("/api/v1/posts/create")
//                            .file(data)
//                            .contentType(MediaType.MULTIPART_FORM_DATA))
//                    .andExpect(status().is5xxServerError());
//        }
//    }
//
//
