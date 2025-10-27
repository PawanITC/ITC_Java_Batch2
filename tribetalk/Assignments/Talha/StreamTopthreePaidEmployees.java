import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

public class StreamTopthreePaidEmployees {

    public static void main(String[] args) {
        List<StreamAssignment.Employee> employeeList = new ArrayList<>();
        StreamAssignment.Employee e1 = new StreamAssignment.Employee("Talha", "Backend", 15);
        employeeList.add(e1);
        StreamAssignment.Employee e2 = new StreamAssignment.Employee("Gowthami", "Frontend", 30);
        employeeList.add(e2);
        StreamAssignment.Employee e3 = new StreamAssignment.Employee("Rahis", "Backend", 28);
        employeeList.add(e3);
        StreamAssignment.Employee e4 = new StreamAssignment.Employee("Edhaya", "DevOps", 29);
        employeeList.add(e4);
        List<String> topThreePaidEmployees=employeeList.stream().sorted(Comparator.comparing(StreamAssignment.Employee::salary).reversed()).limit(3).map(StreamAssignment.Employee::name).collect(Collectors.toList());
        for(String name:topThreePaidEmployees)
        {
            System.out.printf("Employee : %S %n",name);
        }
    }
}
