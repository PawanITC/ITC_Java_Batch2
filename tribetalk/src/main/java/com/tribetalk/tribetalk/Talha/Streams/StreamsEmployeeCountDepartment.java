package com.tribetalk.tribetalk.Talha;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

public class StreamsEmployeeCountDepartment {

    public static void main(String[] args) {
        //                Build a Map<Department, Long> of employee counts per department.
//        Hints: Collectors.groupingBy(Employee::getDepartment, counting()).
        List<StreamAssignment.Employee> employeeList = new ArrayList<>();
        StreamAssignment.Employee e1 = new StreamAssignment.Employee("Talha", "Backend", 15);
        employeeList.add(e1);
        StreamAssignment.Employee e2 = new StreamAssignment.Employee("Gowthami", "Frontend", 30);
        employeeList.add(e2);
        StreamAssignment.Employee e3 = new StreamAssignment.Employee("Rahis", "Backend", 28);
        employeeList.add(e3);
        StreamAssignment.Employee e4 = new StreamAssignment.Employee("Edhaya", "DevOps", 29);
        employeeList.add(e4);
        Map<String, Long> departmentWiseCount = employeeList.stream().collect(Collectors.groupingBy(StreamAssignment.Employee::department, Collectors.counting()));
        departmentWiseCount.forEach((department, count) -> {
            System.out.printf("Department : %S | Count : %d%n", department, count);
        });
    }
    public record Employee (String name,String department,double salary){};

}


