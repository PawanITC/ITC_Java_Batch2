package com.learning.tribetalk.dto.response;

import com.learning.tribetalk.dto.SearchUserDTO;

import java.util.List;

public record SearchSuggestionsResponse(List<SearchUserDTO> users,
                                        List<String> hashtags) {
}
