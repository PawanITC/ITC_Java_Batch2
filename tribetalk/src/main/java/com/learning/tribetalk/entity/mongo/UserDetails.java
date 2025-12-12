package com.learning.tribetalk.entity.mongo;

import jakarta.persistence.Id;
import jakarta.validation.constraints.NotNull;
import lombok.Builder;
import lombok.Data;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

@Document(collection="UserDetails")
@Builder
@Data
public class UserDetails {
    @Id
    private String id;
    @NotNull
    @Indexed
    private Long userId;
    @NotNull
    @Indexed
    private String displayname;
    @NotNull
    @Indexed
    private String username;
    private String bio;
    private String location;
    private String userProfilePicture;
    private String userCoverPicture;
    @Builder.Default
    private Instant createdAt = Instant.now();


}
