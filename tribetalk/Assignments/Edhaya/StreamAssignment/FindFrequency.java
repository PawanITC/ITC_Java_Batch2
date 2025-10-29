import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;
import java.util.stream.Stream;
import java.lang.*;

public class FindFrequency {

    public void convert()
    {
      String country = "Switzerland";

        Map<Character, Long> freq = country.chars()
                .mapToObj(c -> (char) c)
                .collect(Collectors.groupingBy(
                        Function.identity(),
                        Collectors.counting()
                ));
        System.out.println(freq);
    }

	public static void main(String []args)
        {
            FindFrequency ff =new FindFrequency();
            ff.convert();

        }
}

