
/* Turn a Map<K, List<V>> into a flat List<V> preserving insertion order from values.

Hints: map.entrySet().stream(), flatMap(e -> e.getValue().stream()).

 */
import java.util.*;
import java.util.stream.Collectors;

public class MapIntoList {

    public void convert()
    {
        Map<String, List<String>> books = new LinkedHashMap<>();
        books.put("fiction", List.of("HarryPotter", "Persy Jackson"));
        books.put("Science", List.of("Immunology", "Quantum Mechanics"));
        books.put("Novels", List.of("Ponniyin Selvan"));

        List<String> books_in_library = books.entrySet()
                .stream()
                .flatMap(x -> x.getValue().stream())
                .collect(Collectors.toList());

        System.out.println(books_in_library);

    }

    public static void main(String []args)
    {
        MapIntoList ml =new MapIntoList();
        ml.convert();

    }
}

