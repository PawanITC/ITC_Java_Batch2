import java.util.*;
import java.util.stream.*;

public class ParallelismInStream {

    // Example of CPU-heavy function
    private static double expensiveOp(double x) {
        double result = x;
        for (int i = 0; i < 1_000; i++) {
            result = Math.sin(result) * Math.cos(result) + Math.tan(result % Math.PI);
        }
        return result;
    }

    public static void main(String[] args) {
        int size = 10_000_000;
        List<Double> input = new Random().doubles(size, 0, 1000).boxed().toList();

        // Warm-up
        System.out.println("Warming up...");
        input.stream().map(ParallelismInStream::expensiveOp).limit(1000).count();
        input.parallelStream().map(ParallelismInStream::expensiveOp).limit(1000).count();

        // Sequential execution
        long t1 = System.nanoTime();
        List<Double> sequential = input.stream()
                .map(ParallelismInStream::expensiveOp)
                .collect(Collectors.toList());
        long t2 = System.nanoTime();
        double seqSeconds = (t2 - t1) / 1e9;
        System.out.println("Sequential time: " + seqSeconds + " s");

        // Parallel execution
        long t3 = System.nanoTime();
        List<Double> parallel = input.parallelStream()
                .map(ParallelismInStream::expensiveOp)
                .collect(Collectors.toList());
        long t4 = System.nanoTime();
        double parSeconds = (t4 - t3) / 1e9;
        System.out.println("Parallel time: " + parSeconds + " s");

        System.out.println("Speedup: " + (seqSeconds / parSeconds));
    }
}
