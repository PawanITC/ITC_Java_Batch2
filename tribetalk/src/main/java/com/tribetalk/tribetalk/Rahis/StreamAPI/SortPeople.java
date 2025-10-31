/*
Given List<Person> people, get names of persons older than 30 sorted by age desc, then name asc.
Hints: filter(p -> p.getAge() > 30), sorted(comparing(Person::getAge).reversed().thenComparing(Person::getName)), map(Person::getName), toList.
*/

package com.tribetalk.tribetalk.Rahis.StreamAPI;


import java.util.Arrays;
import java.util.Comparator;
import java.util.List;

public class SortPeople {
    public static void main(String[] args) {
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
    }

    private static List<String> sortPeople(List<Person> people) {
        return people.stream().filter(p->p.age()>30).sorted(Comparator.comparing(Person::age).reversed().thenComparing(Person::name)).map(Person::name).toList();
    }

    private record Person(String name,int age){}
}
