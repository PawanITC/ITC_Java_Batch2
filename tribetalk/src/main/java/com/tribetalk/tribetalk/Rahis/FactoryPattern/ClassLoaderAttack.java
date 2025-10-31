package com.tribetalk.tribetalk.Rahis.FactoryPattern;

public class ClassLoaderAttack {
    public static void main(String[] args) throws Exception{
        //Create instances using different classloaders
        ClassLoader classLoader=ClassLoaderAttack.class.getClassLoader();

        Class<Notification> emailClass=(Class<Notification>) classLoader.loadClass("EmailNotification");
        Notification email=emailClass.getDeclaredConstructor().newInstance();
        email.notifyUsers();

    }
}
