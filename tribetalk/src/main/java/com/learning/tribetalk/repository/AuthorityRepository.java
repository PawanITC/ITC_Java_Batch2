package com.learning.tribetalk.repository;

import com.learning.tribetalk.dto.RegistrationRequest;
import com.learning.tribetalk.entity.Authority;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.repository.CrudRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
@Repository
public interface AuthorityRepository extends JpaRepository<Authority, Integer> {
    Optional<Object> findByAuthority(String authority);

}
