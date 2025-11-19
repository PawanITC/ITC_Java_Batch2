package com.tribetalk.chatservice.DTO;

import lombok.Data;

@Data
public class MarkReadRequest {
    private String senderId;
    private String receiverId;

}

