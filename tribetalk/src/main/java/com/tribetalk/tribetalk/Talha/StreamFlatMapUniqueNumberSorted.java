package com.tribetalk.tribetalk.Talha;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collection;
import java.util.List;
import java.util.stream.Collectors;
import java.util.stream.IntStream;

public class StreamFlatMapUniqueNumberSorted {

    public static void main(String[] args) {
        //        Given List<List<Integer>> nested, flatten and get unique numbers sorted.
//
//                Hints: flatMap(List::stream), distinct, sorted.
//

        List<List<Integer>> numbers= new ArrayList<List<Integer>>();
        numbers.add(new ArrayList<>(Arrays.asList(8,7,6,5,4,3,2,1)));
        numbers.add(new ArrayList<>(List.of(1,2,3,4,5,6,7,8)));
        numbers.add(IntStream.range(0,50).boxed().collect(Collectors.toList()));

        numbers.stream().flatMap(Collection::stream).distinct().sorted().forEach(System.out::println);

    }
}
