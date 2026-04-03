package com.oa.backend.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * 员工实体类，对应数据表 employee
 */
@Data
@TableName("employee")
public class Employee {

    /** 员工主键 ID */
    @TableId(type = IdType.AUTO)
    private Long id;

    /** 员工编号（登录用户名） */
    @TableField("employee_no")
    private String employeeNo;

    /** 密码哈希（bcrypt） */
    @TableField("password_hash")
    private String passwordHash;

    /** 是否默认密码 */
    @TableField("is_default_password")
    private Boolean isDefaultPassword;

    /** 员工姓名 */
    private String name;

    /** 手机号 */
    private String phone;

    /** 邮箱 */
    private String email;

    /** 岗位 ID */
    @TableField("position_id")
    private Long positionId;

    /** 等级 ID */
    @TableField("level_id")
    private Long levelId;

    /** 角色编码 */
    @TableField("role_code")
    private String roleCode;

    /** 员工类型（OFFICE/LABOR） */
    @TableField("employee_type")
    private String employeeType;

    /** 直系领导 ID */
    @TableField("direct_supervisor_id")
    private Long directSupervisorId;

    /** 部门 ID */
    @TableField("department_id")
    private Long departmentId;

    /** 账号状态（ACTIVE/DISABLED） */
    @TableField("account_status")
    private String accountStatus;

    /** 入职日期 */
    @TableField("entry_date")
    private LocalDate entryDate;

    /** 离职日期 */
    @TableField("leave_date")
    private LocalDate leaveDate;

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
