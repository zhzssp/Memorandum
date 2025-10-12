package org.zhzssp.memorandum.controller;

import org.zhzssp.memorandum.entity.*;
import org.zhzssp.memorandum.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import java.security.Principal;
import java.time.LocalDate;
import java.util.List;
import org.jetbrains.annotations.NotNull;

@Controller
public class MemoController {

    @Autowired
    private MemoRepository memoRepository;

    @Autowired
    private UserRepository userRepository;

    @GetMapping("/dashboard")
    public String dashboard(@NotNull Model model, Principal principal) {
        User user = userRepository.findByUsername(principal.getName()).orElseThrow();
        List<Memo> memos = memoRepository.findByUser(user);
        // 将输入的条目添加之后重新渲染
        model.addAttribute("memos", memos);
        return "dashboard";
    }

    @GetMapping("/memo/add")
    public String addMemoForm() {
        return "addMemo";
    }

    @PostMapping("/memo/add")
    public String addMemo(@RequestParam String title, @RequestParam String description, @RequestParam String deadline, Principal principal) {
        // principal对象包含当前登录用户的信息
        User user = userRepository.findByUsername(principal.getName()).orElseThrow();
        Memo memo = new Memo();
        memo.setTitle(title);
        memo.setDescription(description);
        memo.setDeadline(LocalDate.parse(deadline));
        memo.setUser(user);
        memoRepository.save(memo);
        return "redirect:/dashboard";
    }

    @GetMapping("/due-dates")
    @ResponseBody
    public List<Memo> viewDueDates(@NotNull Model model, Principal principal) {
        try {
            System.out.println("=== Due Dates Debug Info ===");
            System.out.println("Principal: " + principal);
            System.out.println("Principal name: " + (principal != null ? principal.getName() : "null"));
            
            if (principal == null) {
                System.out.println("Principal is null - user not authenticated");
                return List.of(); // 返回空列表而不是抛出异常
            }
            
            User user = userRepository.findByUsername(principal.getName()).orElseThrow();
            List<Memo> memos = memoRepository.findByUser(user);
            
            System.out.println("Found " + memos.size() + " memos for user: " + user.getUsername());
            memos.forEach(memo -> {
                System.out.println("Memo: " + memo.getTitle() + ", Deadline: " + memo.getDeadline());
            });
            System.out.println("=============================");
            
            return memos;
        } catch (Exception e) {
            System.out.println("Error in viewDueDates: " + e.getMessage());
            e.printStackTrace();
            return List.of(); // 返回空列表而不是抛出异常
        }
    }
}

