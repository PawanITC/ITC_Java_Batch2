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
//import org.springframework.context.annotation.Bean;
//import org.springframework.context.annotation.Import;
//import org.springframework.http.MediaType;
//import org.springframework.mock.web.MockMultipartFile;
//import org.springframework.security.config.annotation.web.builders.HttpSecurity;
//import org.springframework.security.web.SecurityFilterChain;
//import org.springframework.test.context.bean.override.mockito.MockitoBean;
//import org.springframework.test.web.servlet.MockMvc;
//import org.springframework.test.web.servlet.request.MockMvcRequestBuilders;
//
//import java.util.List;
//
//import static org.mockito.ArgumentMatchers.any;
//import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
//import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
//
//@WebMvcTest(PostController.class)
//@Import(PostControllerTest.TestSecurityConfig.class)
//public class PostControllerTest {
//    @Autowired
//    private MockMvc mockMvc;
//    @MockitoBean
//    private PostService postService;
//    @Autowired
//    private ObjectMapper objectMapper;
//
//    //Disable the security
//    static class TestSecurityConfig {
//        @Bean
//        public SecurityFilterChain filterChain(HttpSecurity httpSecurity) throws Exception {
//            return httpSecurity.csrf(csrf -> csrf.disable())
//                    .authorizeHttpRequests(auth -> auth.anyRequest().permitAll())
//                    .build();
//        }
//    }
//
//    @Test
//    @DisplayName("POST /api/v1/posts/create - should create post successfully")
//    void createPost_shouldReturnSuccess() throws Exception {
//        PostCreateRequest request = new PostCreateRequest(1L,
//                "Hello TribeTalk", null, "EVERYONE",
//                "EVERYONE", null, null,
//                null, null, null);
//
//        PostResponse response = new PostResponse("123", 1L,
//                "Hello TribeTalk", null, "EVERYONE",
//                "EVERYONE", null, null,
//                null, null, null, 0, 0, null);
//
//        MockMultipartFile jsonPart = new MockMultipartFile("data", "", "application/json",
//                objectMapper.writeValueAsBytes(request));
//
//        MockMultipartFile mediaPart = new MockMultipartFile(
//                "media", "image.jpg", "image/jpeg", "fake-image-content".getBytes()
//        );
//
//        Mockito.when(postService.save(any(), any())).thenReturn(response);
//
//        mockMvc.perform(MockMvcRequestBuilders.multipart("/api/v1/posts/create")
//                        .file(jsonPart)
//                        .file(mediaPart)
//                        .contentType(MediaType.MULTIPART_FORM_DATA))
//                .andExpect(status().isOk())
//                .andExpect(jsonPath("$.text").value("Hello TribeTalk"))
//                .andExpect(jsonPath("$.userId").value(1));
//
//    }
//
//    @Test
//    @DisplayName("GET /api/v1/posts/userPost - should return posts by user")
//    void getPostByUserId_shouldReturnPosts() throws Exception {
//        PostResponse post = new PostResponse(
//                "123", 1L, "User post", null, null,
//                null, null, null, null, null, null, 0, 0, null
//        );
//
//        Mockito.when(postService.findByUserId(1L)).thenReturn(List.of(post));
//
//        mockMvc.perform(MockMvcRequestBuilders.get("/api/v1/posts/userPost")
//                        .param("userId", "1"))
//                .andExpect(status().isOk())
//                .andExpect(jsonPath("$[0].text").value("User post"))
//                .andExpect(jsonPath("$[0].userId").value(1));
//    }
//
//    @Test
//    @DisplayName("GET /api/v1/posts/all - should return all posts")
//    void getAllPosts_shouldReturnAll() throws Exception {
//        PostResponse post = new PostResponse(
//                "123", 2L, "Global post", null, null,
//                null, null, null, null, null, null, 0, 0, null
//        );
//
//        Mockito.when(postService.getAll()).thenReturn(List.of(post));
//
//        mockMvc.perform(MockMvcRequestBuilders.get("/api/v1/posts/all"))
//                .andExpect(status().isOk())
//                .andExpect(jsonPath("$[0].text").value("Global post"))
//                .andExpect(jsonPath("$[0].userId").value(2));
//    }
//
//
//}
