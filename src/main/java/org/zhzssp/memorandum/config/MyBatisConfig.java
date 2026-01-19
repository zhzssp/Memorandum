package org.zhzssp.memorandum.config;

import org.mybatis.spring.annotation.MapperScan;
import org.springframework.context.annotation.Configuration;

@Configuration
@MapperScan("org.zhzssp.memorandum.mapper")
public class MyBatisConfig {
}
