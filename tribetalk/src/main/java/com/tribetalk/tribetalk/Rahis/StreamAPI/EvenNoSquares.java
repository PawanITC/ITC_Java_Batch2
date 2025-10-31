/*
Given List<Integer> nums, return a List<Integer> of squares of even numbers in ascending order.
Hints: filter, map, sorted, collect.
* */
package com.tribetalk.tribetalk.Rahis.StreamAPI;

import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

public class EvenNoSquares {
    public static void main(String[] args) {

        List<Integer> nums = Arrays.asList(3, -2, 8, 5, 0, -4, 7);
        List<Integer> evenSquares = evenNoSquares(nums);
        System.out.println(evenSquares);
    }

    private static List<Integer> evenNoSquares(List<Integer> nums) {
        return nums.stream().filter(n->n%2==0).map(s->s*s).sorted().collect(Collectors.toList());
    }
}
