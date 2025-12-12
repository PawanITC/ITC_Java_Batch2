package com.learning.tribetalk.service.postgres;

import com.learning.tribetalk.dto.response.UserDetailsResponse;

public interface UserDetailsService {

    public UserDetailsResponse getUserDetails(Long userId);
}
