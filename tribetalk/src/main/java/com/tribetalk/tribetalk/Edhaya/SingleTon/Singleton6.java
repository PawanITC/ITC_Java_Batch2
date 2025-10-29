// Singleton concept via cloning
public class Singleton6 implements Cloneable {

    private static Singleton6 instance = new Singleton6();

    private Singleton6() {}

    public static Singleton6 getInstance() {
        return instance;
    }

    @Override
    protected Object clone() throws CloneNotSupportedException {
        return super.clone(); // Cloning will create a new instance
    }

    public static void main(String[] args) {
        try {
            Singleton6 singleTon = Singleton6.getInstance();
            System.out.println(singleTon.hashCode());
            Singleton6 clonedObject = (Singleton6) singleTon.clone();
            System.out.println(clonedObject.hashCode());
        } catch (CloneNotSupportedException e) {
            throw new RuntimeException(e);
        }

    }

}