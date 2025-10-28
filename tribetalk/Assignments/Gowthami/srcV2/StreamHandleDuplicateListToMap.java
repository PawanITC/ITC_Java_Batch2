import java.time.LocalDate;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

//java 21, rendor  simplify class creation which include constructor, getters, setters , toString(), equals() and hashCode().
record Employee(int id, String name, LocalDate joinDate) {

}

public class StreamHandleDuplicateListToMap {
    public static void main(String[] args) {
        //       Convert a List<Employee> to Map<id, Employee> handling duplicate ids by keeping the latest joined employee.
        //        Hints: toMap(Employee::getId, e -> e, (e1, e2) -> e1.getJoinDate().isAfter(e2.getJoinDate()) ? e1 : e2).

        //creating the list
        List<Employee> emp = Arrays.asList(
                new Employee(1, "Gowthami", LocalDate.of(2020, 5, 10)),
                new Employee(1, "Solai", LocalDate.of(2022, 3, 15)),
                new Employee(2, "Vashiska", LocalDate.of(2021, 1, 20))
        );

        // adding the id as key, if the key already exist and the compare the existing and the new join date. The recent joined employee data will add in it.
        Map<Integer, Employee> employeeMap = emp.stream().collect(Collectors.toMap(Employee::id, e -> e, (e1, e2) -> e1.joinDate().isAfter(e2.joinDate()) ? e1 : e2));

        //displaying the values only using method references.
        System.out.println(employeeMap.values().stream().map(Employee::toString).toList());
    }
}
