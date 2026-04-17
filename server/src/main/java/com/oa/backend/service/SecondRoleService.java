package com.oa.backend.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.oa.backend.entity.Employee;
import com.oa.backend.entity.SecondRoleAssignment;
import com.oa.backend.entity.SecondRoleDef;
import com.oa.backend.mapper.EmployeeMapper;
import com.oa.backend.mapper.SecondRoleAssignmentMapper;
import com.oa.backend.mapper.SecondRoleDefMapper;
import com.oa.backend.security.SecurityUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 第二角色服务
 *
 * 职责：管理第二角色定义的查询，以及第二角色分配（SecondRoleAssignment）
 * 的创建与撤销，含业务规则校验和 CEO 通知。
 *
 * 业务规则：
 *   - 同一 (employee, roleCode, projectId) 不能重复有效分配
 *   - project_bound=true 的角色必须绑定项目
 *   - 角色 applies_to 限制员工类型时须匹配
 *   - 分配后通知 CEO；撤销无通知
 *
 * 数据来源：second_role_def、second_role_assignment、employee 表。
 * 调用方：SecondRoleController。
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class SecondRoleService {

    private final SecondRoleDefMapper defMapper;
    private final SecondRoleAssignmentMapper assignmentMapper;
    private final EmployeeMapper employeeMapper;
    private final NotificationService notificationService;

    /**
     * 查询所有启用的第二角色定义（is_enabled=true、deleted=0）。
     *
     * @return 第二角色定义列表
     */
    public List<SecondRoleDef> listDefs() {
        return defMapper.selectList(
            new LambdaQueryWrapper<SecondRoleDef>()
                .eq(SecondRoleDef::getIsEnabled, true)
                .eq(SecondRoleDef::getDeleted, 0)
        );
    }

    /**
     * 查询有效的分配记录（revoked=false、deleted=0），支持按员工和项目过滤。
     *
     * @param employeeId 员工 ID 过滤，null 表示不过滤
     * @param projectId  项目 ID 过滤，null 表示不过滤
     * @return 分配记录列表，按 created_at 降序
     */
    public List<SecondRoleAssignment> listAssignments(Long employeeId, Long projectId) {
        LambdaQueryWrapper<SecondRoleAssignment> q = new LambdaQueryWrapper<SecondRoleAssignment>()
            .eq(SecondRoleAssignment::getRevoked, false)
            .eq(SecondRoleAssignment::getDeleted, 0)
            .orderByDesc(SecondRoleAssignment::getCreatedAt);
        if (employeeId != null) q.eq(SecondRoleAssignment::getEmployeeId, employeeId);
        if (projectId != null) q.eq(SecondRoleAssignment::getProjectId, projectId);
        return assignmentMapper.selectList(q);
    }

    /**
     * 创建第二角色分配。
     * 校验：roleCode 存在、project_bound 时 projectId 必填、员工存在、类型匹配、无重复有效分配。
     * 成功后异步通知所有 CEO（失败不回滚主事务）。
     *
     * @param employeeId 被分配员工 ID
     * @param roleCode   第二角色编码
     * @param projectId  项目 ID，项目绑定角色时必填
     * @param note       备注
     * @param auth       操作者认证信息（用于记录 assigned_by）
     * @return 分配结果
     */
    @Transactional
    public AssignResult assign(Long employeeId, String roleCode, Long projectId,
                               String note, Authentication auth) {
        if (employeeId == null || roleCode == null || roleCode.isBlank()) {
            return AssignResult.invalid("employeeId 与 roleCode 必填");
        }

        SecondRoleDef def = defMapper.selectOne(
            new LambdaQueryWrapper<SecondRoleDef>()
                .eq(SecondRoleDef::getCode, roleCode)
                .eq(SecondRoleDef::getDeleted, 0));
        if (def == null) {
            return AssignResult.invalid("未知第二角色: " + roleCode);
        }
        if (Boolean.TRUE.equals(def.getProjectBound()) && projectId == null) {
            return AssignResult.invalid("该角色需绑定项目");
        }

        Employee target = employeeMapper.selectById(employeeId);
        if (target == null || target.getDeleted() == 1) {
            return AssignResult.invalid("员工不存在");
        }
        if (def.getAppliesTo() != null && !def.getAppliesTo().equals(target.getEmployeeType())) {
            return AssignResult.invalid("员工类别 [" + target.getEmployeeType()
                    + "] 与角色适用范围 [" + def.getAppliesTo() + "] 不符");
        }

        Long dup = assignmentMapper.selectCount(
            new LambdaQueryWrapper<SecondRoleAssignment>()
                .eq(SecondRoleAssignment::getEmployeeId, employeeId)
                .eq(SecondRoleAssignment::getRoleCode, roleCode)
                .eq(projectId != null, SecondRoleAssignment::getProjectId, projectId)
                .eq(SecondRoleAssignment::getRevoked, false)
                .eq(SecondRoleAssignment::getDeleted, 0));
        if (dup != null && dup > 0) {
            return AssignResult.invalid("该员工在此项目已分配此第二角色");
        }

        Long me = SecurityUtils.getEmployeeIdFromUsername(auth.getName(), employeeMapper);
        SecondRoleAssignment a = new SecondRoleAssignment();
        a.setEmployeeId(employeeId);
        a.setRoleCode(roleCode);
        a.setProjectId(projectId);
        a.setAssignedBy(me);
        a.setRevoked(false);
        a.setNote(note);
        a.setCreatedAt(LocalDateTime.now());
        a.setUpdatedAt(LocalDateTime.now());
        assignmentMapper.insert(a);

        // 通知 CEO（失败不回滚主事务）
        try {
            List<Employee> ceos = employeeMapper.selectList(
                new LambdaQueryWrapper<Employee>()
                    .eq(Employee::getRoleCode, "ceo")
                    .eq(Employee::getDeleted, 0));
            for (Employee c : ceos) {
                notificationService.send(c.getId(),
                    "第二角色已分配",
                    String.format("%s 被分配 %s（%s）",
                        target.getName(), def.getName(),
                        projectId != null ? "项目 #" + projectId : "全局"),
                    "SYSTEM", "SECOND_ROLE", a.getId());
            }
        } catch (Exception e) {
            log.warn("SecondRoleAssign: failed to notify CEO for assignmentId={}", a.getId(), e);
        }

        return AssignResult.ok(a);
    }

    /**
     * 撤销第二角色分配（逻辑删除：revoked=true）。
     *
     * @param id 分配记录 ID
     * @return 撤销结果
     */
    @Transactional
    public RevokeResult revoke(Long id) {
        SecondRoleAssignment a = assignmentMapper.selectById(id);
        if (a == null || a.getDeleted() == 1) {
            return RevokeResult.notFound();
        }
        a.setRevoked(true);
        a.setRevokedAt(LocalDateTime.now());
        a.setUpdatedAt(LocalDateTime.now());
        assignmentMapper.updateById(a);
        return RevokeResult.ok(id);
    }

    // ── Result types ─────────────────────────────────────────────────────────

    /**
     * assign 操作结果。
     */
    public sealed interface AssignResult permits
            AssignResult.Ok, AssignResult.Invalid {

        static AssignResult ok(SecondRoleAssignment assignment) { return new Ok(assignment); }
        static AssignResult invalid(String message) { return new Invalid(message); }

        record Ok(SecondRoleAssignment assignment) implements AssignResult {}
        record Invalid(String message) implements AssignResult {}
    }

    /**
     * revoke 操作结果。
     */
    public sealed interface RevokeResult permits
            RevokeResult.Ok, RevokeResult.NotFound {

        static RevokeResult ok(Long id) { return new Ok(id); }
        static RevokeResult notFound() { return new NotFound(); }

        record Ok(Long id) implements RevokeResult {}
        record NotFound() implements RevokeResult {}
    }
}
