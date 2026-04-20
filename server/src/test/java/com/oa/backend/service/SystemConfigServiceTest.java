package com.oa.backend.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import com.oa.backend.entity.SystemConfig;
import com.oa.backend.mapper.SystemConfigMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

/** SystemConfigService 单元测试 覆盖：配置读取（存在/缺省）、upsert（更新已有记录、插入新记录） */
@ExtendWith(MockitoExtension.class)
@DisplayName("M7 - SystemConfigService")
class SystemConfigServiceTest {

  @InjectMocks private SystemConfigService service;

  @Mock private SystemConfigMapper configMapper;

  // ─── getConfigValue ──────────────────────────────────────────

  @Test
  @DisplayName("getConfigValue：配置存在时返回 configValue")
  void getConfigValue_configFound_returnsConfigValue() {
    SystemConfig config = new SystemConfig();
    config.setConfigKey("company_name");
    config.setConfigValue("博远建设");
    when(configMapper.selectById("company_name")).thenReturn(config);

    String result = service.getConfigValue("company_name", "默认公司");

    assertEquals("博远建设", result);
    verify(configMapper).selectById("company_name");
  }

  @Test
  @DisplayName("getConfigValue：配置不存在（selectById 返回 null）时返回 defaultValue")
  void getConfigValue_configNotFound_returnsDefaultValue() {
    when(configMapper.selectById("missing_key")).thenReturn(null);

    String result = service.getConfigValue("missing_key", "缺省值");

    assertEquals("缺省值", result);
    verify(configMapper).selectById("missing_key");
  }

  // ─── upsertConfig ────────────────────────────────────────────

  @Test
  @DisplayName("upsertConfig：已有配置存在时更新 configValue 并调用 updateById")
  void upsertConfig_existingConfig_updatesValue() {
    SystemConfig existing = new SystemConfig();
    existing.setConfigKey("attendance_unit");
    existing.setConfigValue("HALF_DAY");
    existing.setDescription("考勤最小单位");
    when(configMapper.selectById("attendance_unit")).thenReturn(existing);
    when(configMapper.updateById(any())).thenReturn(1);

    service.upsertConfig("attendance_unit", "HOUR", "考勤最小单位");

    ArgumentCaptor<SystemConfig> captor = ArgumentCaptor.forClass(SystemConfig.class);
    verify(configMapper).updateById(captor.capture());
    verify(configMapper, never()).insert(any());

    SystemConfig updated = captor.getValue();
    assertEquals("HOUR", updated.getConfigValue());
    // key and description are not changed by the update path
    assertEquals("attendance_unit", updated.getConfigKey());
  }

  @Test
  @DisplayName("upsertConfig：配置不存在时插入新 SystemConfig，三个字段全部写入")
  void upsertConfig_configNotFound_insertsNewRecord() {
    when(configMapper.selectById("new_key")).thenReturn(null);
    when(configMapper.insert(any())).thenReturn(1);

    service.upsertConfig("new_key", "new_value", "新配置描述");

    ArgumentCaptor<SystemConfig> captor = ArgumentCaptor.forClass(SystemConfig.class);
    verify(configMapper).insert(captor.capture());
    verify(configMapper, never()).updateById(any());

    SystemConfig inserted = captor.getValue();
    assertEquals("new_key", inserted.getConfigKey());
    assertEquals("new_value", inserted.getConfigValue());
    assertEquals("新配置描述", inserted.getDescription());
  }
}
