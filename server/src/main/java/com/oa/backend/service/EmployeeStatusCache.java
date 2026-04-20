package com.oa.backend.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.oa.backend.entity.Employee;
import com.oa.backend.mapper.EmployeeMapper;
import java.time.Instant;
import java.util.concurrent.ConcurrentHashMap;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

/**
 * 员工账号状态本地缓存 — C+-F-11
 *
 * <p>职责：缓存 employee.account_status（TTL 5 分钟），供 JwtAuthenticationFilter 在每次请求时快速检查账号是否被停用，
 * 避免每次请求都查询数据库。 过期后自动回源 DB 刷新缓存。
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class EmployeeStatusCache {

  /** 账号状态缓存条目，记录状态值和缓存写入时间。 */
  private record CachedStatus(String status, Instant cachedAt) {
    /** 5 分钟 TTL */
    private static final long TTL_SECONDS = 300;

    boolean isExpired() {
      return Instant.now().isAfter(cachedAt.plusSeconds(TTL_SECONDS));
    }
  }

  private final EmployeeMapper employeeMapper;

  /** 缓存存储：employeeId → CachedStatus */
  private final ConcurrentHashMap<Long, CachedStatus> cache = new ConcurrentHashMap<>();

  /**
   * 获取员工账号状态，优先从缓存读取，超时后回源 DB。
   *
   * @param employeeId 员工 ID（来自 JWT claim userId）
   * @return 账号状态字符串（ACTIVE / DISABLED 等），查不到返回 null
   */
  public String getAccountStatus(Long employeeId) {
    CachedStatus cached = cache.get(employeeId);
    if (cached != null && !cached.isExpired()) {
      return cached.status();
    }
    // 缓存未命中或已过期，回源 DB
    return refreshFromDb(employeeId);
  }

  /**
   * 主动使某员工的缓存失效（如账号被禁用后立即生效）。 HR 修改账号状态后调用此方法可缩短生效延迟。
   *
   * @param employeeId 员工 ID
   */
  public void invalidate(Long employeeId) {
    cache.remove(employeeId);
  }

  private String refreshFromDb(Long employeeId) {
    try {
      Employee emp =
          employeeMapper.selectOne(
              new LambdaQueryWrapper<Employee>()
                  .eq(Employee::getId, employeeId)
                  .eq(Employee::getDeleted, 0)
                  .select(Employee::getAccountStatus));
      if (emp == null) {
        return null;
      }
      cache.put(employeeId, new CachedStatus(emp.getAccountStatus(), Instant.now()));
      return emp.getAccountStatus();
    } catch (Exception e) {
      log.warn("EmployeeStatusCache: failed to query DB for employeeId={}", employeeId, e);
      return null;
    }
  }
}
