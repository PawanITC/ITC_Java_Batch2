package com.learning.tribetalk.exception;

import org.springframework.context.support.DefaultMessageSourceResolvable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.multipart.MaxUploadSizeExceededException;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@ControllerAdvice
public class GlobalExceptionHandler {

    //Handle duplicate resources
    @ExceptionHandler(DuplicateResourceException.class)
    public ResponseEntity<Map<String,Object>> handleDuplicateResource(DuplicateResourceException ex){
        return buildResponse(HttpStatus.CONFLICT,ex.getMessage());
    }

    //Handle Resource not found
    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<Map<String,Object>> handleResourceNotFound(ResourceNotFoundException ex){
        return buildResponse(HttpStatus.NOT_FOUND,ex.getMessage());
    }

    //Handle Invalid data
    @ExceptionHandler(InvalidDataException.class)
    public ResponseEntity<Map<String,Object>> handleInvalidData(InvalidDataException ex){
        return buildResponse(HttpStatus.BAD_REQUEST, ex.getMessage());
    }

    //Handle Valdation from DTO (@Valid)
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String,Object>> handleValidationExcepton(MethodArgumentNotValidException ex){
        String errorMessage=ex.getBindingResult().getFieldErrors()
                .stream().findFirst().map(DefaultMessageSourceResolvable::getDefaultMessage).orElse("Invalid Input Data");
        return buildResponse(HttpStatus.BAD_REQUEST,errorMessage);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String,Object>> handleGeneralExceptions(Exception ex){
        return buildResponse(HttpStatus.INTERNAL_SERVER_ERROR,"Some went wrong,"+ex.getMessage());
    }
    //Utility method for consistent response format
    private ResponseEntity<Map<String,Object>> buildResponse(HttpStatus status,String message){
        Map<String,Object> body=new HashMap<>();
        body.put("timestamp", LocalDateTime.now());
        body.put("status",status.value());
        body.put("statusText",status.getReasonPhrase());
        body.put("message",message);
        return new ResponseEntity<>(body,status);
    }

    @ExceptionHandler(MaxUploadSizeExceededException.class)
    public ResponseEntity<Map<String, Object>> handleMaxSizeException(MaxUploadSizeExceededException ex) {
        Map<String, Object> body = new HashMap<>();
        body.put("timestamp", LocalDateTime.now());
        body.put("status", HttpStatus.PAYLOAD_TOO_LARGE.value());
        body.put("error", "File too large");
        body.put("message", "Maximum upload size exceeded. Please upload a smaller file.");
        return new ResponseEntity<>(body, HttpStatus.PAYLOAD_TOO_LARGE);
    }
}
