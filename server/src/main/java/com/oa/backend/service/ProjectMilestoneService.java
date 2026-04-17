package com.oa.backend.service;

import com.oa.backend.entity.ConstructionLogSummary;
import com.oa.backend.entity.ProjectMilestone;
import com.oa.backend.entity.ProjectProgressLog;
import com.oa.backend.mapper.ConstructionLogSummaryMapper;
import com.oa.backend.mapper.EmployeeMapper;
import com.oa.backend.mapper.ProjectMilestoneMapper;
import com.oa.backend.mapper.ProjectProgressLogMapper;
import com.oa.backend.security.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

/**
 * 项目里程碑、进度记录、施工日志汇总业务服务。
 * 封装里程碑 CRUD、每日进度录入、施工汇总报告生成。
 * Dashboard 数据聚合见 {@link ProjectMilestoneController} — 由 Controller 直接编排本服务方法。
 */
@Service
@RequiredArgsConstructor
public class ProjectMilestoneService {

    private final ProjectMilestoneMapper milestoneMapper;
    private final ProjectProgressLogMapper progressLogMapper;
    private final ConstructionLogSummaryMapper summaryMapper;
    private final EmployeeMapper employeeMapper;

    // ── 里程碑 ────────────────────────────────────────────────────────────

    /**
     * 查询指定项目的里程碑列表，按 sort 升序（使用 Mapper 自定义方法）。
     *
     * @param projectId 项目 ID
     * @return 里程碑列表
     */
    public List<ProjectMilestone> listMilestonesByProjectId(Long projectId) {
        return milestoneMapper.findByProjectId(projectId);
    }

    /**
     * 创建里程碑，设置 created_at / updated_at / deleted=0。
     *
     * @param milestone 已填充字段的里程碑实体
     * @return 插入后含主键的里程碑实体
     */
    public ProjectMilestone createMilestone(ProjectMilestone milestone) {
        milestone.setCreatedAt(LocalDateTime.now());
        milestone.setUpdatedAt(LocalDateTime.now());
        milestone.setDeleted(0);
        milestoneMapper.insert(milestone);
        return milestone;
    }

    /**
     * 按 ID 查询属于指定项目且未删除的里程碑。
     *
     * @param milestoneId 里程碑 ID
     * @param projectId   项目 ID（用于隔离校验）
     * @return 里程碑实体，不存在/已删除/项目不匹配时返回 null
     */
    public ProjectMilestone getMilestoneByIdAndProject(Long milestoneId, Long projectId) {
        ProjectMilestone m = milestoneMapper.selectById(milestoneId);
        if (m == null || m.getDeleted() == 1 || !m.getProjectId().equals(projectId)) return null;
        return m;
    }

    /**
     * 更新里程碑字段，刷新 updated_at 时间戳。
     *
     * @param milestone 已合并补丁字段的里程碑实体
     * @return 更新后的里程碑实体
     */
    public ProjectMilestone updateMilestone(ProjectMilestone milestone) {
        milestone.setUpdatedAt(LocalDateTime.now());
        milestoneMapper.updateById(milestone);
        return milestone;
    }

    /**
     * 逻辑删除里程碑（将 deleted 置为 1）。
     *
     * @param milestoneId 里程碑 ID
     * @param projectId   项目 ID（用于隔离校验）
     * @return 里程碑存在且属于该项目时返回 true，否则返回 false
     */
    public boolean deleteMilestone(Long milestoneId, Long projectId) {
        ProjectMilestone m = milestoneMapper.selectById(milestoneId);
        if (m == null || !m.getProjectId().equals(projectId)) return false;
        m.setDeleted(1);
        m.setUpdatedAt(LocalDateTime.now());
        milestoneMapper.updateById(m);
        return true;
    }

    // ── 进度记录 ──────────────────────────────────────────────────────────

    /**
     * 录入每日项目进度，设置 created_at / updated_at。
     *
     * @param log 已填充字段的进度日志实体
     * @return 插入后含主键的进度日志实体
     */
    public ProjectProgressLog recordProgress(ProjectProgressLog log) {
        log.setCreatedAt(LocalDateTime.now());
        log.setUpdatedAt(LocalDateTime.now());
        progressLogMapper.insert(log);
        return log;
    }

    /**
     * 查询指定项目的所有进度日志（供 Dashboard 折线图使用）。
     *
     * @param projectId 项目 ID
     * @return 进度日志列表
     */
    public List<ProjectProgressLog> listProgressLogsByProjectId(Long projectId) {
        return progressLogMapper.findByProjectId(projectId);
    }

    // ── 施工日志汇总报告 ──────────────────────────────────────────────────

    /**
     * 创建施工日志汇总报告，聚合当前里程碑完成数，标记 CEO 已通知时间。
     *
     * @param summary 已填充字段的汇总实体（projectId/pmId/periodStart/periodEnd/pmNote 为必填）
     * @return 插入后含主键的汇总实体
     */
    public ConstructionLogSummary createConstructionSummary(ConstructionLogSummary summary) {
        summary.setCreatedAt(LocalDateTime.now());
        summary.setUpdatedAt(LocalDateTime.now());
        summary.setDeleted(0);
        summaryMapper.insert(summary);
        return summary;
    }

    /**
     * 查询指定项目的施工日志汇总列表（供 Dashboard 展示）。
     *
     * @param projectId 项目 ID
     * @return 汇总列表
     */
    public List<ConstructionLogSummary> listSummariesByProjectId(Long projectId) {
        return summaryMapper.findByProjectId(projectId);
    }

    /**
     * 从 Authentication 中解析当前登录用户的员工 ID。
     *
     * @param username 登录名
     * @return 员工 ID，未找到时返回 null
     */
    public Long resolveEmployeeId(String username) {
        return SecurityUtils.getEmployeeIdFromUsername(username, employeeMapper);
    }
}
