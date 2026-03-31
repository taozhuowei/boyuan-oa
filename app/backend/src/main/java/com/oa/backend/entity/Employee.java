package com.oa.backend.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * 员工实体类，对应数据表 sys_employee
 */
@Data
@TableName("sys_employee")
public class Employee {

    /** 员工主键 ID */
    @TableId(type = IdType.AUTO)
    private Long id;

    /** 关联用户 ID */
    private Long userId;

    /** 员工编号 */
    private String employeeNo;

    /** 员工姓名 */
    private String name;

    /** 员工类型 */
    private Integer employeeType;

    /** 所属部门 ID */
    private Long departmentId;

    /** 所属项目 ID */
    private Long projectId;

    /** 职位 */
    private String position;

    /** 入职日期 */
    private LocalDate entryDate;

    /** 状态 */
    private Integer status;

    /** 创建时间 */
    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createTime;

    /** 更新时间 */
    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updateTime;

    /** 逻辑删除标志 */
    @TableLogic
    private Integer deleted;
}
