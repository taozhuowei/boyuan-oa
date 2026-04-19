package com.oa.backend.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.oa.backend.entity.SystemConfig;
import org.apache.ibatis.annotations.Insert;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;
import org.apache.ibatis.annotations.Update;

/** 系统配置 Mapper，提供 key-value 配置的持久化操作。 支持获取和设置配置值的方法。 */
@Mapper
public interface SystemConfigMapper extends BaseMapper<SystemConfig> {

  /**
   * 根据配置键获取配置值。
   *
   * @param key 配置键
   * @return 配置值，如果不存在返回 null
   */
  @Select("SELECT config_value FROM system_config WHERE config_key = #{key}")
  String getValue(@Param("key") String key);

  /**
   * 设置配置值。如果键已存在则更新，不存在则插入。
   *
   * @param key 配置键
   * @param value 配置值
   * @param description 配置描述
   */
  @Insert(
      "MERGE INTO system_config (config_key, config_value, description) "
          + "KEY (config_key) VALUES (#{key}, #{value}, #{description})")
  void setValue(
      @Param("key") String key,
      @Param("value") String value,
      @Param("description") String description);

  /**
   * 更新配置值（仅更新值，不更新描述）。
   *
   * @param key 配置键
   * @param value 配置值
   */
  @Update("UPDATE system_config SET config_value = #{value} WHERE config_key = #{key}")
  void updateValue(@Param("key") String key, @Param("value") String value);
}
