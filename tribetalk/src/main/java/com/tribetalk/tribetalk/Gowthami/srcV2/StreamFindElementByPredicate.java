package com.tribetalk.tribetalk.Gowthami.srcV2;

import java.util.Arrays;
import java.util.List;
import java.util.Optional;

public class StreamFindElementByPredicate {
    public static void main(String[] args) {
        //        5. Safely find any element matching a predicate, returning Optional<T> without throwing.
        //                Hints: filter, findFirst (sequential) or findAny (parallel), Optional API.

        List<String> str1 = Arrays.asList("Java", "c++", "Javascript", "Python");
        // filter the list has anything start with the letter "J"
        // the first find element will be return to it
        Optional<String> find = str1.stream()
                .filter(s -> s.startsWith("J"))
                .findFirst();
        //convert the Optional to list
        System.out.println(find.stream().toList());

    }
}
