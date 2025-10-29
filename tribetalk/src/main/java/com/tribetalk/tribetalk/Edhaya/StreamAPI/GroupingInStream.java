/*
Group words by first letter into a Map<Character, List<String>> with words sorted in each group.

Hints: groupingBy(s -> s.charAt(0), mapping(Function.identity(), collectingAndThen(toList(), l -> { sort(l); return l; }))).
Alternatively groupingBy with toCollection(TreeSet) then convert to List.
 */



/*
Group words by first letter into a Map<Character, List<String>> with words sorted in each group.

Hints: groupingBy(s -> s.charAt(0), mapping(Function.identity(), collectingAndThen(toList(), l -> { sort(l);
return l; }))).

Alternatively groupingBy with toCollection(TreeSet) then convert to List.
 */

import java.util.List;
import java.util.Map;
import java.util.TreeMap;
import java.util.stream.Collectors;

public class GroupingInStream {

    public void convert()
    {

        List<String> names = List.of("Edhaya", "Gowthami", "Talha", "Rahis", "Abinav","Arun","Rahim","Trisha","Gourav");
        Map<Character, List<String>> arranged = names.stream()
                .collect(Collectors.groupingBy(
                        x -> x.charAt(0),
                        TreeMap::new,
                        Collectors.collectingAndThen(
                                Collectors.toList(),
                                list -> list.stream().sorted().toList()
                        )
                ));

        arranged.forEach((ch, list) -> System.out.println(ch + " -> " + list));
    }
    public static void main(String []args)
    {
        GroupingInStream gs = new GroupingInStream ();
        gs.convert();
    }

}
