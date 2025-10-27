import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

public class StreamAverageSalaryPerDepartment {

    public static void main(String[] args){
//                Build a Map<Department, Double> of average salary per department.
//
//        Hints: groupingBy(Employee::getDepartment, averagingDouble(Employee::getSalary)).
//
        List<StreamAssignment.Employee> employeeList=new ArrayList<>();
        StreamAssignment.Employee e1=new StreamAssignment.Employee("Talha","Backend",15);
        employeeList.add(e1);
        StreamAssignment.Employee e2=new StreamAssignment.Employee("Gowthami","Frontend",30);
        employeeList.add(e2);
        StreamAssignment.Employee e3=new StreamAssignment.Employee("Rahis","Backend",28);
        employeeList.add(e3);
        StreamAssignment.Employee e4=new StreamAssignment.Employee("Edhaya","DevOps",29);
        employeeList.add(e4);
        Map<String,Double> departmentwithAVGSalary =employeeList.stream().collect(Collectors.groupingBy(StreamAssignment.Employee::department,Collectors.averagingDouble(StreamAssignment.Employee::salary)));
        departmentwithAVGSalary.forEach((deparment,averageSalary)->{System.out.printf("Department : %S | Average Salary : %f%n",deparment,averageSalary);});
//                Find the top 3 highest-paid employees’ names.
    }
}
