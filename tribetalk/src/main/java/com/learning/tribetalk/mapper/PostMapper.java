package com.learning.tribetalk.mapper;

import com.learning.tribetalk.dto.request.PostCreateRequest;
import com.learning.tribetalk.dto.response.PostResponse;
import com.learning.tribetalk.entity.mongo.Post;
import java.util.HashSet;
import java.util.List;

public class PostMapper {
    // Entity -> DTO
    public static PostResponse toResponse(Post post, List<String> presignedUrls) {
        Integer totalVotes = null;
        List<PostResponse.PollOptionDTO> optionDTOs = null;

        if (post.getPoll() != null && post.getPoll().options() != null) {
            int total = post.getPoll().options().stream().mapToInt(Post.PollOption::votes).sum();
            totalVotes = total;

            optionDTOs = post.getPoll().options().stream()
                    .map(opt -> {
                        double pct = total > 0 ? (opt.votes() * 100.0 / total) : 0.0;
                        return new PostResponse.PollOptionDTO(opt.option(), opt.votes(), pct);
                    })
                    .toList();
        }

        //  Map media list
        List<PostResponse.MediaDTO> mediaDTOs = null;
        if (post.getMediaList() != null && presignedUrls != null) {
            mediaDTOs = post.getMediaList().stream()
                    .map(m -> new PostResponse.MediaDTO(
                            presignedUrls.get(post.getMediaList().indexOf(m)),
                            m.type()))
                    .toList();
        }

        return new PostResponse(
                post.getId(),
                post.getUserId(),
                post.getText(),
                post.getScheduledAt(),
                post.getVisibility().name(),
                post.getReplyPermission().name(),
                post.getHashtags(),
                post.getMentions(),
                post.getUrls(),
                mediaDTOs,
                post.getPoll() != null ? new PostResponse.PollDTO(
                        optionDTOs, post.getPoll().expiresAt(), totalVotes, post.getVotedBy(), null) : null,
                post.getReplyToPostId(),
                post.getReplyToUsername(),
                post.getReplyCount(),
                post.getLikedBy(),
                post.getBookmarkedBy(),
                post.getLikeCount(),
                post.getViewCount(),
                post.getCreatedAt()
        );
    }

    // DTO -> Entity
    public static Post toEntity(PostCreateRequest dto) {
        return Post.builder()
                .userId(dto.userId())
                .text(dto.text())
                .scheduledAt(dto.scheduledAt())
                .visibility(Post.Visibility.valueOf(dto.visibility()))
                .replyPermission(Post.ReplyPermission.valueOf(dto.replyPermission()))
                .hashtags(dto.hashtags())
                .mentions(dto.mentions())
                .urls(dto.urls())
                .mediaList(mapMediaList(dto.mediaList()))
                .poll(mapPoll(dto.poll()))
                .replyToPostId(dto.replyToPostId())
                .replyToUsername(dto.replyToUsername())
                .likedBy(dto.likedBy() != null ? new HashSet<>(dto.likedBy()) : new HashSet<>())
                .bookmarkedBy(dto.bookmarkedBy() != null ? new HashSet<>(dto.bookmarkedBy()) : new HashSet<>())
                .build();
    }

    // Map list of media
    private static List<Post.Media> mapMediaList(List<PostCreateRequest.MediaDTO> mediaList) {
        if (mediaList == null) return null;
        return mediaList.stream()
                .map(m -> new Post.Media(m.url(), m.type()))
                .toList();
    }

    // Map poll
    private static Post.Poll mapPoll(PostCreateRequest.PollDTO pollDTO) {
        if (pollDTO == null) return null;
        List<Post.PollOption> options = pollDTO.options().stream()
                .map(opt -> new Post.PollOption(opt.option(), opt.votes()))
                .toList();
        return new Post.Poll(options, pollDTO.expiresAt());
    }
}
