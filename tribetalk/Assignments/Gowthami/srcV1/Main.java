
import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;
import java.util.stream.IntStream;
import java.util.stream.Stream;

public class Main {
    public static void main(String[] args) {

//        1. Find the second highest number in a list (or Optional if not present).
//        Hints: distinct, sorted(reverseOrder()), skip(1), findFirst.

        Random random = new Random();
        List<Integer> list = Stream.generate(()-> random.nextInt(20)+1).limit(10).toList();

        int secondHighestNum = list.stream().sorted(Comparator.reverseOrder()).skip(1).findFirst().orElseThrow(()-> new RuntimeException("Can't find"));

        System.out.println("Second Highest Number in the list : "+secondHighestNum);



//        2. Partition a list of integers into even and odd using a Map<Boolean, List<Integer>>.
//        Hints: Collectors.partitioningBy(n -> n % 2 == 0).

        List<Integer> list1 = IntStream.rangeClosed(1,10).boxed().toList();

        Map<Boolean, List<Integer>> map = list1.stream().collect(Collectors.partitioningBy(l -> (l%2 == 0)));
        System.out.println(map.entrySet().stream().map(mKey -> mKey.getKey() + " -> " + mKey.getValue()).collect(Collectors.joining(",","{","}")));


//       3. Convert a List<Employee> to Map<id, Employee> handling duplicate ids by keeping the latest joined employee.
//        Hints: toMap(Employee::getId, e -> e, (e1, e2) -> e1.getJoinDate().isAfter(e2.getJoinDate()) ? e1 : e2).

        List<Employee> emp = Arrays.asList(
                new Employee(1, "Gowthami", LocalDate.of(2020, 5, 10)),
                new Employee(1, "Solai", LocalDate.of(2022, 3, 15)),
                new Employee(2, "Vashiska", LocalDate.of(2021, 1, 20))
        );

        Map<Integer, Employee> employeeMap = emp.stream().collect(Collectors.toMap(Employee :: getId,e -> e,(e1,e2) -> e1.getJoinDate().isAfter(e2.getJoinDate()) ? e1 : e2));

        System.out.println(employeeMap.values().stream().map(Employee::toString).toList());



//        4. Join a list of strings into a CSV like "a,b,c" with a prefix/suffix "[", "]".
//                Hints: Collectors.joining(",", "[", "]").

        List<String> str = Arrays.asList("a", "b", "c");
        String output = str.stream().collect(Collectors.joining(",","[","]"));
        System.out.println("Added prefix/suffix : "+output);


//        5. Safely find any element matching a predicate, returning Optional<T> without throwing.
//                Hints: filter, findFirst (sequential) or findAny (parallel), Optional API.

        List<String> str1 = Arrays.asList("Java", "c++", "Javascript", "Python");

        Optional<String> find = str1.stream()
                .filter(s -> s.startsWith("J"))
                .findFirst();

        System.out.println(find.stream().toList());
    }
}