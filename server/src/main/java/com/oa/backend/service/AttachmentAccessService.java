package com.oa.backend.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.oa.backend.entity.AttachmentMeta;
import com.oa.backend.entity.Employee;
import com.oa.backend.entity.FormRecord;
import com.oa.backend.entity.ProjectMember;
import com.oa.backend.mapper.EmployeeMapper;
import com.oa.backend.mapper.FormRecordMapper;
import com.oa.backend.mapper.ProjectMemberMapper;
import java.util.Set;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.stereotype.Service;

/**
 * 附件访问控制服务 职责：判断当前用户是否有权访问指定附件。 新规则（A-AUDIT-FIX-03）： - 上传者本人可访问 - 审计角色 CEO / FINANCE / HR 可访问任意附件 -
 * PROJECT_MANAGER 仅当该附件关联业务记录的 project_id 属于自己作为 PM 管理的项目 - DEPARTMENT_MANAGER 仅当业务记录提交人与自己同部门 -
 * 其它情况拒绝
 *
 * <p>业务类型（businessType）→ 归属解析： LOG / INJURY / EXPENSE / LEAVE / OVERTIME 全部经由 form_record 表，
 * businessId = form_record.id；从 form_record 取 project_id + submitter_id GENERAL
 * 或未识别类型：无归属信息，仅上传者/审计角色放行
 */
@Service
@RequiredArgsConstructor
public class AttachmentAccessService {

  private final FormRecordMapper formRecordMapper;
  private final ProjectMemberMapper projectMemberMapper;
  private final EmployeeMapper employeeMapper;

  private static final Set<String> AUDIT_ROLES = Set.of("ROLE_CEO", "ROLE_FINANCE", "ROLE_HR");
  private static final Set<String> FORM_RECORD_TYPES =
      Set.of("LOG", "INJURY", "EXPENSE", "LEAVE", "OVERTIME");

  /** 业务归属信息：项目归属 + 提交人/部门归属 */
  public record BusinessOwnership(Long projectId, Long submitterId, Long submitterDepartmentId) {}

  /** 判定 currentEmployee 是否有权访问该附件 */
  public boolean canAccess(AttachmentMeta meta, Authentication auth, Long currentEmployeeId) {
    if (meta == null || auth == null) return false;

    // 1. 上传者本人
    if (currentEmployeeId != null && currentEmployeeId.equals(meta.getUploadedBy())) {
      return true;
    }

    Set<String> authorities =
        auth.getAuthorities().stream()
            .map(GrantedAuthority::getAuthority)
            .collect(Collectors.toUnmodifiableSet());

    // 2. 审计角色（CEO / FINANCE / HR）
    if (authorities.stream().anyMatch(AUDIT_ROLES::contains)) {
      return true;
    }

    // 3. 解析业务归属；无归属则拒绝 PM / DEPT_MANAGER
    BusinessOwnership ownership = resolveOwnership(meta.getBusinessType(), meta.getBusinessId());
    if (ownership == null) {
      return false;
    }

    // 4. PROJECT_MANAGER：项目归属校验
    if (authorities.contains("ROLE_PROJECT_MANAGER")
        && ownership.projectId() != null
        && currentEmployeeId != null
        && isProjectPm(currentEmployeeId, ownership.projectId())) {
      return true;
    }

    // 5. DEPARTMENT_MANAGER：同部门校验
    if (authorities.contains("ROLE_DEPARTMENT_MANAGER")
        && currentEmployeeId != null
        && ownership.submitterDepartmentId() != null) {
      Employee self = employeeMapper.selectById(currentEmployeeId);
      if (self != null && ownership.submitterDepartmentId().equals(self.getDepartmentId())) {
        return true;
      }
    }

    return false;
  }

  /** 根据业务类型和业务 ID 解析归属记录 当前所有 5 种 businessType 均映射到 form_record 表 GENERAL 或无法解析返回 null */
  BusinessOwnership resolveOwnership(String businessType, Long businessId) {
    if (businessType == null || businessId == null) return null;
    if (!FORM_RECORD_TYPES.contains(businessType)) return null;

    FormRecord form = formRecordMapper.selectById(businessId);
    if (form == null) return null;

    Long submitterId = form.getSubmitterId();
    Long submitterDepartmentId = null;
    if (submitterId != null) {
      Employee submitter = employeeMapper.selectById(submitterId);
      if (submitter != null) {
        submitterDepartmentId = submitter.getDepartmentId();
      }
    }
    return new BusinessOwnership(form.getProjectId(), submitterId, submitterDepartmentId);
  }

  /** 判断某员工是否为某项目的 PM */
  boolean isProjectPm(Long employeeId, Long projectId) {
    Long count =
        projectMemberMapper.selectCount(
            new LambdaQueryWrapper<ProjectMember>()
                .eq(ProjectMember::getEmployeeId, employeeId)
                .eq(ProjectMember::getProjectId, projectId)
                .eq(ProjectMember::getRole, "PM")
                .eq(ProjectMember::getDeleted, 0));
    return count != null && count > 0;
  }
}
