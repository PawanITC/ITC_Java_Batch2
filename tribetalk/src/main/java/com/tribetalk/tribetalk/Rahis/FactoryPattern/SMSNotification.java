package com.tribetalk.tribetalk.Rahis.FactoryPattern;

public class SMSNotification implements Notification {

    @Override
    public void notifyUsers() {
        System.out.println("Send SMS Notification");
    }
}
