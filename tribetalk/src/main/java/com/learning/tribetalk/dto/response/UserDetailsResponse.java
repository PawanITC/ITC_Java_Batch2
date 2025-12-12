package com.learning.tribetalk.dto.response;

import java.time.Instant;

public record UserDetailsResponse(
                                    Long userId,
                                    String displayname,
                                    String username,
                                    String bio,
                                    String location,
                                    String userProfilePicture,
                                    String userCoverPicture,
                                    Instant createdAt ) {

}
