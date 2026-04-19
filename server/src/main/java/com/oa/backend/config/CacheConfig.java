package com.oa.backend.config;

import com.github.benmanes.caffeine.cache.Caffeine;
import java.util.concurrent.TimeUnit;
import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cache.caffeine.CaffeineCacheManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Spring Cache 配置。 使用 Caffeine 作为本地缓存实现，提供 60 秒 TTL 的 userProfile 缓存。 目的：减少工作台个人资料接口对 employee /
 * department 表的重复查询。
 */
@Configuration
@EnableCaching
public class CacheConfig {

  @Bean
  public CacheManager cacheManager() {
    CaffeineCacheManager manager = new CaffeineCacheManager("userProfile");
    manager.setCaffeine(Caffeine.newBuilder().expireAfterWrite(60, TimeUnit.SECONDS));
    return manager;
  }
}
