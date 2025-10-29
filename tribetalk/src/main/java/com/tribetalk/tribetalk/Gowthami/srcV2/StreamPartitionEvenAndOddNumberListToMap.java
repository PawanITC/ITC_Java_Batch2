package com.tribetalk.tribetalk.Gowthami.srcV2;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import java.util.stream.IntStream;

public class StreamPartitionEvenAndOddNumberListToMap {
    public static void main(String[] args) {
        //        Partition a list of integers into even and odd using a Map<Boolean, List<Integer>>.
        //        Hints: Collectors.partitioningBy(n -> n % 2 == 0).

        //generate 1 to 10 numbers
        // converting int to Integer
        // add that in the list.
        List<Integer> list1 = IntStream.rangeClosed(1, 10).boxed().toList();
        // partitioningBy method helps to split the list into two groups based on the condition, even or odd
        Map<Boolean, List<Integer>> map = list1.stream().collect(Collectors.partitioningBy(l -> (l % 2 == 0)));
        //to print the map, first getting the key and print it add the arrow and the get the key values and join the values by adding ,
        System.out.println(map.entrySet().stream().map(mKey -> mKey.getKey() + " -> " + mKey.getValue()).collect(Collectors.joining(",")));

    }
}
