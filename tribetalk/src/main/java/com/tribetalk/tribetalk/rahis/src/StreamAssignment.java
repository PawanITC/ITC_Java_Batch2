package com.tribetalk.tribetalk.rahis.src;

import java.util.*;
import java.util.stream.Collectors;

//TIP To <b>Run</b> code, press <shortcut actionId="Run"/> or
// click the <icon src="AllIcons.Actions.Execute"/> icon in the gutter.
public class StreamAssignment {
    public static void main(String[] args) {
        //Q1# Given List<Integer> nums, return a List<Integer> of squares of even numbers in ascending order.
        List<Integer> nums= Arrays.asList(3,-2,8,5,0,-4,7);
        List<Integer> evenSquares=evenNoSquares(nums);
        System.out.println(evenSquares);

        //Q2# From List<String> words, get unique lowercase words with length > 3.
        List<String> words=Arrays.asList("Apple", "banana", "CAT", "dog", "apple", "Eagle", "cat", "Zebra");
        List<String> uniqueWords=uniqueLowerCaseWords(words);
        System.out.println(uniqueWords);

        //Q3#Given List<Person> people, get names of persons older than 30 sorted by age desc, then name asc.
        List<Person> people = Arrays.asList(
                new Person("Alice", 25),
                new Person("Bob", 35),
                new Person("Charlie", 42),
                new Person("David", 35),
                new Person("Eve", 28),
                new Person("Frank", 42)
        );

        List<String> sortedPeople= sortPeople(people);
        System.out.println(sortedPeople);

        //Q4# Count how many strings start with letter ‘A’ or ‘a’ in a list.
        List<String> fruits=Arrays.asList("Apple", "banana", "Avocado", "orange", "airplane");
        long fruitsCount=filterFruits(fruits);
        System.out.println(fruitsCount);

        //Q5# Compute the sum, average, min, max of a list of ints.
        List<Integer> listints=Arrays.asList(10, 20, 30, 40, 50);

        IntSummaryStatistics intSummaryStatistics =computeInts(listints);
        System.out.println("Sum is : "+intSummaryStatistics.getSum());
        System.out.println("Average is : "+intSummaryStatistics.getAverage());
        System.out.println("Min is : "+intSummaryStatistics.getMin());
        System.out.println("Max is : "+intSummaryStatistics.getMax());


    }

    private static IntSummaryStatistics computeInts(List<Integer> listints) {
        return listints.stream().mapToInt(Integer::intValue).summaryStatistics();
    }

    private static long filterFruits(List<String> fruits) {
        return fruits.stream().map(String::toLowerCase).filter(f->f.startsWith("a")).count();
    }

    private static List<String> sortPeople(List<Person> people) {
        return people.stream().filter(p->p.age()>30).sorted(Comparator.comparing(Person::age).reversed().thenComparing(Person::name)).map(Person::name).toList();
    }

    private static List<String> uniqueLowerCaseWords(List<String> words) {
        return new ArrayList<>(words.stream().map(String::toLowerCase).filter(str -> str.length() > 3).distinct().toList());
    }

    private static List<Integer> evenNoSquares(List<Integer> nums) {
        return nums.stream().filter(n->n%2==0).map(s->s*s).sorted().collect(Collectors.toList());
    }

    private record Person(String name,int age){}

}