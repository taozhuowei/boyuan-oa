package com.oa.backend.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * 项目保险条目（设计 §8.4 保险成本）。
 * 财务在项目"人员管理"子视图中按工种或个人配置工伤/人身/意外险等。
 * 单价单位"元/天"，结合施工日志出勤记录累计成本。
 */
@Data
@TableName("project_insurance_def")
public class ProjectInsuranceDef {

    @TableId(type = IdType.AUTO)
    private Long id;

    @TableField("project_id")
    private Long projectId;

    @TableField("insurance_name")
    private String insuranceName;

    /** 作用域：GLOBAL（全劳工）/ POSITION（指定岗位）/ EMPLOYEE（指定个人） */
    private String scope;

    @TableField("scope_target_id")
    private Long scopeTargetId;

    @TableField("daily_rate")
    private BigDecimal dailyRate;

    @TableField("effective_date")
    private LocalDate effectiveDate;

    private String remark;

    @TableField("created_at")
    private LocalDateTime createdAt;

    @TableField("updated_at")
    private LocalDateTime updatedAt;

    @TableLogic
    private Integer deleted;
}
