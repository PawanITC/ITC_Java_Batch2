package com.tribetalk.tribetalk.Edhaya.SingleTon;

public class SingleTon1 {
    private static volatile SingleTon1 instance;
    private SingleTon1() {}
// thread safe, but slows down the execution
    public static  synchronized SingleTon1 getInstance() {

                if (instance == null) {
                    instance = new SingleTon1();

                }
              return instance;
    }
    public static void main(String[] args) {
        SingleTon1 singleTon = SingleTon1.getInstance();
        System.out.println(singleTon.hashCode());
    }
}
