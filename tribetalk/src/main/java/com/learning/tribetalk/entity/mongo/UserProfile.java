package com.learning.tribetalk.entity.mongo;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.annotation.Id;
import java.time.Instant;

@Document(collection = "user_profiles")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserProfile {

    @Id
    private String id;

    @NotNull
    @Indexed
    private Long userId;

    @NotNull
    @Indexed
    private String displayName;

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