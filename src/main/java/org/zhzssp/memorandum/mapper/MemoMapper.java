package org.zhzssp.memorandum.mapper;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.zhzssp.memorandum.entity.Memo;

import java.time.LocalDateTime;
import java.util.List;

@Mapper
public interface MemoMapper {
    List<Memo> searchMemos(@Param("userId") Long userId,
                           @Param("keyword") String keyword,
                           @Param("startDate") LocalDateTime startDate,
                           @Param("endDate") LocalDateTime endDate);
}
