/*
From List<String> words, get unique lowercase words with length > 3.
Hints: map(String::toLowerCase), filter, distinct, collect(toList()).
*/

package com.tribetalk.tribetalk.Rahis.StreamAPI;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

public class UniqueLowerCaseWords {
    public static void main(String[] args) {

        List<String> words= Arrays.asList("Apple", "banana", "CAT", "dog", "apple", "Eagle", "cat", "Zebra");
        List<String> uniqueWords=uniqueLowerCaseWords(words);
        System.out.println(uniqueWords);
    }

    private static List<String> uniqueLowerCaseWords(List<String> words) {
        return new ArrayList<>(words.stream().map(String::toLowerCase).filter(str -> str.length() > 3).distinct().toList());
    }
}
