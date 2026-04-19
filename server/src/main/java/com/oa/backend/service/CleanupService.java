package com.oa.backend.service;

import com.oa.backend.entity.CleanupTask;
import com.oa.backend.mapper.CleanupTaskMapper;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

/** 数据清理任务服务 职责：封装清理任务（CleanupTask）的查询逻辑， 供 CleanupController 调用，隔离控制器与 Mapper 细节。 */
@Service
@RequiredArgsConstructor
public class CleanupService {

  private final CleanupTaskMapper cleanupTaskMapper;

  /**
   * 查询所有有效的清理任务记录，按创建时间降序排列。 "有效"的定义由 CleanupTaskMapper#findAllActive 查询决定。
   *
   * @return 清理任务列表
   */
  public List<CleanupTask> listAllCleanupTasks() {
    return cleanupTaskMapper.findAllActive();
  }
}
