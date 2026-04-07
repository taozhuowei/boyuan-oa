package com.oa.backend.security;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

/**
 * 验证码和重置令牌存储组件（内存实现）
 * 开发阶段使用，生产环境应替换为 Redis
 */
@Slf4j
@Component
public class ResetCodeStore {

    // 验证码存储: phone -> CodeEntry
    private final Map<String, CodeEntry> codeStore = new ConcurrentHashMap<>();

    // 重置令牌存储: token -> TokenEntry
    private final Map<String, TokenEntry> tokenStore = new ConcurrentHashMap<>();

    // 验证码有效期：5分钟
    private static final long CODE_TTL_MINUTES = 5;
    // 重置令牌有效期：10分钟
    private static final long TOKEN_TTL_MINUTES = 10;

    /**
     * 存储验证码
     */
    public void storeCode(String phone, String code) {
        cleanupExpiredCodes();
        codeStore.put(phone, new CodeEntry(code, LocalDateTime.now().plusMinutes(CODE_TTL_MINUTES)));
        log.info("SMS code for {}: {}", phone, code);
    }

    /**
     * 验证验证码
     */
    public boolean verifyCode(String phone, String code) {
        CodeEntry entry = codeStore.get(phone);
        if (entry == null) {
            return false;
        }
        if (entry.isExpired()) {
            codeStore.remove(phone);
            return false;
        }
        return entry.code().equals(code);
    }

    /**
     * 删除验证码
     */
    public void removeCode(String phone) {
        codeStore.remove(phone);
    }

    /**
     * 创建重置令牌
     */
    public String createToken(String phone) {
        cleanupExpiredTokens();
        String token = UUID.randomUUID().toString();
        tokenStore.put(token, new TokenEntry(phone, LocalDateTime.now().plusMinutes(TOKEN_TTL_MINUTES)));
        return token;
    }

    /**
     * 验证重置令牌，返回手机号
     */
    public String verifyToken(String token) {
        TokenEntry entry = tokenStore.get(token);
        if (entry == null) {
            return null;
        }
        if (entry.isExpired()) {
            tokenStore.remove(token);
            return null;
        }
        return entry.phone();
    }

    /**
     * 删除重置令牌
     */
    public void removeToken(String token) {
        tokenStore.remove(token);
    }

    /**
     * 清理过期验证码
     */
    private void cleanupExpiredCodes() {
        codeStore.entrySet().removeIf(entry -> entry.getValue().isExpired());
    }

    /**
     * 清理过期令牌
     */
    private void cleanupExpiredTokens() {
        tokenStore.entrySet().removeIf(entry -> entry.getValue().isExpired());
    }

    /**
     * 获取验证码（仅用于开发测试）
     */
    public String getCodeForTest(String phone) {
        CodeEntry entry = codeStore.get(phone);
        if (entry == null || entry.isExpired()) {
            return null;
        }
        return entry.code();
    }

    private record CodeEntry(String code, LocalDateTime expireAt) {
        boolean isExpired() {
            return LocalDateTime.now().isAfter(expireAt);
        }
    }

    private record TokenEntry(String phone, LocalDateTime expireAt) {
        boolean isExpired() {
            return LocalDateTime.now().isAfter(expireAt);
        }
    }
}
