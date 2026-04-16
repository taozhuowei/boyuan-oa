package com.oa.backend.controller;

import com.oa.backend.service.SetupService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Profile;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/**
 * 开发环境专用控制器。
 * 提供开发调试用的辅助接口，仅在 'dev' 配置文件激活时加载。
 *
 * <p><strong>警告：</strong>此控制器包含危险操作（如重置业务数据），
 * 绝对禁止在生产环境使用。{@code @Profile("dev")} 确保仅在 dev profile 下加载，
 * 生产环境此路由物理不存在。
 *
 * <p>可用端点：
 * <ul>
 *   <li>POST /dev/reset       - 截断全部业务/事务表，保留账号/角色/参照数据（E2E 测试用）</li>
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
    private final JdbcTemplate jdbcTemplate;

    /**
     * E2E 测试数据重置。
     *
     * <p>截断全部业务/事务表，保留参照数据（账号、角色、部门、项目、审批流定义等）。
     * 每个 E2E spec 文件执行前调用，确保测试从干净状态启动。
     *
     * <p>保留表：sys_user、sys_role、employee、department、project、project_member、
     * approval_flow_def、approval_flow_node、payroll_item_def、salary_grade、
     * leave_type_def、form_type_def、retention_policy、system_config、
     * allowance_def、second_role_def、after_sale_type_def、work_item_template 等。
     *
     * @return 操作结果消息
     */
    @PostMapping("/reset")
    public ResponseEntity<Map<String, String>> resetForE2E() {
        log.warn("[DEV] E2E data reset triggered — truncating all business tables");

        jdbcTemplate.execute("SET REFERENTIAL_INTEGRITY FALSE");
        try {
            // Business / transactional tables — order does not matter with FK checks disabled
            for (String table : BUSINESS_TABLES) {
                jdbcTemplate.execute("TRUNCATE TABLE " + table);
            }
        } finally {
            jdbcTemplate.execute("SET REFERENTIAL_INTEGRITY TRUE");
        }

        log.info("[DEV] E2E data reset completed");
        return ResponseEntity.ok(Map.of("message", "reset ok"));
    }

    /** Business tables to truncate on E2E reset. Reference/config tables are intentionally excluded. */
    private static final String[] BUSINESS_TABLES = {
        "form_record",
        "approval_record",
        "overtime_notification",
        "overtime_response",
        "construction_attendance",
        "project_milestone",
        "project_progress_log",
        "construction_log_summary",
        "project_insurance_def",
        "payroll_cycle",
        "payroll_slip",
        "payroll_slip_item",
        "payroll_adjustment",
        "payroll_confirmation",
        "payroll_bonus",
        "employee_signature",
        "salary_confirmation_agreement",
        "evidence_chain",
        "injury_claim",
        "attachment_meta",
        "operation_log",
        "notification",
        "retention_reminder",
        "cleanup_task",
        "export_backup_task",
        "second_role_assignment",
        "temporary_delegation",
        "after_sale_ticket",
        "project_material_cost",
        "emergency_contact"
    };

    /**
     * 重置系统初始化状态。
     * 将 system_config 中的 'initialized' 设置为 false，允许重新执行初始化向导。
     *
     * <p><strong>注意：</strong>此操作不会删除已创建的账户数据，仅重置初始化标记。
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
     *
     * @return operation result message
     */
    @PostMapping("/skip-setup")
    public ResponseEntity<Map<String, String>> skipSetup() {
        setupService.markInitializedForDev();
        return ResponseEntity.ok(Map.of("message", "marked as initialized"));
    }
}
