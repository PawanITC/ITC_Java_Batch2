package com.learning.tribetalk.controller;

import com.learning.tribetalk.dto.SearchUserDTO;
import com.learning.tribetalk.dto.response.PostResponse;
import com.learning.tribetalk.dto.response.SearchSuggestionsResponse;
import com.learning.tribetalk.dto.response.UserResponse;
import com.learning.tribetalk.service.mongo.SearchService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/search")
public class SearchController {
    private final SearchService searchService;

    public SearchController(SearchService searchService) {
        this.searchService = searchService;
    }

    @GetMapping("/posts")
    public List<PostResponse> searchPosts(@RequestParam("q") String q) {
        return searchService.searchPosts(q);
    }

    @GetMapping("/hashtags")
    public List<PostResponse> searchHashtags(@RequestParam("q") String q) {
        return searchService.searchHashtags(q);
    }

    @GetMapping("/mentions")
    public List<PostResponse> searchMentions(@RequestParam("q") String q) {
        return searchService.searchMentions(q);
    }

    @GetMapping("/people")
    public List<SearchUserDTO> searchPeople(@RequestParam("q") String q) {
        return searchService.searchPeople(q);
    }

    @GetMapping("/suggestions")
    public SearchSuggestionsResponse suggestions(@RequestParam("q") String query) {
        return searchService.getSuggestions(query);
    }
}
