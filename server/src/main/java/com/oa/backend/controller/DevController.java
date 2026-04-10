package com.oa.backend.controller;

import com.oa.backend.service.SetupService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Profile;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/**
 * 开发环境专用控制器。
 * 提供开发调试用的辅助接口，仅在 'dev' 配置文件激活时加载。
 *
 * <p><strong>警告：</strong>此控制器包含危险操作（如重置系统初始化状态），
 * 绝对禁止在生产环境使用。{@code @Profile("dev")} 确保仅在 dev profile 下加载，
 * 生产环境此路由物理不存在。
 *
 * <p>可用端点：
 * <ul>
 *   <li>POST /dev/reset-setup - 重置系统初始化状态（允许重新执行初始化向导）</li>
 *   <li>POST /dev/skip-setup  - 标记系统为已初始化（跳过向导直接进入登录）</li>
 * </ul>
 */
@Slf4j
@Profile("dev")
@RestController
@RequestMapping("/dev")
@RequiredArgsConstructor
public class DevController {

    private final SetupService setupService;

    /**
     * 重置系统初始化状态。
     * 将 system_config 中的 'initialized' 设置为 false，允许重新执行初始化向导。
     *
     * <p><strong>注意：</strong>此操作不会删除已创建的账户数据，仅重置初始化标记。
     * 重复初始化可能导致主键冲突，建议在干净数据库上使用。
     *
     * @return 操作结果消息
     */
    @PostMapping("/reset-setup")
    public ResponseEntity<Map<String, String>> resetSetup() {
        setupService.resetForDev();
        return ResponseEntity.ok(Map.of("message", "reset ok"));
    }

    /**
     * Marks the system as initialized for development environment.
     * Used when working with pre-seeded dev data without running the setup wizard.
     * Sets the initialized flag to true without creating any accounts.
     *
     * @return operation result message
     */
    @PostMapping("/skip-setup")
    public ResponseEntity<Map<String, String>> skipSetup() {
        setupService.markInitializedForDev();
        return ResponseEntity.ok(Map.of("message", "marked as initialized"));
    }
}
