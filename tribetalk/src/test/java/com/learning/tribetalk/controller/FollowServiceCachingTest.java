//package com.learning.tribetalk.controller;
//
//import com.learning.tribetalk.config.SpyConfig;
//import com.learning.tribetalk.repository.postgres.FollowRepository;
//import com.learning.tribetalk.service.postgres.FollowService;
//import com.learning.tribetalk.service.postgres.impl.FollowServiceImpl;
//import org.junit.jupiter.api.Test;
//import org.mockito.Mockito;
//import org.springframework.beans.factory.annotation.Autowired;
//import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
//import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
//import org.springframework.boot.test.context.SpringBootTest;
//import org.springframework.boot.test.context.TestConfiguration;
//
//import org.springframework.context.annotation.Bean;
//import org.springframework.context.annotation.Import;
//import org.springframework.test.context.bean.override.mockito.MockitoBean;
//
//@WebMvcTest(FollowController.class)
//@Import(SpyConfig.class)
//@AutoConfigureMockMvc(addFilters = false)
//class FollowServiceCachingTest {
//
//    @Autowired
//    FollowService followService;
//
//    @MockitoBean
//    FollowRepository followRepository;
//
//    @Test
//    void testFollowersCountCaching() {
//
//        Long userId = 10L;
//
//        Mockito.when(followRepository.countByFollowingId(userId))
//                .thenReturn(5L);
//
//        followService.getFollowersCount(userId);
//        followService.getFollowersCount(userId);
//        followService.getFollowersCount(userId);
//
//        Mockito.verify(followService, Mockito.times(1))
//                .getFollowersCount(userId);
//    }
//
//
//}
