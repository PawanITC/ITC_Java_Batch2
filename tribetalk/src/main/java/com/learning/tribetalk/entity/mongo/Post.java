package com.learning.tribetalk.entity.mongo;

import com.fasterxml.jackson.annotation.JsonInclude;
import jakarta.persistence.Id;
import jakarta.validation.constraints.NotNull;
import lombok.*;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Data
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
@Document(collection = "posts")
public class Post {
    @Id
    private String id;
    @NotNull
    @Indexed
    private Long userId;
    private String text;
    private Instant scheduledAt;
    @NotNull
    private Visibility visibility;
    @NotNull
    private ReplyPermission replyPermission;
    @Indexed
    private List<String> hashtags;
    @Indexed
    private List<String> mentions;
    private List<String> urls;
    private Media media;
    private Poll poll;
    @Builder.Default
    private String replyToPostId = null;
    private String replyToUsername;
    @Builder.Default
    private int replyCount = 0;
    @Builder.Default
    private Set<Long> likedBy = new HashSet<>();
    @Builder.Default
    private Set<Long> bookmarkedBy = new HashSet<>();
    @Builder.Default
    private int likeCount = 0;
    @Builder.Default
    private int viewCount = 0;
    @Builder.Default
    private Instant createdAt = Instant.now();

    public enum Visibility {
        EVERYONE, FOLLOWERS, MENTIONED
    }

    public enum ReplyPermission {
        EVERYONE, FOLLOWED, MENTIONED
    }


    public record Media(String url, String type) {
    }

    public record Poll(List<PollOption> options, Instant expiresAt) {
    }

    public record PollOption(String option, int votes) {
    }
}


