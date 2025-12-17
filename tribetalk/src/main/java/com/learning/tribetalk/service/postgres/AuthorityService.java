package com.learning.tribetalk.service.postgres;

import com.learning.tribetalk.entity.postgres.Authority;
import java.util.Optional;

public interface AuthorityService {
    Optional<Authority> findByAuthority(String roleName);
}
