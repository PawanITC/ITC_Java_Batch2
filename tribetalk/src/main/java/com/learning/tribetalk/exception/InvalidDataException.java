package com.learning.tribetalk.exception;


public class InvalidDataException extends RuntimeException{
    public InvalidDataException(String message){
        super(message);
    }
}
