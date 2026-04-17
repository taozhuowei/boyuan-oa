package com.oa.backend.service;

import com.oa.backend.entity.SystemConfig;
import com.oa.backend.mapper.SystemConfigMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

/**
 * 系统配置服务
 * 职责：封装 SystemConfig 表的读写操作，提供以业务语义命名的接口，
 *      供 SystemConfigController 调用，隔离控制器与持久层细节。
 */
@Service
@RequiredArgsConstructor
public class SystemConfigService {

    private final SystemConfigMapper configMapper;

    /**
     * 读取配置项值；若不存在返回 defaultValue。
     *
     * @param key          配置键
     * @param defaultValue 缺省值
     * @return 配置值或缺省值
     */
    public String getConfigValue(String key, String defaultValue) {
        SystemConfig config = configMapper.selectById(key);
        return config != null ? config.getConfigValue() : defaultValue;
    }

    /**
     * 新增或更新配置项（upsert 语义）。
     * 若 key 已存在则更新其值；否则插入新行。
     *
     * @param key         配置键
     * @param value       配置值
     * @param description 配置描述（仅新增时写入）
     */
    public void upsertConfig(String key, String value, String description) {
        SystemConfig existing = configMapper.selectById(key);
        if (existing != null) {
            existing.setConfigValue(value);
            configMapper.updateById(existing);
        } else {
            SystemConfig config = new SystemConfig();
            config.setConfigKey(key);
            config.setConfigValue(value);
            config.setDescription(description);
            configMapper.insert(config);
        }
    }
}
