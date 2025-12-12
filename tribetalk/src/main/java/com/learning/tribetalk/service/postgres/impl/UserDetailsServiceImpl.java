package com.learning.tribetalk.service.postgres.impl;

import com.learning.tribetalk.dto.response.UserDetailsResponse;

public class UserDetailsServiceImpl {
     private final UserDetailsResponse userDetailsResponse ;

    UserDetailsServiceImpl(UserDetailsResponse userDetailsResponse)
    {
        this.userDetailsResponse=userDetailsResponse;
    }
   public UserDetailsResponse getUserDetails(Long userId)
    {

        return userDetailsResponse;
    }
}
