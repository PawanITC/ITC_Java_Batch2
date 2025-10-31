package com.tribetalk.tribetalk.Rahis.FactoryPattern;

class BreakableEmail extends EmailNotification implements Cloneable{
    @Override
    protected Object clone() throws CloneNotSupportedException {
        return new BreakableEmail();
    }
}
