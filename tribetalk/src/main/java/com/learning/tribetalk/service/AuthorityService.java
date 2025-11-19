package com.learning.tribetalk.service;

import com.learning.tribetalk.entity.Authority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

import java.util.Optional;

public interface AuthorityService {
    Optional<Object> findByAuthority(String roleName);
}
