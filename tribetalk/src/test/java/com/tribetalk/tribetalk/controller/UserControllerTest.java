package com.tribetalk.tribetalk.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.tribetalk.tribetalk.dto.RegistrationRequest;
import com.tribetalk.tribetalk.service.UserService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.http.MediaType;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders;

import static org.mockito.ArgumentMatchers.any;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(UserController.class)
public class UserControllerTest {
    @Autowired
    private MockMvc mockmvc;

    @MockitoBean
    private UserService userService;

    private final ObjectMapper objectMapper=new ObjectMapper();

    //Disabling Security for tests
    @TestConfiguration
    static class TestSecurityConfig {

        @Bean
        public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
            return http
                    .csrf(AbstractHttpConfigurer::disable)
                    .authorizeHttpRequests(auth -> auth.anyRequest().permitAll())
                    .build();
        }
    }
    //Save User Test

    @Test
    @DisplayName("POST /api/users/save - should register user successfully")
    void registerUserTest() throws Exception{
        Mockito.doNothing().when(userService).registerUser(any(RegistrationRequest.class));

        String jsonrequest= """
                {
                "username":"johndoe",
                "email":"johndoe@example.com",
                "password":"$Password1"
                }
                """;
        mockmvc.perform(MockMvcRequestBuilders.post("/api/users/save")
                .contentType(MediaType.APPLICATION_JSON)
                .content(jsonrequest))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("User Registered Successfully"));
    }



    //Get All User Test

    @Test
    void getAllUsers_shouldReturnListofUsers()throws Exception{
        mockmvc.perform(MockMvcRequestBuilders.get("/api/users/all"))
                .andExpect(status().isOk());
    }

    //Update User Test

    @Test
    void updateUser_shouldReturnOK() throws Exception{
        RegistrationRequest request=new RegistrationRequest("John.Doe","johndoe@exmaple.com","$Password1");

        mockmvc.perform(MockMvcRequestBuilders.put("/api/users/1")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request))).andExpect(status().isOk());
    }

    //Delete User Test
    @Test
    void deleteUser_ShouldReturnOK()throws Exception{
        mockmvc.perform(MockMvcRequestBuilders.delete("/api/users/1").contentType(MediaType.APPLICATION_JSON)).andExpect(status().isOk());
    }
}
