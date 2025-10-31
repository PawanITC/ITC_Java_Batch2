package com.tribetalk.tribetalk.Rahis.FactoryPattern;

public class NotificationFactory {

    public Notification createNotification(String type){
        if(type.equalsIgnoreCase("email")){
            return new EmailNotification();
        }
        else if (type.equalsIgnoreCase("sms")){
            return new SMSNotification();
        }
        else {
            return null;
        }
    }


}
