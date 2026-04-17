package com.oa.backend.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.oa.backend.entity.Employee;
import com.oa.backend.entity.TemporaryDelegation;
import com.oa.backend.mapper.EmployeeMapper;
import com.oa.backend.mapper.TemporaryDelegationMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.List;

/**
 * 临时委托服务。
 *
 * 设计 §6.3：员工提交请假等申请时勾选"启用临时委托"→ 填写代办人手机号 → 系统生成 token →
 * 在有效期内被委托人可代为执行委托人的审批动作（操作日志含 "[代操作]"）。
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class TemporaryDelegationService {

    private final TemporaryDelegationMapper delegationMapper;
    private final EmployeeMapper employeeMapper;

    /**
     * 创建委托。
     *
     * @param delegatorId    委托发起人
     * @param delegatePhone  代办人手机号（必填）
     * @param scope          作用域，null 表示所有 form_type
     * @param startsAt       生效开始
     * @param expiresAt      到期
     * @param relatedFormId  关联表单（如请假单），null 也可
     */
    @Transactional
    public TemporaryDelegation create(Long delegatorId, String delegatePhone, String scope,
                                       LocalDateTime startsAt, LocalDateTime expiresAt, Long relatedFormId) {
        if (delegatorId == null || delegatePhone == null || delegatePhone.isBlank()) {
            throw new IllegalStateException("委托人与代办人手机号必填");
        }
        if (expiresAt == null || (startsAt != null && !expiresAt.isAfter(startsAt))) {
            throw new IllegalStateException("到期时间必须晚于生效时间");
        }
        Employee delegate = employeeMapper.selectOne(
                new LambdaQueryWrapper<Employee>()
                        .eq(Employee::getPhone, delegatePhone)
                        .eq(Employee::getDeleted, 0));

        TemporaryDelegation d = new TemporaryDelegation();
        d.setDelegatorId(delegatorId);
        d.setDelegatePhone(delegatePhone);
        d.setDelegateEmployeeId(delegate != null ? delegate.getId() : null);
        d.setScope(scope);
        d.setStartsAt(startsAt != null ? startsAt : LocalDateTime.now());
        d.setExpiresAt(expiresAt);
        d.setToken(generateToken());
        d.setStatus("ACTIVE");
        d.setRelatedFormId(relatedFormId);
        d.setCreatedAt(LocalDateTime.now());
        d.setUpdatedAt(LocalDateTime.now());
        delegationMapper.insert(d);
        log.info("临时委托已创建: delegatorId={}, delegatePhone={}, expiresAt={}", delegatorId, delegatePhone, expiresAt);
        return d;
    }

    /**
     * 检查 delegateId 是否当前持有 delegatorId 的有效委托（含 scope 校验）。
     */
    public boolean canActOnBehalfOf(Long delegateId, Long delegatorId, String formType) {
        if (delegateId == null || delegatorId == null) return false;
        LocalDateTime now = LocalDateTime.now();
        List<TemporaryDelegation> active = delegationMapper.selectList(
                new LambdaQueryWrapper<TemporaryDelegation>()
                        .eq(TemporaryDelegation::getDelegateEmployeeId, delegateId)
                        .eq(TemporaryDelegation::getDelegatorId, delegatorId)
                        .eq(TemporaryDelegation::getStatus, "ACTIVE")
                        .eq(TemporaryDelegation::getDeleted, 0));
        for (TemporaryDelegation d : active) {
            if (d.getStartsAt() != null && d.getStartsAt().isAfter(now)) continue;
            if (d.getExpiresAt() != null && d.getExpiresAt().isBefore(now)) continue;
            if (d.getScope() != null && !d.getScope().isBlank() && !d.getScope().equals(formType)) continue;
            return true;
        }
        return false;
    }

    public List<TemporaryDelegation> listMine(Long employeeId, boolean asDelegator) {
        LambdaQueryWrapper<TemporaryDelegation> q = new LambdaQueryWrapper<TemporaryDelegation>()
                .eq(TemporaryDelegation::getDeleted, 0)
                .orderByDesc(TemporaryDelegation::getCreatedAt);
        if (asDelegator) q.eq(TemporaryDelegation::getDelegatorId, employeeId);
        else q.eq(TemporaryDelegation::getDelegateEmployeeId, employeeId);
        return delegationMapper.selectList(q);
    }

    @Transactional
    public boolean revoke(Long id, Long actorId) {
        TemporaryDelegation d = delegationMapper.selectById(id);
        if (d == null || d.getDeleted() == 1) return false;
        if (!d.getDelegatorId().equals(actorId)) {
            throw new IllegalStateException("仅委托发起人可撤销");
        }
        d.setStatus("REVOKED");
        d.setUpdatedAt(LocalDateTime.now());
        delegationMapper.updateById(d);
        return true;
    }

    /** 后台清理过期委托（结算/审批等读路径调用 + 可加 @Scheduled） */
    @Transactional
    public int sweepExpired() {
        LocalDateTime now = LocalDateTime.now();
        List<TemporaryDelegation> active = delegationMapper.selectList(
                new LambdaQueryWrapper<TemporaryDelegation>()
                        .eq(TemporaryDelegation::getStatus, "ACTIVE")
                        .lt(TemporaryDelegation::getExpiresAt, now)
                        .eq(TemporaryDelegation::getDeleted, 0));
        for (TemporaryDelegation d : active) {
            d.setStatus("EXPIRED");
            d.setUpdatedAt(now);
            delegationMapper.updateById(d);
        }
        return active.size();
    }

    /**
     * 根据用户名（employee_no）解析员工 ID；供 controller 使用，避免直接注入 EmployeeMapper
     */
    public Long resolveEmployeeIdByUsername(String username) {
        if (username == null) return null;
        Employee emp = employeeMapper.selectOne(
                new LambdaQueryWrapper<Employee>()
                        .eq(Employee::getEmployeeNo, username)
                        .eq(Employee::getDeleted, 0));
        return emp != null ? emp.getId() : null;
    }

    private String generateToken() {
        byte[] bytes = new byte[32];
        new SecureRandom().nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }
}
