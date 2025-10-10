package org.zhzssp.memorandum.repository;

import org.zhzssp.memorandum.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

// 继承JPA后，可根据规则自动生成SQL语句
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByUsername(String username);
}

