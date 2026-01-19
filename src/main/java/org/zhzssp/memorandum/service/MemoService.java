package org.zhzssp.memorandum.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.zhzssp.memorandum.entity.Memo;
import org.zhzssp.memorandum.mapper.MemoMapper;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class MemoService {

    @Autowired
    private MemoMapper memoMapper;

    public List<Memo> searchMemos(Long userId, String keyword, LocalDateTime start, LocalDateTime end){
        return memoMapper.searchMemos(userId, keyword, start, end);
    }
}
