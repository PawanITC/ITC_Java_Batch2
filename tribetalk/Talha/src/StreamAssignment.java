import java.math.BigDecimal;
import java.util.*;
import java.util.stream.Collectors;
import java.util.stream.IntStream;

//TIP To <b>Run</b> code, press <shortcut actionId="Run"/> or
// click the <icon src="AllIcons.Actions.Execute"/> icon in the gutter.
public class StreamAssignment {
    public static void main(String[] args) {

//        Given List<List<Integer>> nested, flatten and get unique numbers sorted.
//
//                Hints: flatMap(List::stream), distinct, sorted.
//

        List<List<Integer>> numbers= new ArrayList<List<Integer>>();
        numbers.add(new ArrayList<>(Arrays.asList(8,7,6,5,4,3,2,1)));
        numbers.add(new ArrayList<>(List.of(1,2,3,4,5,6,7,8)));
        numbers.add(IntStream.range(0,50).boxed().collect(Collectors.toList()));

        numbers.stream().flatMap(Collection::stream).distinct().sorted().forEach(System.out::println);



//                Build a Map<Department, Long> of employee counts per department.
//        Hints: Collectors.groupingBy(Employee::getDepartment, counting()).
        List<Employee> employeeList=new ArrayList<>();
        Employee e1=new Employee("Talha","Backend",15);
        employeeList.add(e1);
        Employee e2=new Employee("Gowthami","Frontend",30);
        employeeList.add(e2);
        Employee e3=new Employee("Rahis","Backend",28);
        employeeList.add(e3);
        Employee e4=new Employee("Edhaya","DevOps",29);
        employeeList.add(e4);
        Map<String,Long> departmentWiseCount =employeeList.stream().collect(Collectors.groupingBy(Employee::department,Collectors.counting()));
        departmentWiseCount.forEach((department,count)->{System.out.printf("Department : %S | Count : %d%n",department,count);});

//
//                Build a Map<Department, Double> of average salary per department.
//
//        Hints: groupingBy(Employee::getDepartment, averagingDouble(Employee::getSalary)).
//
        Map<String,Double> departmentwithAVGSalary =employeeList.stream().collect(Collectors.groupingBy(Employee::department,Collectors.averagingDouble(Employee::salary)));
        departmentwithAVGSalary.forEach((deparment,averageSalary)->{System.out.printf("Department : %S | Average Salary : %f%n",deparment,averageSalary);});
//                Find the top 3 highest-paid employees’ names.
//
//                Hints: sorted(comparing(Employee::getSalary).reversed()), limit(3), map(getName), toList.
        List<String> topThreePaidEmployees=employeeList.stream().sorted(Comparator.comparing(Employee::salary).reversed()).limit(3).map(Employee::name).collect(Collectors.toList());
          for(String name:topThreePaidEmployees)
            {
                System.out.printf("Employee : %S %n",name);
            }
//                From transactions, make Map<CustomerId, BigDecimal> totalAmount per customer.
//
        List<Transaction> transactions = Arrays.asList(
                new Transaction("Alice", new BigDecimal("120.50")),
                new Transaction("Bob", new BigDecimal("250.00")),
                new Transaction("Alice", new BigDecimal("300.75")),   // repeated
                new Transaction("David", new BigDecimal("180.25")),
                new Transaction("Eve", new BigDecimal("500.00")),
                new Transaction("Bob", new BigDecimal("75.00")),      // repeated
                new Transaction("Grace", new BigDecimal("220.50")),
                new Transaction("Hannah", new BigDecimal("150.00")),
                new Transaction("Ivan", new BigDecimal("400.00")),
                new Transaction("Alice", new BigDecimal("95.25"))     // repeated
        );

        Map<String, BigDecimal> transactionTotal= transactions.stream().collect(Collectors.groupingBy(Transaction::name,Collectors.mapping(
                Transaction::transactionAmount,
                Collectors.reducing(BigDecimal.ZERO, BigDecimal::add)
        )));
        transactionTotal.forEach((transactionName,transactionAmount)->{System.out.printf("Customer : %S Amoutn : %s %n",transactionName,transactionAmount);});

    }

    public record Employee (String name,String department,double salary){};

    public record Transaction(String name,BigDecimal transactionAmount){};
    }
