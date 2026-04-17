package com.oa.backend.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.oa.backend.entity.ProjectInsuranceDef;
import com.oa.backend.mapper.ProjectInsuranceDefMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 项目保险条目 CRUD 服务（设计 §8.4 保险成本）。
 * 封装保险条目的增删改查；成本聚合计算见 {@link InsuranceCostService}。
 * 配置由财务维护；项目经理 / CEO / 总经理 可读。
 */
@Service
@RequiredArgsConstructor
public class ProjectInsuranceService {

    private final ProjectInsuranceDefMapper mapper;

    /**
     * 查询指定项目未删除的保险条目，按 effective_date 升序排列。
     *
     * @param projectId 项目 ID
     * @return 保险条目列表
     */
    public List<ProjectInsuranceDef> listByProjectId(Long projectId) {
        return mapper.selectList(
                new LambdaQueryWrapper<ProjectInsuranceDef>()
                        .eq(ProjectInsuranceDef::getProjectId, projectId)
                        .eq(ProjectInsuranceDef::getDeleted, 0)
                        .orderByAsc(ProjectInsuranceDef::getEffectiveDate));
    }

    /**
     * 创建保险条目，设置 created_at / updated_at 时间戳。
     *
     * @param def 已填充字段的保险条目实体（projectId/insuranceName/scope/dailyRate/effectiveDate 为必填）
     * @return 插入后含主键的保险条目实体
     */
    public ProjectInsuranceDef createInsurance(ProjectInsuranceDef def) {
        def.setCreatedAt(LocalDateTime.now());
        def.setUpdatedAt(LocalDateTime.now());
        mapper.insert(def);
        return def;
    }

    /**
     * 按 ID 查询属于指定项目且未删除的保险条目。
     *
     * @param itemId    保险条目 ID
     * @param projectId 项目 ID（用于隔离校验）
     * @return 保险条目实体，不存在/已删除/项目不匹配时返回 null
     */
    public ProjectInsuranceDef getByIdAndProject(Long itemId, Long projectId) {
        ProjectInsuranceDef d = mapper.selectById(itemId);
        if (d == null || d.getDeleted() == 1 || !d.getProjectId().equals(projectId)) return null;
        return d;
    }

    /**
     * 更新保险条目字段，刷新 updated_at 时间戳。
     *
     * @param def 已合并补丁字段的保险条目实体
     * @return 更新后的保险条目实体
     */
    public ProjectInsuranceDef updateInsurance(ProjectInsuranceDef def) {
        def.setUpdatedAt(LocalDateTime.now());
        mapper.updateById(def);
        return def;
    }

    /**
     * 删除保险条目（由 MyBatis-Plus 逻辑删除注解控制实际行为）。
     *
     * @param itemId 保险条目 ID
     */
    public void deleteInsurance(Long itemId) {
        mapper.deleteById(itemId);
    }
}
