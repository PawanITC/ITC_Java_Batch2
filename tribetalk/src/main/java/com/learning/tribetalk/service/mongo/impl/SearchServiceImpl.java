package com.learning.tribetalk.service.mongo.impl;

import com.learning.tribetalk.dto.SearchUserDTO;
import com.learning.tribetalk.dto.response.PostResponse;
import com.learning.tribetalk.dto.response.SearchSuggestionsResponse;
import com.learning.tribetalk.entity.mongo.Post;
import com.learning.tribetalk.entity.postgres.User;
import com.learning.tribetalk.mapper.PostMapper;
import com.learning.tribetalk.repository.mongo.PostRepository;
import com.learning.tribetalk.repository.postgres.UserRepository;
import com.learning.tribetalk.service.mongo.PostService;
import com.learning.tribetalk.service.mongo.SearchService;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
public class SearchServiceImpl implements SearchService {
    private final PostRepository postRepository;
    private final UserRepository userRepository;
    private final PostService postService;

    @Override
    @Cacheable(value = "searchPosts", key = "#query")
    public List<PostResponse> searchPosts(String query) {
         List<Post> posts = postRepository.findByTextContainingIgnoreCaseOrderByCreatedAtDesc(query);
        return posts.stream().map(postService::mapToResponse).toList();
    }

    @Override
    @Cacheable(value = "searchHashtags", key = "#hashtag")
    public List<PostResponse> searchHashtags(String hashtag) {
        String tag = hashtag.replace("#", "");
        List<Post> posts = postRepository.findByHashtagsContainingIgnoreCaseOrderByCreatedAtDesc(tag);
        return posts.stream().map(postService::mapToResponse).toList();
    }

    @Override
    @Cacheable(value = "searchMentions", key = "#mention")
    public List<PostResponse> searchMentions(String mention) {
        String m = mention.replace("@", "");
        List<Post> posts = postRepository.findByMentionsContainingIgnoreCaseOrderByCreatedAtDesc(m);
        return posts.stream().map(postService::mapToResponse).toList();
    }

    @Override
    @Cacheable(value = "searchPeople", key = "#query")
    public List<SearchUserDTO> searchPeople(String query) {
        List<User> users = userRepository.searchByUsernameOrDisplayname(query);
        return users.stream()
                .map(u -> new SearchUserDTO(u.getId(), u.getUsername(), u.getDisplayname()))
                .toList();
    }

    @Override
    @Cacheable(value = "searchSuggestions", key = "#query")
    public SearchSuggestionsResponse getSuggestions(String query) {
        // 1. Users
        List<User> users = userRepository.searchByPrefix(query);
        List<SearchUserDTO> userDTOs = users.stream()
                .map(u -> new SearchUserDTO(u.getId(), u.getUsername(), u.getDisplayname()))
                .toList();

        // 2. Hashtags
        List<Post> posts = postRepository.findDistinctHashtagsStartingWith(query);
//        List<String> hashtags = posts.stream()
//                .flatMap(p -> p.getHashtags().stream())
//                .filter(tag -> tag.toLowerCase().startsWith(query.toLowerCase()))
//                .distinct()
//                .toList();
        List<String> hashtags = posts.stream()
                .flatMap(p -> Optional.ofNullable(p.getHashtags()).orElse(List.of()).stream())
                .filter(tag -> tag.toLowerCase().startsWith(query.toLowerCase()))
                .distinct()
                .toList();

        return new SearchSuggestionsResponse(userDTOs, hashtags);
    }
}
