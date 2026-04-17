package com.oa.backend.service;

import com.oa.backend.entity.Employee;
import com.oa.backend.entity.FormRecord;
import com.oa.backend.entity.Project;
import com.oa.backend.mapper.EmployeeMapper;
import com.oa.backend.mapper.FormRecordMapper;
import com.oa.backend.mapper.ProjectMapper;
import com.oa.backend.security.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * 施工日志服务类。
 * <p>
 * 负责施工日志和工伤申报中直接操作数据库的辅助逻辑，封装 FormRecordMapper、
 * ProjectMapper 和 EmployeeMapper 的调用。
 * <p>
 * 注意：审批流程逻辑委托给 FormService 和 ApprovalFlowService；
 * 出勤记录委托给 ConstructionAttendanceService；
 * 站内通知委托给 NotificationService。
 * 本服务只处理上述服务未覆盖的直接 Mapper 操作。
 */
@Service
@RequiredArgsConstructor
public class WorkLogService {

    private final FormRecordMapper formRecordMapper;
    private final ProjectMapper projectMapper;
    private final EmployeeMapper employeeMapper;

    /**
     * 插入新的表单记录（用于 PM 自填日志的直接 APPROVED 写入路径）。
     *
     * @param formRecord 表单记录实体（已填充所有字段）
     */
    public void saveFormRecord(FormRecord formRecord) {
        formRecordMapper.insert(formRecord);
    }

    /**
     * 根据 ID 查询表单记录（用于 PM 批注和 CEO 追溯驳回）。
     *
     * @param id 表单记录 ID
     * @return 表单记录实体，不存在时返回 null
     */
    public FormRecord findFormRecordById(Long id) {
        return formRecordMapper.selectById(id);
    }

    /**
     * 更新表单记录（用于 PM 批注写入 remark 和 CEO 追溯驳回更新状态）。
     *
     * @param formRecord 已修改的表单记录实体
     */
    public void updateFormRecord(FormRecord formRecord) {
        formRecordMapper.updateById(formRecord);
    }

    /**
     * 根据 ID 查询项目（用于判断项目是否配置了工长）。
     *
     * @param projectId 项目 ID
     * @return 项目实体，不存在时返回 null
     */
    public Project findProjectById(Long projectId) {
        return projectMapper.selectById(projectId);
    }

    /**
     * 查询所有角色为 CEO 且未删除的员工列表（用于 PM 自填日志后通知 CEO）。
     *
     * @return CEO 员工列表
     */
    public List<Employee> listCeoEmployees() {
        return employeeMapper.selectList(
                new com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper<Employee>()
                        .eq(Employee::getRoleCode, "ceo")
                        .eq(Employee::getDeleted, 0)
        );
    }

    /**
     * 从认证信息中解析当前登录员工的 ID。
     *
     * @param authentication Spring Security 认证对象
     * @return 员工 ID，解析失败时返回 null
     */
    public Long resolveEmployeeId(Authentication authentication) {
        if (authentication == null) return null;
        Employee employee = SecurityUtils.getEmployeeFromUsername(authentication.getName(), employeeMapper);
        return employee != null ? employee.getId() : null;
    }

    /**
     * 从认证信息中解析当前登录员工的角色代码。
     *
     * @param authentication Spring Security 认证对象
     * @return 角色代码字符串，解析失败时返回 null
     */
    public String resolveRoleCode(Authentication authentication) {
        if (authentication == null) return null;
        Employee employee = SecurityUtils.getEmployeeFromUsername(authentication.getName(), employeeMapper);
        return employee != null ? employee.getRoleCode() : null;
    }
}
