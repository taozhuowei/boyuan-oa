package com.oa.backend.service;

import com.oa.backend.dto.ExportTaskCreateRequest;
import com.oa.backend.entity.ExportBackupTask;
import com.oa.backend.mapper.ExportBackupTaskMapper;
import java.time.LocalDateTime;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

/** 备份导出任务服务 职责：封装导出备份任务（ExportBackupTask）的查询与创建逻辑， 供 BackupController 调用，隔离控制器与 Mapper 细节。 */
@Service
@RequiredArgsConstructor
public class BackupService {

  private final ExportBackupTaskMapper exportTaskMapper;

  /**
   * 查询指定发起人的所有导出任务，按创建时间降序排列。 数据来源：ExportBackupTask 表，由 ExportBackupTaskMapper#findByInitiatorId
   * 实现。
   *
   * @param initiatorId 发起人员工 ID
   * @return 该用户发起的导出任务列表
   */
  public List<ExportBackupTask> listExportTasksByInitiator(Long initiatorId) {
    return exportTaskMapper.findByInitiatorId(initiatorId);
  }

  /**
   * 创建新的导出任务，初始状态为 PENDING。
   *
   * <p>startDate / endDate 来自前端请求，仅记录意图，不持久化（表中无对应列）。 数据类型统一设为 "ALL"，由后台任务执行时决定实际导出范围。
   *
   * @param initiatorId 发起人员工 ID
   * @param req 包含起止日期的创建请求（日期字段不落库）
   * @return 已保存的导出任务实体
   */
  public ExportBackupTask createExportTask(Long initiatorId, ExportTaskCreateRequest req) {
    LocalDateTime now = LocalDateTime.now();
    ExportBackupTask task = new ExportBackupTask();
    task.setInitiatorId(initiatorId);
    task.setDataTypes("ALL");
    task.setStatus("PENDING");
    task.setCreatedAt(now);
    task.setUpdatedAt(now);
    task.setDeleted(0);
    exportTaskMapper.insert(task);
    return task;
  }
}
