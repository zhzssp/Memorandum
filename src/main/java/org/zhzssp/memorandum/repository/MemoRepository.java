package org.zhzssp.memorandum.repository;

import org.springframework.lang.NonNull;
import org.zhzssp.memorandum.entity.Memo;
import org.zhzssp.memorandum.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

// jpa自带save(S)
public interface MemoRepository extends JpaRepository<Memo, Long> {
    List<Memo> findByUser(User user);
}

