package org.zhzssp.memorandum.controller;

import org.jetbrains.annotations.NotNull;
import org.zhzssp.memorandum.entity.Memo;
import org.zhzssp.memorandum.entity.User;
import org.zhzssp.memorandum.repository.MemoRepository;
import org.zhzssp.memorandum.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeFormatterBuilder;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Handles all memo-related operations and renders dashboard respecting user-selected features.
 */
@Controller
public class MemoController {

    @Autowired
    private MemoRepository memoRepository;

    @Autowired
    private UserRepository userRepository;

    @GetMapping("/dashboard")
    public String dashboard(@NotNull Model model,
                            Principal principal,
                            jakarta.servlet.http.HttpSession session) {
        User user = userRepository.findByUsername(principal.getName()).orElseThrow();
        List<Memo> memos = memoRepository.findByUser(user);
        model.addAttribute("memos", memos);

        java.util.Set<String> selected = FeatureSelectionController.getSelectedFeatures(session);
        model.addAttribute("selectedFeatures", selected);

        // Prepare upcoming due dates list (within 3 days)
        java.util.List<Memo> dueSoon = memos.stream()
                .filter(m -> java.time.temporal.ChronoUnit.DAYS.between(java.time.LocalDateTime.now(), m.getDeadline()) <= 3)
                .collect(java.util.stream.Collectors.toList());
        model.addAttribute("dueSoonMemos", dueSoon);

        return "dashboard";
    }

    @GetMapping("/memo/add")
    public String addMemoForm() {
        return "addMemo";
    }

    @PostMapping("/memo/add")
    public String addMemo(@RequestParam String title,
                          @RequestParam String description,
                          @RequestParam String deadline,
                          Principal principal) {
        User user = userRepository.findByUsername(principal.getName()).orElseThrow();
        Memo memo = new Memo();
        memo.setTitle(title);
        memo.setDescription(description);
        DateTimeFormatter formatter = new DateTimeFormatterBuilder()
                .appendPattern("yyyy-MM-dd'T'HH:mm")
                .optionalStart()
                .appendPattern(":ss")
                .optionalEnd()
                .toFormatter();
        memo.setDeadline(LocalDateTime.parse(deadline, formatter));
        memo.setUser(user);
        memoRepository.save(memo);
        return "redirect:/dashboard";
    }

    @GetMapping("/due-dates")
    @ResponseBody
    public List<Memo> viewDueDates(Principal principal) {
        if (principal == null) {
            return List.of();
        }
        User user = userRepository.findByUsername(principal.getName()).orElseThrow();
        return memoRepository.findByUser(user);
    }

    @DeleteMapping("/memo/delete/{id}")
    @ResponseBody
    public String deleteMemo(@PathVariable Long id, Principal principal) {
        try {
            User user = userRepository.findByUsername(principal.getName()).orElseThrow();
            Memo memo = memoRepository.findById(id).orElseThrow();
            if (!memo.getUser().getId().equals(user.getId())) {
                return "error:unauthorized";
            }
            memoRepository.delete(memo);
            return "success";
        } catch (Exception e) {
            return "error:failed";
        }
    }
}
