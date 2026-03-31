package com.oa.backend.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.time.LocalDateTime;

/**
 * 用户实体类，对应数据表 sys_user
 */
@Data
@TableName("sys_user")
public class User {

    /** 用户主键 ID */
    @TableId(type = IdType.AUTO)
    private Long id;

    /** 用户名 */
    private String username;

    /** 登录密码 */
    private String password;

    /** 电子邮箱 */
    private String email;

    /** 联系电话 */
    private String phone;

    /** 企业微信用户 ID */
    private String wxUserId;

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
    private Integer deleted = 0;
}
