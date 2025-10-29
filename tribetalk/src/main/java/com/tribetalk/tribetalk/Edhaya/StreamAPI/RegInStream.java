/*

Given a stream of log lines, extract distinct error codes of the form ERR-XXXX and return a sorted list.

Hints: map with regex matcher to Optional<String>, flatMap(Optional::stream), distinct, sorted, toList.

 */

import java.util.List;
import java.util.Optional;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Stream;

public class RegInStream {
    public void convert() {
        Stream<String> logLines = Stream.of(
                "INFO - Process started",
                "CRIT - Failed to get a socket, exiting child",
                "WARN - Something odd",
                "ERROR - ERR-2001 Something failed",
                "ERROR - ERR-2002 Another failure",
                "ERROR - ERR-1003 Disk failed"
        );

        Pattern pattern = Pattern.compile("ERR-\\d{4}");

        List<String> errorCodes = logLines
                .map(line -> {
                    Matcher matcher = pattern.matcher(line);
                    return matcher.find() ? Optional.of(matcher.group()) : Optional.<String>empty();
                }).flatMap(Optional::stream).distinct().sorted().toList();

        System.out.println(errorCodes);
    }
        public static void main (String[]args)
        {
            RegInStream rg = new RegInStream();
            rg.convert();

        }


}
