package com.oa.backend.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.time.LocalDateTime;

/**
 * 临时委托，对应 temporary_delegation 表。
 * 委托人发起请假等申请时勾选，填入代办人手机号；
 * 系统生成 token，到期/被撤销前，被委托人可代为执行委托人角色的审批动作。
 */
@Data
@TableName("temporary_delegation")
public class TemporaryDelegation {

    @TableId(type = IdType.AUTO)
    private Long id;

    @TableField("delegator_id")
    private Long delegatorId;

    @TableField("delegate_phone")
    private String delegatePhone;

    @TableField("delegate_employee_id")
    private Long delegateEmployeeId;

    @TableField("related_form_id")
    private Long relatedFormId;

    /** 委托范围（可选 form_type，如 "LEAVE" / "OVERTIME"），null 表示 ALL */
    private String scope;

    @TableField("starts_at")
    private LocalDateTime startsAt;

    @TableField("expires_at")
    private LocalDateTime expiresAt;

    private String token;

    /** ACTIVE / EXPIRED / REVOKED */
    private String status;

    @TableField("created_at")
    private LocalDateTime createdAt;

    @TableField("updated_at")
    private LocalDateTime updatedAt;

    @TableLogic
    private Integer deleted;
}
