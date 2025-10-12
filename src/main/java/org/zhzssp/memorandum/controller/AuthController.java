package org.zhzssp.memorandum.controller;

import org.zhzssp.memorandum.entity.User;
import org.zhzssp.memorandum.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;
import org.springframework.ui.Model;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.Authentication;

@Controller
public class AuthController {
    @Autowired
    private UserRepository userRepository;

    @GetMapping("/register")
    public String registerForm() {
        return "register"; // 渲染register.html模板
    }

    // 不使用"/"时，login/register或addMemo/register等情况会导致无法正确识别表单提交路径（硬编码的缘故）
    // 接收POST /register请求（内容包括user, password）,处理用户注册
    @PostMapping("/register")
    public String register(@RequestParam String username, @RequestParam String password, Model model) {
        // 后端验证密码长度
        if (password.length() < 5) {
            // 密码不符合要求，返回注册页面并显示错误消息
            model.addAttribute("errorMessage", "Password must be at least 5 characters long.");
            // 使用redirect会发出GET请求，导致错误信息无法显示
            return "register";
        }

        User user = new User();
        user.setUsername(username);
        user.setPassword(new BCryptPasswordEncoder().encode(password));
        // 调用JPA自动生成的SQL语句，保存用户到数据库
        userRepository.save(user);
        // 注册成功后重定向到login页面
        return "redirect:/login";
    }

    @GetMapping("/login")
    public String loginForm() {
        return "login";
    }

    @GetMapping("/user-logged-in")
    @ResponseBody
    public boolean sendUserLoggedInNotification() {
        // 会话超时或注销可能产生问题
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        return authentication != null && authentication.isAuthenticated() && 
               !authentication.getName().equals("anonymousUser");
    }
}
