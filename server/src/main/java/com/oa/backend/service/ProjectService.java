package com.oa.backend.service;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.oa.backend.dto.ProjectCreateRequest;
import com.oa.backend.dto.ProjectMemberRequest;
import com.oa.backend.dto.ProjectResponse;
import com.oa.backend.dto.ProjectUpdateRequest;
import com.oa.backend.entity.Project;
import com.oa.backend.entity.ProjectMember;
import java.util.List;

/** 项目服务接口 */
public interface ProjectService {

  /**
   * 分页查询项目列表
   *
   * @param page 页码
   * @param size 每页大小
   * @param status 状态筛选（可选）
   * @param pmEmployeeId PM筛选（可选）
   * @return 分页结果
   */
  IPage<Project> listProjects(int page, int size, String status, Long pmEmployeeId);

  /**
   * 根据ID获取项目
   *
   * @param id 项目ID
   * @return 项目实体
   */
  Project getById(Long id);

  /**
   * 获取项目成员列表
   *
   * @param projectId 项目ID
   * @return 成员列表
   */
  List<ProjectMember> getMembers(Long projectId);

  /**
   * 创建项目
   *
   * @param req 创建请求
   * @return 创建的项目
   */
  Project create(ProjectCreateRequest req);

  /**
   * 更新项目
   *
   * @param id 项目ID
   * @param req 更新请求
   * @return 更新的项目
   */
  Project update(Long id, ProjectUpdateRequest req);

  /**
   * 关闭项目（状态设为 CLOSED）
   *
   * @param id 项目ID
   */
  void closeProject(Long id);

  /**
   * 重开项目（状态设为 ACTIVE）
   *
   * @param id 项目ID
   */
  void reopenProject(Long id);

  /**
   * 删除项目（软删除）
   *
   * @param id 项目ID
   */
  void delete(Long id);

  /**
   * 添加项目成员
   *
   * @param projectId 项目ID
   * @param req 成员请求
   * @return 添加的成员
   */
  ProjectMember addMember(Long projectId, ProjectMemberRequest req);

  /**
   * 移除项目成员
   *
   * @param projectId 项目ID
   * @param employeeId 员工ID
   */
  void removeMember(Long projectId, Long employeeId);

  /**
   * 直接更新项目实体（用于 config patch 等场景）
   *
   * @param project 项目实体
   */
  void updateById(Project project);

  /**
   * 构建项目成员信息列表，包含员工编号和姓名（通过 EmployeeMapper 补全）。 从 controller 迁移此逻辑以消除 controller 对 EmployeeMapper
   * 的直接依赖。
   *
   * @param projectId 项目 ID
   * @return 成员信息列表（含员工编号和姓名）
   */
  List<ProjectResponse.ProjectMemberInfo> buildMemberInfos(Long projectId);
}
