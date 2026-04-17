package com.oa.backend.service;

import com.oa.backend.entity.ExportBackupTask;
import com.oa.backend.mapper.ExportBackupTaskMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * 备份导出任务服务
 * 职责：封装导出备份任务（ExportBackupTask）的查询逻辑，
 *      供 BackupController 调用，隔离控制器与 Mapper 细节。
 */
@Service
@RequiredArgsConstructor
public class BackupService {

    private final ExportBackupTaskMapper exportTaskMapper;

    /**
     * 查询指定发起人的所有导出任务，按创建时间降序排列。
     * 数据来源：ExportBackupTask 表，由 ExportBackupTaskMapper#findByInitiatorId 实现。
     *
     * @param initiatorId 发起人员工 ID
     * @return 该用户发起的导出任务列表
     */
    public List<ExportBackupTask> listExportTasksByInitiator(Long initiatorId) {
        return exportTaskMapper.findByInitiatorId(initiatorId);
    }
}
