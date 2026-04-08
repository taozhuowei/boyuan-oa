package com.oa.backend.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * 工伤理赔实体，对应 injury_claim 表
 * 数据来源：工伤申报审批通过后由财务录入理赔金额
 */
@Data
@TableName("injury_claim")
public class InjuryClaim {

    @TableId(type = IdType.AUTO)
    private Long id;

    /** 关联的表单记录 ID（工伤申报 form_record） */
    private Long formId;

    /** 受伤员工 ID */
    private Long employeeId;

    /** 受伤日期 */
    private LocalDate injuryDate;

    /** 伤情描述 */
    private String injuryDescription;

    /** 理赔金额（财务录入） */
    private BigDecimal compensationAmount;

    /** 财务备注 */
    private String financeNote;

    /** 状态：PENDING / PROCESSING / SETTLED */
    private String status;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;

    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updatedAt;

    @TableLogic
    private Integer deleted;
}
