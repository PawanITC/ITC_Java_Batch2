package com.learning.tribetalk.controller;

import com.github.benmanes.caffeine.cache.Caffeine;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.cache.Cache;
import org.springframework.cache.CacheManager;
import org.springframework.cache.caffeine.CaffeineCacheManager;

import java.util.concurrent.TimeUnit;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Unit test for Caffeine Cache configuration
 * Tests the cache behavior without requiring Spring Boot context
 */
class CaffeineCacheConfigurationTest {

    private CacheManager cacheManager;

    @BeforeEach
    void setUp() {
        // Replicate the exact configuration from AppConfig
        CaffeineCacheManager manager = new CaffeineCacheManager("followersCount", "followingCount", "posts", "userPosts");
        manager.setCaffeine(
                Caffeine.newBuilder()
                        .recordStats()
                        .expireAfterWrite(10, TimeUnit.MINUTES)
                        .maximumSize(10_000)
        );
        cacheManager = manager;
    }

    @Test
    void testCacheManager_IsConfigured() {
        // Verify cache manager is properly configured
        assertThat(cacheManager).isNotNull();

        // Verify all expected caches exist
        assertThat(cacheManager.getCache("followersCount")).isNotNull();
        assertThat(cacheManager.getCache("followingCount")).isNotNull();
        assertThat(cacheManager.getCache("posts")).isNotNull();
        assertThat(cacheManager.getCache("userPosts")).isNotNull();
    }

    @Test
    void testFollowersCountCache_StoresAndRetrievesData() {
        // Arrange
        Cache followersCountCache = cacheManager.getCache("followersCount");
        assertThat(followersCountCache).isNotNull();

        Long userId = 1L;
        Long followersCount = 100L;

        // Act - Put value in cache
        followersCountCache.put(userId, followersCount);

        // Assert - Retrieve from cache
        Cache.ValueWrapper wrapper = followersCountCache.get(userId);
        assertThat(wrapper).isNotNull();
        assertThat(wrapper.get()).isEqualTo(followersCount);
    }

    @Test
    void testFollowingCountCache_StoresAndRetrievesData() {
        // Arrange
        Cache followingCountCache = cacheManager.getCache("followingCount");
        assertThat(followingCountCache).isNotNull();

        Long userId = 2L;
        Long followingCount = 50L;

        // Act - Put value in cache
        followingCountCache.put(userId, followingCount);

        // Assert - Retrieve from cache
        Cache.ValueWrapper wrapper = followingCountCache.get(userId);
        assertThat(wrapper).isNotNull();
        assertThat(wrapper.get()).isEqualTo(followingCount);
    }

    @Test
    void testCache_Eviction() {
        // Arrange
        Cache followersCountCache = cacheManager.getCache("followersCount");
        assertThat(followersCountCache).isNotNull();

        Long userId = 3L;
        Long followersCount = 75L;
        followersCountCache.put(userId, followersCount);

        // Verify value is in cache
        assertThat(followersCountCache.get(userId)).isNotNull();

        // Act - Evict the cache entry
        followersCountCache.evict(userId);

        // Assert - Value should no longer be in cache
        assertThat(followersCountCache.get(userId)).isNull();
    }

    @Test
    void testCache_ClearAll() {
        // Arrange
        Cache followersCountCache = cacheManager.getCache("followersCount");
        assertThat(followersCountCache).isNotNull();

        followersCountCache.put(1L, 100L);
        followersCountCache.put(2L, 200L);
        followersCountCache.put(3L, 300L);

        // Act - Clear all cache entries
        followersCountCache.clear();

        // Assert - All values should be removed
        assertThat(followersCountCache.get(1L)).isNull();
        assertThat(followersCountCache.get(2L)).isNull();
        assertThat(followersCountCache.get(3L)).isNull();
    }

    @Test
    void testMultipleCaches_IndependentStorage() {
        // Arrange
        Cache followersCountCache = cacheManager.getCache("followersCount");
        Cache followingCountCache = cacheManager.getCache("followingCount");

        assertThat(followersCountCache).isNotNull();
        assertThat(followingCountCache).isNotNull();

        Long userId = 1L;

        // Act - Store different values in different caches with same key
        followersCountCache.put(userId, 100L);
        followingCountCache.put(userId, 50L);

        // Assert - Each cache maintains its own value
        Cache.ValueWrapper followersWrapper = followersCountCache.get(userId);
        Cache.ValueWrapper followingWrapper = followingCountCache.get(userId);

        assertThat(followersWrapper).isNotNull();
        assertThat(followingWrapper).isNotNull();
        assertThat(followersWrapper.get()).isEqualTo(100L);
        assertThat(followingWrapper.get()).isEqualTo(50L);
    }

    @Test
    void testCache_NullValue() {
        // Arrange
        Cache followersCountCache = cacheManager.getCache("followersCount");
        assertThat(followersCountCache).isNotNull();

        Long userId = 999L;

        // Act - Try to get non-existent value
        Cache.ValueWrapper wrapper = followersCountCache.get(userId);

        // Assert - Should return null for non-existent key
        assertThat(wrapper).isNull();
    }

    @Test
    void testCache_UpdateValue() {
        // Arrange
        Cache followersCountCache = cacheManager.getCache("followersCount");
        assertThat(followersCountCache).isNotNull();

        Long userId = 5L;
        Long initialCount = 10L;
        Long updatedCount = 20L;

        // Act - Put initial value
        followersCountCache.put(userId, initialCount);
        Cache.ValueWrapper initialWrapper = followersCountCache.get(userId);
        assertThat(initialWrapper.get()).isEqualTo(initialCount);

        // Update the value
        followersCountCache.put(userId, updatedCount);
        Cache.ValueWrapper updatedWrapper = followersCountCache.get(userId);

        // Assert - Value should be updated
        assertThat(updatedWrapper.get()).isEqualTo(updatedCount);
    }

    @Test
    void testPostsCache_StoresData() {
        // Arrange
        Cache postsCache = cacheManager.getCache("posts");
        assertThat(postsCache).isNotNull();

        Long postId = 100L;
        String postContent = "Test post content";

        // Act
        postsCache.put(postId, postContent);

        // Assert
        Cache.ValueWrapper wrapper = postsCache.get(postId);
        assertThat(wrapper).isNotNull();
        assertThat(wrapper.get()).isEqualTo(postContent);
    }

    @Test
    void testUserPostsCache_StoresData() {
        // Arrange
        Cache userPostsCache = cacheManager.getCache("userPosts");
        assertThat(userPostsCache).isNotNull();

        Long userId = 10L;
        String userPostsData = "User posts data";

        // Act
        userPostsCache.put(userId, userPostsData);

        // Assert
        Cache.ValueWrapper wrapper = userPostsCache.get(userId);
        assertThat(wrapper).isNotNull();
        assertThat(wrapper.get()).isEqualTo(userPostsData);
    }

    @Test
    void testCaffeineCacheConfiguration() {
        // Verify all four configured caches are available
        assertThat(cacheManager.getCacheNames())
                .containsExactlyInAnyOrder("followersCount", "followingCount", "posts", "userPosts");
    }

    @Test
    void testCache_PutIfAbsent() {
        // Arrange
        Cache followersCountCache = cacheManager.getCache("followersCount");
        assertThat(followersCountCache).isNotNull();

        Long userId = 6L;
        Long count1 = 100L;
        Long count2 = 200L;

        // Act - Put first value
        Cache.ValueWrapper result1 = followersCountCache.putIfAbsent(userId, count1);
        // Try to put second value (should not override)
        Cache.ValueWrapper result2 = followersCountCache.putIfAbsent(userId, count2);

        // Assert
        assertThat(result1).isNull(); // First put returns null (no existing value)
        assertThat(result2).isNotNull(); // Second put returns existing value
        assertThat(result2.get()).isEqualTo(count1); // Original value is preserved

        Cache.ValueWrapper finalWrapper = followersCountCache.get(userId);
        assertThat(finalWrapper.get()).isEqualTo(count1); // Value should still be count1
    }

    @Test
    void testCache_MultipleDataTypes() {
        // Arrange
        Cache followersCountCache = cacheManager.getCache("followersCount");
        assertThat(followersCountCache).isNotNull();

        // Act & Assert - Test with different data types
        followersCountCache.put("stringKey", "stringValue");
        followersCountCache.put(123, 456);
        followersCountCache.put(1L, 100L);

        assertThat(followersCountCache.get("stringKey").get()).isEqualTo("stringValue");
        assertThat(followersCountCache.get(123).get()).isEqualTo(456);
        assertThat(followersCountCache.get(1L).get()).isEqualTo(100L);
    }

    @Test
    void testCache_EvictAll() {
        // Arrange
        Cache followersCountCache = cacheManager.getCache("followersCount");
        Cache followingCountCache = cacheManager.getCache("followingCount");

        assertThat(followersCountCache).isNotNull();
        assertThat(followingCountCache).isNotNull();

        // Add data to both caches
        followersCountCache.put(1L, 100L);
        followingCountCache.put(1L, 50L);

        // Act - Clear only followersCount cache
        followersCountCache.clear();

        // Assert - Only followersCount should be cleared
        assertThat(followersCountCache.get(1L)).isNull();
        assertThat(followingCountCache.get(1L)).isNotNull();
        assertThat(followingCountCache.get(1L).get()).isEqualTo(50L);
    }
}