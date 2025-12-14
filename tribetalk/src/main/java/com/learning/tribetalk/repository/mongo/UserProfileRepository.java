package com.learning.tribetalk.repository.mongo;

import com.learning.tribetalk.entity.mongo.UserProfile;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.Optional;

public interface UserProfileRepository extends MongoRepository<UserProfile, String> {

    Optional<UserProfile> findByUserId(Long userId);

    boolean existsByUserId(Long userId);

    void deleteByUserId(Long userId);

    Optional<UserProfile> findByUsername(Long userId);

    boolean existsByUsername(Long userId);

    void deleteByUsername(Long userId);

}
