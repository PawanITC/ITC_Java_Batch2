/*Count how many strings start with letter ‘A’ or ‘a’ in a list.
Hints: map to lower, filter(s -> s.startsWith("a")), count.*/
package com.tribetalk.tribetalk.Rahis.StreamAPI;

import java.util.Arrays;
import java.util.List;

public class FilterFruits {
    public static void main(String[] args) {
        List<String> fruits= Arrays.asList("Apple", "banana", "Avocado", "orange", "airplane");
        long fruitsCount=filterFruits(fruits);
        System.out.println(fruitsCount);
    }

    private static long filterFruits(List<String> fruits) {
        return fruits.stream().map(String::toLowerCase).filter(f->f.startsWith("a")).count();
    }
}
