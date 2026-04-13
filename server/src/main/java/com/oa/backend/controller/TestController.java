package com.oa.backend.controller;

import com.oa.backend.security.ResetCodeStore;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Profile;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/**
 * 测试接口（仅开发环境使用）
 */
@Profile("!prod")
@RestController
@RequestMapping("/test")
@RequiredArgsConstructor
public class TestController {

    private final ResetCodeStore resetCodeStore;

    /**
     * 获取验证码（用于测试忘记密码流程）
     */
    @GetMapping("/reset-code")
    public ResponseEntity<Map<String, String>> getResetCode(@RequestParam String phone) {
        String code = resetCodeStore.getCodeForTest(phone);
        if (code == null) {
            return ResponseEntity.ok(Map.of("code", "NOT_FOUND", "message", "验证码不存在或已过期"));
        }
        return ResponseEntity.ok(Map.of("code", code));
    }
}
