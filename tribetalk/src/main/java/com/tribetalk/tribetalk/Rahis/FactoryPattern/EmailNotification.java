package com.tribetalk.tribetalk.Rahis.FactoryPattern;

public class EmailNotification implements Notification {

    @Override
    public void notifyUsers() {
        System.out.println("Sending Email Notification");
    }
}

//To Avoid Direct instantation we can use Private-package class only visible within package

/*
    class EmailNotification implements Notification{

        //Package-Private Constructor - only accessible within the package
        EmailNotification(){
            System.out.println("Email Notification created via factory");
        }
    }
*/

//To avoid reflection we can use of static boolean variable
/*
private boolean static allowCreation=false;
//implement a method to create object

private EmailNotification(){
    if(!allowCreation){
        return new SecurityException("Reflection attack detected");
    }
}

public static EmailNotification create(){
    try{
        allowCreation=true;
        return new EmailNotification();
    }
    finally {
        allowCreation=false;
    }
}*/

//To Prevent cloning we can override clone method

/*
Class EmailNotification implements Notification,Cloneable{
    @Override
    protected final Object clone() throws CloneNotSupportedException{
        throw new CloneNotSupportedException("Clone Not Supported");
    }
}*/

