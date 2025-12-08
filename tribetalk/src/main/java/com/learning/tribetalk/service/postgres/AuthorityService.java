package com.learning.tribetalk.service.postgres;

import java.util.Optional;

public interface AuthorityService {
    Optional<Object> findByAuthority(String roleName);
}
