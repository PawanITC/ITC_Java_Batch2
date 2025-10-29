package com.tribetalk.tribetalk.Gowthami.srcV2;

import java.util.Comparator;
import java.util.List;
import java.util.Random;
import java.util.stream.Stream;

public class StreamSecondHighestNumberInAList {
    public static void main(String[] args) {

//        Find the second highest number in a list (or Optional if not present).
//        Hints: distinct, sorted(reverseOrder()), skip(1), findFirst.

        //creating a random object to create random numbers
        Random random = new Random();
        //using stream to generate random 10 numbers from 1 to 20 and convert that into list
        List<Integer> list = Stream.generate(() -> random.nextInt(20) + 1).limit(10).toList();
        //printing the list
        System.out.println(list.toString());
        //to find the second highest number - sorting the list in descending order and skip the 1st number and get the next one. If the length of the list is less than the 2, this will throe the runtime exception
        int secondHighestNum = list.stream().sorted(Comparator.reverseOrder()).skip(1).findFirst().orElseThrow(() -> new RuntimeException("Can't find"));
        //printing the second highest number
        System.out.println("Second Highest Number in the list : " + secondHighestNum);
    }
}
