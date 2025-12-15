package com.learning.tribetalk.repository.postgres;

import com.learning.tribetalk.entity.postgres.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    boolean existsByUsername(String username);

    boolean existsByEmail(String email);

    Optional<User> findByUsername(String username);

    Optional<User> findByEmail(String email);

    @Query("""
                SELECT u FROM User u
                WHERE LOWER(u.username) LIKE LOWER(CONCAT('%', :query, '%'))
                   OR LOWER(u.displayname) LIKE LOWER(CONCAT('%', :query, '%'))
            """)
    List<User> searchByUsernameOrDisplayname(String query);

    @Query("""
                SELECT u FROM User u
                WHERE LOWER(u.username) LIKE LOWER(CONCAT(:prefix, '%'))
                   OR LOWER(u.displayname) LIKE LOWER(CONCAT(:prefix, '%'))
            """)
    List<User> searchByPrefix(String prefix);


}
