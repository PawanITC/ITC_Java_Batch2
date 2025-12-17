package com.learning.tribetalk.service.mongo;

import com.learning.tribetalk.dto.request.NewsRequest;

import java.util.List;

public interface NewsService {
    List<NewsRequest> fetchNews(String category, String q, String country, String language, int size);
}
