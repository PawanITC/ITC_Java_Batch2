package com.tribetalk.chatservice.configuration;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class SwaggerConfig {

    @Bean
    public OpenAPI customOpenAPI() {
        return new OpenAPI().info(new Info().title("TribeTalk Service")
                .description("Chat Service for TribeTalk")
                .version("1.0")
                .contact(new Contact().name("Talha Nasib").email("talh.nasib@informationstechConsultants.co.uk")));
    }

}
