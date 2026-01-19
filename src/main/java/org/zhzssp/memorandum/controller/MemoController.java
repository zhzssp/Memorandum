package org.zhzssp.memorandum.controller;

import org.jetbrains.annotations.NotNull;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;
import org.zhzssp.memorandum.entity.Memo;
import org.zhzssp.memorandum.entity.User;
import org.zhzssp.memorandum.repository.MemoRepository;
import org.zhzssp.memorandum.repository.UserRepository;
import org.zhzssp.memorandum.service.MemoService;

import java.security.Principal;
import java.time.LocalDate;
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

    @Autowired
    private MemoService memoService;

    @GetMapping("/dashboard")
    public String dashboard(@NotNull Model model,
                            Principal principal,
                            jakarta.servlet.http.HttpSession session) {
        User user = userRepository.findByUsername(principal.getName()).orElseThrow();
        List<Memo> memos = memoRepository.findByUser(user);
        model.addAttribute("memos", memos);

        String mode = FeatureSelectionController.getSelectedFeature(session);
        model.addAttribute("mode", mode);

        // Prepare upcoming due dates list (within 3 days)
        java.util.List<Memo> dueSoon = memos.stream()
                .filter(m -> java.time.temporal.ChronoUnit.DAYS.between(java.time.LocalDateTime.now(), m.getDeadline()) <= 3)
                .collect(java.util.stream.Collectors.toList());
        model.addAttribute("dueSoonMemos", dueSoon);

        return "dashboard";
    }

    /**
     * Search endpoint for filtering memos.
     * If no filter condition is provided, simply redirect back to dashboard without doing anything.
     */
    @GetMapping("/memo/search")
    public String searchMemos(@RequestParam(required = false) String keyword,
                              @RequestParam(required = false, name = "start") String startDate,
                              @RequestParam(required = false, name = "end") String endDate,
                              Principal principal,
                              Model model,
                              jakarta.servlet.http.HttpSession session) {
        // No condition: redirect
        if (!StringUtils.hasText(keyword) && !StringUtils.hasText(startDate) && !StringUtils.hasText(endDate)) {
            return "redirect:/dashboard";
        }

        User user = userRepository.findByUsername(principal.getName()).orElseThrow();

        LocalDateTime start = null;
        LocalDateTime end = null;
        DateTimeFormatter dateFmt = DateTimeFormatter.ofPattern("yyyy-MM-dd");
        try {
            if (StringUtils.hasText(startDate)) {
                start = LocalDate.parse(startDate, dateFmt).atStartOfDay();
            }
            if (StringUtils.hasText(endDate)) {
                end = LocalDate.parse(endDate, dateFmt).atTime(23, 59, 59);
            }
        } catch (Exception e) {
            // Invalid date format -> ignore filter
        }

        List<Memo> memos = memoService.searchMemos(user.getId(), keyword, start, end);
        model.addAttribute("memos", memos);
        model.addAttribute("mode", "memos");

        // Keep other sections empty / optional
        model.addAttribute("dueSoonMemos", List.of());
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
