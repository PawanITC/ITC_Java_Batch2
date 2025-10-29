import java.io.*;
import java.io.ObjectInputStream;
import java.io.ObjectOutputStream;

public class Singleton5{

ObjectOutputStream out;


        try {
            out = new ObjectOutputStream(new FileOutputStream("singleton.ser"));
        }
        catch (IOException e) {
            throw new RuntimeException(e);
        }

    out.writeObject(instance1);
    out.close();

// Deserialize Singleton
ObjectInputStream in = new ObjectInputStream(new FileInputStream("singleton.ser"));
Singleton instance2 = (Singleton) in.readObject();
    in.close();

    System.out.println("Instance 1: " + instance1.hashCode());
        System.out.println("Instance 2: " + instance2.hashCode());
        }