package com.learning.tribetalk.dto.response;

import com.learning.tribetalk.dto.request.NewsRequest;
import lombok.Data;

import java.util.List;

@Data
public class NewsResponse {
    private String status;
    private Integer totalResults;
    private List<NewsRequest> results;
    private String nextPage;
    private String message;
}
