package org.zhzssp.memorandum.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

import jakarta.persistence.Table;
import lombok.Data;

@Entity
@Table(name="memo")
@Data
public class Memo {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String title;
    private String description;
    private LocalDateTime deadline;

    @ManyToOne
    private User user;
}

