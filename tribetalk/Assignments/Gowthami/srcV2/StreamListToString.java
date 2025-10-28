import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

public class StreamListToString {
    public static void main(String[] args) {
        //        4. Join a list of strings into a CSV like "a,b,c" with a prefix/suffix "[", "]".
        //                Hints: Collectors.joining(",", "[", "]").

        List<String> str = Arrays.asList("a", "b", "c");
        // join all string add ,
        String output = str.stream().collect(Collectors.joining(",","[","]"));

        System.out.println("Added prefix/suffix : "+output);
    }
}
