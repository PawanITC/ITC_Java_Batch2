/*
Compute the sum, average, min, max of a list of ints.
Hints: mapToInt, sum, average, min, max, or summaryStatistics.
*/
package com.tribetalk.tribetalk.Rahis.StreamAPI;

import java.util.Arrays;
import java.util.IntSummaryStatistics;
import java.util.List;

public class SummaryStatistics {
    public static void main(String[] args) {

        List<Integer> listints= Arrays.asList(10, 20, 30, 40, 50);

        IntSummaryStatistics intSummaryStatistics =computeInts(listints);
        System.out.println("Sum is : "+intSummaryStatistics.getSum());
        System.out.println("Average is : "+intSummaryStatistics.getAverage());
        System.out.println("Min is : "+intSummaryStatistics.getMin());
        System.out.println("Max is : "+intSummaryStatistics.getMax());

    }

    private static IntSummaryStatistics computeInts(List<Integer> listints) {
        return listints.stream().mapToInt(Integer::intValue).summaryStatistics();
    }
}
