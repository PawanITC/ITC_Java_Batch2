package com.learning.tribetalk.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
public class FrontEndController {

    @RequestMapping(value = { "/oauth2/redirect" })
    public String redirect(){
        return "forward:/index.html";
    }
}
