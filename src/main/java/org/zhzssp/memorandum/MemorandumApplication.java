package org.zhzssp.memorandum;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

// 程序主入口，可从浏览器访问http://localhost:8080
@SpringBootApplication
public class MemorandumApplication {
    public static void main(String[] args) {
        SpringApplication.run(MemorandumApplication.class, args);
    }
}

