package com.oa.backend.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 社保项目实体类，对应数据表 social_insurance_item
 */
@Data
@TableName("social_insurance_item")
public class SocialInsuranceItem {

    /** 社保项目主键 ID */
    @TableId(type = IdType.AUTO)
    private Long id;

    /** 所属岗位 ID */
    @TableField("position_id")
    private Long positionId;

    /** 项目名称 */
    private String name;

    /** 员工缴纳比例 */
    @TableField("employee_rate")
    private BigDecimal employeeRate;

    /** 公司缴纳比例 */
    @TableField("company_rate")
    private BigDecimal companyRate;

    /** 是否启用 */
    @TableField("is_enabled")
    private Boolean isEnabled;

    /** 显示排序 */
    @TableField("display_order")
    private Integer displayOrder;

    /** 创建时间 */
    @TableField("created_at")
    private LocalDateTime createdAt;

    /** 更新时间 */
    @TableField("updated_at")
    private LocalDateTime updatedAt;

    /** 逻辑删除标志 */
    @TableLogic
    private Integer deleted;
}
