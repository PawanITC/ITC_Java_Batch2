// Singleton concept via cloning
public class Singleton7 implements Cloneable {

    private static Singleton7 instance = new Singleton7();

    private Singleton7() {}

    public static Singleton7 getInstance() {
        return instance;
    }

    @Override

    protected Object clone() throws CloneNotSupportedException {

        throw new CloneNotSupportedException("Cannot clone Singleton");

    }

    public static void main(String[] args) {
        try {
            Singleton7 singleTon = Singleton7.getInstance();
            System.out.println(singleTon.hashCode());
            Singleton7 clonedObject = (Singleton7) singleTon.clone();
            System.out.println(clonedObject.hashCode());
        } catch (CloneNotSupportedException e) {
            throw new RuntimeException(e);
        }

    }

}