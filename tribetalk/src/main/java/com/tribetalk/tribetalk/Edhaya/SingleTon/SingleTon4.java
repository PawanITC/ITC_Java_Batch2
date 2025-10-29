import java.lang.reflect.Constructor;

public class SingleTon4 {

    private static volatile SingleTon4 instance ;
    public static  SingleTon4 getInstance() {
        if (instance == null) {
            synchronized (SingleTon.class) {
                if (instance == null) {
                    instance = new SingleTon4();

                }
            }
        }
        return instance;
    }

    public static void main(String[] args) throws Exception {
        SingleTon4 instance1 = SingleTon4.getInstance();

        // Breaking Singleton using Reflection
        Constructor<SingleTon4> constructor = SingleTon4.class.getDeclaredConstructor();
        constructor.setAccessible(true);
        SingleTon4 instance2 = constructor.newInstance();

        System.out.println("Instance 1: " + instance1.hashCode());
        System.out.println("Instance 2: " + instance2.hashCode());
    }


}



