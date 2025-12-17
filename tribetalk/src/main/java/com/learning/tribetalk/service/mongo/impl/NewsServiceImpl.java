package com.learning.tribetalk.service.mongo.impl;

import com.learning.tribetalk.dto.request.NewsRequest;
import com.learning.tribetalk.dto.response.NewsResponse;
import com.learning.tribetalk.service.mongo.NewsService;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.util.List;

@Service
public class NewsServiceImpl implements NewsService {
    private final RestTemplate restTemplate = new RestTemplate();

    private static final String BASE_URL = "https://newsdata.io/api/1/latest";
    private static final String API_KEY = "pub_d120063f6a9646ecb8c7f4142c9e8c57";

    @Override
    @Cacheable(value = "newsCache", key = "#category + '-' + #q")
    public List<NewsRequest> fetchNews(String category, String q, String country, String language, int size) {

        UriComponentsBuilder builder = UriComponentsBuilder.fromHttpUrl(BASE_URL)
                .queryParam("apikey", API_KEY)
                .queryParam("country", country)
                .queryParam("language", language)
                .queryParam("size", size)
                .queryParam("removeduplicate", "1");

        // ✅ Only add if non-empty
        if (category != null && !category.isBlank()) {
            builder.queryParam("category", category);
        }
        if (q != null && !q.isBlank()) {
            builder.queryParam("q", q);
        }

        String url = builder.toUriString();
        System.out.println("NEWS API URL: " + url);

        try {
            String raw = restTemplate.getForObject(url, String.class);
            System.out.println("RAW NEWS RESPONSE: " + raw);

            //deserialize
            NewsResponse response = restTemplate.getForObject(url, NewsResponse.class);

            if (response == null) return List.of();
            if ("error".equalsIgnoreCase(response.getStatus())) {
                System.out.println("NEWS API ERROR: " + response.getMessage());
                return List.of();
            }

            return response.getResults() != null ? response.getResults() : List.of();
        } catch (Exception ex) {
            System.out.println("NEWS API EXCEPTION: " + ex.getMessage());
            return List.of();
        }
    }
}
