package com.learning.tribetalk.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;

import java.util.HashMap;
import java.util.Map;

@ControllerAdvice
public class GlobalExceptionHandler {

    /*@ExceptionHandler(DuplicateResourceException.class)
    public ResponseEntity<Map<String,Object>> handleDuplicateResource(DuplicateResourceException ex){
        return buildResponse(HttpStatus.CONFLICT,ex.getMessage());
    }

    private ResponseEntity<Map<String,Object>> buildResponse(HttpStatus status,String message){
        Map<String,Object> body=new HashMap<>();
    }*/
}
