package com.learning.tribetalk.controller;

import com.learning.tribetalk.dto.request.NewsRequest;
import com.learning.tribetalk.service.mongo.NewsService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/news")
@RequiredArgsConstructor
public class NewsController {
    private final NewsService newsService;

    @GetMapping
    public List<NewsRequest> getNews(
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String q,
            @RequestParam(defaultValue = "gb") String country,
            @RequestParam(defaultValue = "en") String language,
            @RequestParam(defaultValue = "10") int size
    ) {
        System.out.println("News controller");
        return newsService.fetchNews(category, q, country, language, size);
    }
}
