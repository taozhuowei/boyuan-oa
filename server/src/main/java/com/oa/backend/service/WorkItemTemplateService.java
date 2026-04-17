package com.oa.backend.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.oa.backend.entity.Employee;
import com.oa.backend.entity.WorkItemTemplate;
import com.oa.backend.mapper.EmployeeMapper;
import com.oa.backend.mapper.WorkItemTemplateMapper;
import com.oa.backend.security.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * 工作项模板服务类。
 * <p>
 * 负责工作项模板的 CRUD 和派生操作，封装 WorkItemTemplateMapper 和 EmployeeMapper 的调用。
 * 数据来源：work_item_template 表（items 字段以 JSON 数组存储）。
 */
@Service
@RequiredArgsConstructor
public class WorkItemTemplateService {

    private final WorkItemTemplateMapper templateMapper;
    private final EmployeeMapper employeeMapper;

    /**
     * 查询所有未删除的模板，按创建时间降序排列。
     * 如果指定 projectId，则只返回该项目的模板。
     *
     * @param projectId 项目 ID（可为 null，表示查询全部）
     * @return 模板列表
     */
    public List<WorkItemTemplate> listTemplatesByProjectId(Long projectId) {
        LambdaQueryWrapper<WorkItemTemplate> qw = new LambdaQueryWrapper<WorkItemTemplate>()
                .eq(WorkItemTemplate::getDeleted, 0)
                .orderByDesc(WorkItemTemplate::getCreatedAt);
        if (projectId != null) {
            qw.eq(WorkItemTemplate::getProjectId, projectId);
        }
        return templateMapper.selectList(qw);
    }

    /**
     * 插入新模板记录。
     *
     * @param template 模板实体
     */
    public void saveTemplate(WorkItemTemplate template) {
        templateMapper.insert(template);
    }

    /**
     * 根据 ID 查询未删除的模板。
     *
     * @param id 模板 ID
     * @return 模板实体，不存在或已删除时返回 null
     */
    public WorkItemTemplate getActiveTemplate(Long id) {
        WorkItemTemplate tmpl = templateMapper.selectById(id);
        return (tmpl == null || tmpl.getDeleted() != 0) ? null : tmpl;
    }

    /**
     * 更新模板记录。
     *
     * @param template 已修改的模板实体
     */
    public void updateTemplate(WorkItemTemplate template) {
        templateMapper.updateById(template);
    }

    /**
     * 从认证信息中解析当前登录员工的 ID。
     *
     * @param auth Spring Security 认证对象
     * @return 员工 ID，解析失败时返回 null
     */
    public Long resolveEmployeeId(Authentication auth) {
        if (auth == null) return null;
        Employee emp = SecurityUtils.getEmployeeFromUsername(auth.getName(), employeeMapper);
        return emp != null ? emp.getId() : null;
    }
}
