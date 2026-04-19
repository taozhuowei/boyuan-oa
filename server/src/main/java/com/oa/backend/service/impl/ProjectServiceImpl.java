package com.oa.backend.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.oa.backend.dto.ProjectCreateRequest;
import com.oa.backend.dto.ProjectMemberRequest;
import com.oa.backend.dto.ProjectResponse;
import com.oa.backend.dto.ProjectUpdateRequest;
import com.oa.backend.entity.Employee;
import com.oa.backend.entity.Project;
import com.oa.backend.entity.ProjectMember;
import com.oa.backend.mapper.EmployeeMapper;
import com.oa.backend.mapper.ProjectMapper;
import com.oa.backend.mapper.ProjectMemberMapper;
import com.oa.backend.service.ProjectService;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** 项目服务实现类 */
@Service
@RequiredArgsConstructor
public class ProjectServiceImpl implements ProjectService {

  private final ProjectMapper projectMapper;
  private final ProjectMemberMapper projectMemberMapper;
  private final EmployeeMapper employeeMapper;

  @Override
  public IPage<Project> listProjects(int page, int size, String status, Long pmEmployeeId) {
    // 如果指定了PM，先获取该PM的项目ID列表
    List<Long> projectIds = null;
    if (pmEmployeeId != null) {
      QueryWrapper<ProjectMember> memberWrapper = new QueryWrapper<>();
      memberWrapper.eq("employee_id", pmEmployeeId).eq("role", "PM").eq("deleted", 0);
      List<ProjectMember> pmMembers = projectMemberMapper.selectList(memberWrapper);
      projectIds = pmMembers.stream().map(ProjectMember::getProjectId).toList();
      if (projectIds.isEmpty()) {
        // 没有项目，返回空分页
        return new Page<Project>(page, size);
      }
    }

    Page<Project> pageParam = new Page<>(page, size);
    QueryWrapper<Project> wrapper = new QueryWrapper<>();
    wrapper.eq("deleted", 0);

    if (status != null && !status.isBlank()) {
      wrapper.eq("status", status);
    }

    if (projectIds != null) {
      wrapper.in("id", projectIds);
    }

    wrapper.orderByDesc("created_at");

    return projectMapper.selectPage(pageParam, wrapper);
  }

  @Override
  public Project getById(Long id) {
    QueryWrapper<Project> wrapper = new QueryWrapper<>();
    wrapper.eq("id", id).eq("deleted", 0);
    return projectMapper.selectOne(wrapper);
  }

  @Override
  public List<ProjectMember> getMembers(Long projectId) {
    QueryWrapper<ProjectMember> wrapper = new QueryWrapper<>();
    wrapper
        .eq("project_id", projectId)
        .eq("deleted", 0)
        .orderByDesc("role") // PM 排在前面
        .orderByAsc("created_at");
    return projectMemberMapper.selectList(wrapper);
  }

  @Override
  @Transactional
  public Project create(ProjectCreateRequest req) {
    Project project = new Project();
    project.setName(req.name());
    project.setStatus("ACTIVE");
    project.setStartDate(req.startDate() != null ? req.startDate() : LocalDate.now());
    project.setLogCycleDays(req.logCycleDays() != null ? req.logCycleDays() : 1);
    project.setLogReportCycleDays(1);
    if (req.contractNo() != null) project.setContractNo(req.contractNo());
    if (req.contractAttachmentId() != null)
      project.setContractAttachmentId(req.contractAttachmentId());
    if (req.clientName() != null) project.setClientName(req.clientName());
    if (req.projectDescription() != null) project.setProjectDescription(req.projectDescription());

    LocalDateTime now = LocalDateTime.now();
    project.setCreatedAt(now);
    project.setUpdatedAt(now);
    project.setDeleted(0);

    projectMapper.insert(project);
    return project;
  }

  @Override
  @Transactional
  public Project update(Long id, ProjectUpdateRequest req) {
    Project project = getById(id);
    if (project == null) {
      throw new IllegalArgumentException("项目不存在");
    }

    if (req.name() != null) {
      project.setName(req.name());
    }
    if (req.startDate() != null) {
      project.setStartDate(req.startDate());
    }
    if (req.actualEndDate() != null) {
      project.setActualEndDate(req.actualEndDate());
    }
    if (req.logCycleDays() != null) {
      project.setLogCycleDays(req.logCycleDays());
    }
    if (req.logReportCycleDays() != null) {
      project.setLogReportCycleDays(req.logReportCycleDays());
    }
    if (req.contractNo() != null) project.setContractNo(req.contractNo());
    if (req.contractAttachmentId() != null)
      project.setContractAttachmentId(req.contractAttachmentId());
    if (req.clientName() != null) project.setClientName(req.clientName());
    if (req.projectDescription() != null) project.setProjectDescription(req.projectDescription());

    project.setUpdatedAt(LocalDateTime.now());
    projectMapper.updateById(project);
    return project;
  }

  @Override
  @Transactional
  public void closeProject(Long id) {
    Project project = getById(id);
    if (project == null) {
      throw new IllegalArgumentException("项目不存在");
    }
    project.setStatus("CLOSED");
    project.setActualEndDate(LocalDate.now());
    project.setUpdatedAt(LocalDateTime.now());
    projectMapper.updateById(project);
  }

  @Override
  @Transactional
  public void reopenProject(Long id) {
    Project project = getById(id);
    if (project == null) {
      throw new IllegalArgumentException("项目不存在");
    }
    project.setStatus("ACTIVE");
    project.setUpdatedAt(LocalDateTime.now());
    projectMapper.updateById(project);
  }

  @Override
  @Transactional
  public void delete(Long id) {
    Project project = getById(id);
    if (project == null) {
      throw new IllegalArgumentException("项目不存在");
    }
    project.setDeleted(1);
    project.setUpdatedAt(LocalDateTime.now());
    projectMapper.updateById(project);
  }

  @Override
  @Transactional
  public ProjectMember addMember(Long projectId, ProjectMemberRequest req) {
    // 检查项目是否存在
    Project project = getById(projectId);
    if (project == null) {
      throw new IllegalArgumentException("项目不存在");
    }

    // 检查员工是否存在
    Employee employee = employeeMapper.selectById(req.employeeId());
    if (employee == null) {
      throw new IllegalArgumentException("员工不存在");
    }

    // 检查是否已存在该成员（包括软删除的）
    QueryWrapper<ProjectMember> checkWrapper = new QueryWrapper<>();
    checkWrapper.eq("project_id", projectId).eq("employee_id", req.employeeId());
    ProjectMember existing = projectMemberMapper.selectOne(checkWrapper);

    if (existing != null) {
      if (existing.getDeleted() == 0) {
        throw new IllegalArgumentException("该员工已是项目成员");
      } else {
        // 恢复软删除的成员
        existing.setDeleted(0);
        existing.setRole(req.role() != null ? req.role() : "MEMBER");
        existing.setUpdatedAt(LocalDateTime.now());
        projectMemberMapper.updateById(existing);
        return existing;
      }
    }

    // 创建新成员
    ProjectMember member = new ProjectMember();
    member.setProjectId(projectId);
    member.setEmployeeId(req.employeeId());
    member.setRole(req.role() != null ? req.role() : "MEMBER");

    LocalDateTime now = LocalDateTime.now();
    member.setCreatedAt(now);
    member.setUpdatedAt(now);
    member.setDeleted(0);

    projectMemberMapper.insert(member);
    return member;
  }

  @Override
  @Transactional
  public void removeMember(Long projectId, Long employeeId) {
    QueryWrapper<ProjectMember> wrapper = new QueryWrapper<>();
    wrapper.eq("project_id", projectId).eq("employee_id", employeeId).eq("deleted", 0);

    ProjectMember member = projectMemberMapper.selectOne(wrapper);
    if (member == null) {
      throw new IllegalArgumentException("成员不存在");
    }

    member.setDeleted(1);
    member.setUpdatedAt(LocalDateTime.now());
    projectMemberMapper.updateById(member);
  }

  @Override
  @Transactional
  public void updateById(Project project) {
    projectMapper.updateById(project);
  }

  @Override
  public List<ProjectResponse.ProjectMemberInfo> buildMemberInfos(Long projectId) {
    List<ProjectMember> members = getMembers(projectId);
    return members.stream()
        .map(
            m -> {
              Employee emp = employeeMapper.selectById(m.getEmployeeId());
              return new ProjectResponse.ProjectMemberInfo(
                  m.getEmployeeId(),
                  emp != null ? emp.getEmployeeNo() : "",
                  emp != null ? emp.getName() : "",
                  m.getRole());
            })
        .toList();
  }
}
