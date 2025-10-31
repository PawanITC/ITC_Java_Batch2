package com.tribetalk.tribetalk.Rahis.FactoryPattern;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.ObjectInputStream;
import java.io.ObjectOutputStream;

public class SerialAttack {
    public static void main(String[] args) throws Exception{
        //Creates one instance using factory
        NotificationFactory factory=new NotificationFactory();
        Notification original=new SerialNotification();

        ByteArrayOutputStream baos=new ByteArrayOutputStream();
        ObjectOutputStream oos=new ObjectOutputStream(baos);
        oos.writeObject(oos);
        oos.close();

        //Searialize and deserialize to create copies without factory
        ByteArrayInputStream bais=new ByteArrayInputStream(baos.toByteArray());
        ObjectInputStream ois=new ObjectInputStream(bais);
        Notification copy=(Notification) ois.readObject();
        copy.notifyUsers();
    }
}
