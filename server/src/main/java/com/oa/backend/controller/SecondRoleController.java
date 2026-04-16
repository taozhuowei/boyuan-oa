package com.oa.backend.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.oa.backend.entity.Employee;
import com.oa.backend.entity.SecondRoleAssignment;
import com.oa.backend.entity.SecondRoleDef;
import com.oa.backend.mapper.EmployeeMapper;
import com.oa.backend.mapper.SecondRoleAssignmentMapper;
import com.oa.backend.mapper.SecondRoleDefMapper;
import com.oa.backend.security.SecurityUtils;
import com.oa.backend.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/**
 * 第二角色（售后 / 物资管理 / 工长）分配 Controller。
 * 默认 PM 可分配；CEO 也可分配；CEO 收通知；分配无审批（系统设置可后续扩展）。
 *
 * Routes:
 *   GET    /second-roles/defs                   定义列表（认证用户）
 *   GET    /second-roles?employeeId=&projectId= 查询有效分配
 *   POST   /second-roles                        分配（PM/CEO）
 *   DELETE /second-roles/{id}                   撤销（PM/CEO）
 */
@RestController
@RequestMapping("/second-roles")
@RequiredArgsConstructor
public class SecondRoleController {

    private final SecondRoleDefMapper defMapper;
    private final SecondRoleAssignmentMapper assignmentMapper;
    private final EmployeeMapper employeeMapper;
    private final NotificationService notificationService;

    @GetMapping("/defs")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<SecondRoleDef>> listDefs() {
        return ResponseEntity.ok(defMapper.selectList(
                new LambdaQueryWrapper<SecondRoleDef>()
                        .eq(SecondRoleDef::getIsEnabled, true)
                        .eq(SecondRoleDef::getDeleted, 0)
        ));
    }

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<SecondRoleAssignment>> list(
            @RequestParam(required = false) Long employeeId,
            @RequestParam(required = false) Long projectId) {
        LambdaQueryWrapper<SecondRoleAssignment> q = new LambdaQueryWrapper<SecondRoleAssignment>()
                .eq(SecondRoleAssignment::getRevoked, false)
                .eq(SecondRoleAssignment::getDeleted, 0)
                .orderByDesc(SecondRoleAssignment::getCreatedAt);
        if (employeeId != null) q.eq(SecondRoleAssignment::getEmployeeId, employeeId);
        if (projectId != null) q.eq(SecondRoleAssignment::getProjectId, projectId);
        return ResponseEntity.ok(assignmentMapper.selectList(q));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('CEO','PROJECT_MANAGER')")
    @Transactional
    @com.oa.backend.annotation.OperationLogRecord(action = "SECOND_ROLE_ASSIGN", targetType = "SECOND_ROLE")
    public ResponseEntity<?> assign(@RequestBody AssignRequest req, Authentication auth) {
        if (req.employeeId() == null || req.roleCode() == null || req.roleCode().isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "employeeId 与 roleCode 必填"));
        }
        SecondRoleDef def = defMapper.selectOne(
                new LambdaQueryWrapper<SecondRoleDef>()
                        .eq(SecondRoleDef::getCode, req.roleCode())
                        .eq(SecondRoleDef::getDeleted, 0));
        if (def == null) return ResponseEntity.badRequest().body(Map.of("message", "未知第二角色: " + req.roleCode()));
        if (Boolean.TRUE.equals(def.getProjectBound()) && req.projectId() == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "该角色需绑定项目"));
        }

        Employee target = employeeMapper.selectById(req.employeeId());
        if (target == null || target.getDeleted() == 1) {
            return ResponseEntity.badRequest().body(Map.of("message", "员工不存在"));
        }
        if (def.getAppliesTo() != null && !def.getAppliesTo().equals(target.getEmployeeType())) {
            return ResponseEntity.badRequest().body(Map.of(
                    "message", "员工类别 [" + target.getEmployeeType() + "] 与角色适用范围 [" + def.getAppliesTo() + "] 不符"));
        }

        // 同一 (employee, role, project) 不能重复有效分配
        Long dup = assignmentMapper.selectCount(
                new LambdaQueryWrapper<SecondRoleAssignment>()
                        .eq(SecondRoleAssignment::getEmployeeId, req.employeeId())
                        .eq(SecondRoleAssignment::getRoleCode, req.roleCode())
                        .eq(req.projectId() != null, SecondRoleAssignment::getProjectId, req.projectId())
                        .eq(SecondRoleAssignment::getRevoked, false)
                        .eq(SecondRoleAssignment::getDeleted, 0));
        if (dup != null && dup > 0) {
            return ResponseEntity.badRequest().body(Map.of("message", "该员工在此项目已分配此第二角色"));
        }

        Long me = SecurityUtils.getEmployeeIdFromUsername(auth.getName(), employeeMapper);
        SecondRoleAssignment a = new SecondRoleAssignment();
        a.setEmployeeId(req.employeeId());
        a.setRoleCode(req.roleCode());
        a.setProjectId(req.projectId());
        a.setAssignedBy(me);
        a.setRevoked(false);
        a.setNote(req.note());
        a.setCreatedAt(LocalDateTime.now());
        a.setUpdatedAt(LocalDateTime.now());
        assignmentMapper.insert(a);

        // 通知 CEO（按设计：分配无审批，CEO 收通知）
        try {
            List<Employee> ceos = employeeMapper.selectList(
                    new LambdaQueryWrapper<Employee>().eq(Employee::getRoleCode, "ceo").eq(Employee::getDeleted, 0));
            for (Employee c : ceos) {
                notificationService.send(c.getId(),
                        "第二角色已分配",
                        String.format("%s 被分配 %s（%s）",
                                target.getName(), def.getName(),
                                req.projectId() != null ? "项目 #" + req.projectId() : "全局"),
                        "SYSTEM", "SECOND_ROLE", a.getId());
            }
        } catch (Exception ignored) {}

        return ResponseEntity.ok(a);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('CEO','PROJECT_MANAGER')")
    @Transactional
    @com.oa.backend.annotation.OperationLogRecord(action = "SECOND_ROLE_REVOKE", targetType = "SECOND_ROLE")
    public ResponseEntity<?> revoke(@PathVariable Long id) {
        SecondRoleAssignment a = assignmentMapper.selectById(id);
        if (a == null || a.getDeleted() == 1) return ResponseEntity.notFound().build();
        a.setRevoked(true);
        a.setRevokedAt(LocalDateTime.now());
        a.setUpdatedAt(LocalDateTime.now());
        assignmentMapper.updateById(a);
        return ResponseEntity.ok(Map.of("message", "已撤销", "id", id));
    }

    public record AssignRequest(Long employeeId, String roleCode, Long projectId, String note) {}
}
