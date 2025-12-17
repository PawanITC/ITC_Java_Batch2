package com.learning.tribetalk.service.mongo;

import com.learning.tribetalk.dto.SearchUserDTO;
import com.learning.tribetalk.dto.response.PostResponse;
import com.learning.tribetalk.dto.response.SearchSuggestionsResponse;

import java.util.List;

public interface SearchService {
    List<PostResponse> searchPosts(String query);

    List<PostResponse> searchHashtags(String hashtag);

    List<PostResponse> searchMentions(String mention);

    List<SearchUserDTO> searchPeople(String query);

    SearchSuggestionsResponse getSuggestions(String query);
}
