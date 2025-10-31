package com.tribetalk.tribetalk.Rahis.FactoryPattern;

public class DirectInstantiation {
    public static void main(String[] args){
        Notification email=new EmailNotification();
        email.notifyUsers();
        //Using direct instantiation factory is completely ignored
    }
}
