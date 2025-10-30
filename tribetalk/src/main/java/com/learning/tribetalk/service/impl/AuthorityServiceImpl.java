package com.learning.tribetalk.service.impl;

import com.learning.tribetalk.entity.Authority;
import com.learning.tribetalk.repository.AuthorityRepository;
import com.learning.tribetalk.service.AuthorityService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class AuthorityServiceImpl implements AuthorityService {
    @Autowired
    private AuthorityRepository repo;

    @Override
    public Optional<Object> findByAuthority(String roleName) {
        return repo.findByAuthority(roleName);
    }




}
