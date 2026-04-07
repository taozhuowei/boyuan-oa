package com.oa.backend.entity;

import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

/**
 * 系统配置实体，对应 system_config 表。
 * 采用 key-value 模型存储全局配置项，如考勤最小计量单位。
 */
@Data
@TableName("system_config")
public class SystemConfig {

    @TableId
    private String configKey;

    private String configValue;

    private String description;
}
