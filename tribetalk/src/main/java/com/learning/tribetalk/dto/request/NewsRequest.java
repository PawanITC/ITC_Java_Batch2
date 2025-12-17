package com.learning.tribetalk.dto.request;

import lombok.Data;

import java.util.List;

@Data
public class NewsRequest {
    private String article_id;
    private String link;
    private String title;
    private String description;
    private String content;

    private List<String> keywords;   // ✅ FIXED
    private List<String> creator;    // ✅ FIXED
    private String language;

    private List<String> country;    // ✅ FIXED
    private List<String> category;   // ✅ FIXED

    private String datatype;
    private String pubDate;
    private String pubDateTZ;

    private String image_url;
    private String video_url;

    private String source_id;
    private String source_name;
    private Integer source_priority;
    private String source_url;
    private String source_icon;

    private String sentiment;
    private String sentiment_stats;
    private String ai_tag;
    private String ai_region;
    private String ai_org;
    private String ai_summary;

    private boolean duplicate;
}
