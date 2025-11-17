package com.learning.tribetalk;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cache.annotation.EnableCaching;

@SpringBootApplication
public class TribetalkApplication {

	public static void main(String[] args) {
		SpringApplication.run(TribetalkApplication.class, args);
		
	}

}
