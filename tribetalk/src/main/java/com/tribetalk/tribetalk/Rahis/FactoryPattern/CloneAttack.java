package com.tribetalk.tribetalk.Rahis.FactoryPattern;

public class CloneAttack {
    public static void main(String[] args) throws Exception{
        //Gets Original instance once
        NotificationFactory factory=new NotificationFactory();
        Notification original= factory.createNotification("email");

        //Now clone it enlessly without factory
        if(original instanceof BreakableEmail breakableEmail){
            Notification clone1=(Notification) breakableEmail.clone();
            Notification clone2=(Notification) breakableEmail.clone();
            
            clone1.notifyUsers();
            clone2.notifyUsers();
        }
    }
}
