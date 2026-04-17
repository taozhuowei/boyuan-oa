package com.oa.backend.service;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * 手机号变更流程的内存态存储与清理。
 * 从 AuthController 中抽离，遵守"Controller 只做 HTTP 分发，Service 承载业务状态与定时任务"的分层原则。
 *
 * 存储三类条目：
 *  - currentCodeStore：发送到用户当前手机号的验证码（用于验证所有权）
 *  - newCodeStore：发送到用户新手机号的验证码（用于验证新号码持有）
 *  - tokenStore：变更令牌（验证完当前手机号后签发，凭此请求新号验证码）
 *
 * 所有条目均在写入时附带 expireAt；业务路径每次读取会调用 isExpired() 校验；
 * 本类通过 @Scheduled 周期性回收过期条目以防内存泄漏。
 */
@Service
public class PhoneChangeService {

    private final Map<String, PhoneChangeCodeEntry> currentCodeStore = new ConcurrentHashMap<>();
    private final Map<String, PhoneChangeCodeEntry> newCodeStore = new ConcurrentHashMap<>();
    private final Map<String, PhoneChangeTokenEntry> tokenStore = new ConcurrentHashMap<>();

    public record PhoneChangeCodeEntry(String code, LocalDateTime expireAt) {
        public boolean isExpired() {
            return LocalDateTime.now().isAfter(expireAt);
        }
    }

    public record PhoneChangeTokenEntry(Long userId, LocalDateTime expireAt) {
        public boolean isExpired() {
            return LocalDateTime.now().isAfter(expireAt);
        }
    }

    // ── Current-phone code ──────────────────────────────────────────────

    public void putCurrentCode(String key, String code, LocalDateTime expireAt) {
        currentCodeStore.put(key, new PhoneChangeCodeEntry(code, expireAt));
    }

    public PhoneChangeCodeEntry getCurrentCode(String key) {
        return currentCodeStore.get(key);
    }

    public void removeCurrentCode(String key) {
        currentCodeStore.remove(key);
    }

    // ── New-phone code ──────────────────────────────────────────────────

    public void putNewCode(String key, String code, LocalDateTime expireAt) {
        newCodeStore.put(key, new PhoneChangeCodeEntry(code, expireAt));
    }

    public PhoneChangeCodeEntry getNewCode(String key) {
        return newCodeStore.get(key);
    }

    public void removeNewCode(String key) {
        newCodeStore.remove(key);
    }

    // ── Change token ────────────────────────────────────────────────────

    public void putToken(String key, Long userId, LocalDateTime expireAt) {
        tokenStore.put(key, new PhoneChangeTokenEntry(userId, expireAt));
    }

    public PhoneChangeTokenEntry getToken(String key) {
        return tokenStore.get(key);
    }

    public void removeToken(String key) {
        tokenStore.remove(key);
    }

    /**
     * 失效给定用户的所有变更令牌。
     * 场景：手机号变更确认成功后，清空该用户名下所有未使用的令牌。
     */
    public void removeTokenByUserId(Long userId) {
        tokenStore.entrySet().removeIf(e -> e.getValue().userId().equals(userId));
    }

    /**
     * 每 10 分钟清理一次过期条目，防止 Map 长期运行内存泄漏。
     * 业务路径已在每次访问时 isExpired() 校验，这里仅回收存储空间。
     */
    @Scheduled(fixedDelay = 600_000L)
    void cleanupExpiredEntries() {
        currentCodeStore.entrySet().removeIf(e -> e.getValue().isExpired());
        newCodeStore.entrySet().removeIf(e -> e.getValue().isExpired());
        tokenStore.entrySet().removeIf(e -> e.getValue().isExpired());
    }
}
