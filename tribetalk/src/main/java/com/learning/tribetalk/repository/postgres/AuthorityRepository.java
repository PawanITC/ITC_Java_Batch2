package com.learning.tribetalk.repository.postgres;

import com.learning.tribetalk.entity.postgres.Authority;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
@Repository
public interface AuthorityRepository extends JpaRepository<Authority, Integer> {
    Optional<Object> findByAuthority(String authority);

}
