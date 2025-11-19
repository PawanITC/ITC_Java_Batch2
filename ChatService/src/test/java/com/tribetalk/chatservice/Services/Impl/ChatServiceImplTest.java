//package com.tribetalk.chatservice.Services.Impl;
//
//import com.tribetalk.chatservice.Entity.ChatMessage;
//import com.tribetalk.chatservice.Repository.ChatMessageRepository;
//import com.tribetalk.chatservice.Services.impl.ChatServiceImpl;
//import org.junit.jupiter.api.Test;
//import org.junit.jupiter.api.extension.ExtendWith;
//import org.mockito.InjectMocks;
//import org.mockito.Mock;
//import org.mockito.junit.jupiter.MockitoExtension;
//
//import java.util.List;
//
//import static org.junit.jupiter.api.Assertions.assertEquals;
//import static org.mockito.BDDMockito.given;
//
//@ExtendWith(MockitoExtension.class)
//public class ChatServiceImplTest {
//
//    @Mock
//    private ChatMessageRepository chatMessageRepository;
//
//    @InjectMocks
//    private ChatServiceImpl chatServiceImpl;
//
//    @Test
//    void getChatMessages() {
//        ChatMessage m1 = new ChatMessage();
//        m1.setChatRoomId("2_4");
//        m1.setTimestamp(1000L);
//        m1.setSenderId("2");
//        m1.setReceiverId("4");
//        m1.setContent("Hello");
//
//        ChatMessage m2 = new ChatMessage();
//        m2.setChatRoomId("2_4");
//        m2.setTimestamp(2000L);
//        m2.setSenderId("4");
//        m2.setReceiverId("2");
//        m2.setContent("Hi");
//
//        List<ChatMessage> mockMessages = List.of(m1, m2);
//
//        given(chatMessageRepository.findByChatRoomIdOrderByTimestampAsc("2_4"))
//                .willReturn(mockMessages);
//
//        List<ChatMessage> result = chatServiceImpl.getChatMessages("2_4");
//
//        assertEquals(2, result.size());
//        assertEquals(1000L, result.get(0).getTimestamp());
//        assertEquals("Hello", result.get(0).getContent());
//        assertEquals(2000L, result.get(1).getTimestamp());
//        assertEquals("Hi", result.get(1).getContent());
//    }
//}