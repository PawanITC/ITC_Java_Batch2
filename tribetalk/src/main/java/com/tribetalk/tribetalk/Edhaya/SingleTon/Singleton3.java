
//breaking singleton using reflection by throwing an exception inside the constructor if the instance was created.

import java.lang.reflect.Constructor;

public class Singleton3 {

    private static volatile Singleton3 instance ;
    private static boolean instanceCreated = false;
    private  Singleton3() {
        instanceCreated=true;
        if (instanceCreated) {
            throw new RuntimeException("Singleton instance already exists!");

        }
    }
    public static  Singleton3 getInstance() {

        if (instance == null) {
            synchronized (Singleton3.class) {
                if (instance == null) {
                    instance = new Singleton3();

                }
            }
        }
        return instance;
    }
    public static void main(String[] args) throws Exception {
        Singleton3 instance1 = Singleton3.getInstance();

        // Breaking Singleton using Reflection
        Constructor<Singleton3> constructor = Singleton3.class.getDeclaredConstructor();
        constructor.setAccessible(true);
        Singleton3 instance2 = constructor.newInstance();

        System.out.println("Instance 1: " + instance1.hashCode());
        System.out.println("Instance 2: " + instance2.hashCode());
    }


}



