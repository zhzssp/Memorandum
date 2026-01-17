package org.zhzssp.memorandum.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Column;
import jakarta.persistence.Table;
import lombok.Data;

// Spring 启动时，会扫描所有带 @Entity 的类，--> 被Spring注册并管理
// 并根据属性自动在数据库中生成对应的表结构 --> JDBC
@Entity
@Table(name="user")
@Data
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column (unique = true)
    private String username;
    private String password;
}

