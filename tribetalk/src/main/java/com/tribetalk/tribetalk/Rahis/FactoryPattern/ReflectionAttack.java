package com.tribetalk.tribetalk.Rahis.FactoryPattern;

import java.lang.reflect.Constructor;

public class ReflectionAttack {
    public static void main(String[] args) throws Exception{
        Class<?> emailClass=Class.forName("EmailNotification");
        Constructor<?> emailConstructor=emailClass.getDeclaredConstructor();
        Notification email=(Notification) emailConstructor.newInstance();

        //Using reflection to create instances the factory should control
    }
}
