package com.oa.backend.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.oa.backend.entity.ExportBackupTask;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.util.List;

/**
 * 导出备份任务数据访问层接口，操作 export_backup_task 表。
 * <p>
 * 提供导出备份任务的基础 CRUD 操作以及按发起人、状态查询功能。
 *
 * @author OA Backend Team
 * @since 1.0
 */
@Mapper
public interface ExportBackupTaskMapper extends BaseMapper<ExportBackupTask> {

    /**
     * 根据发起人 ID 查询未删除的导出任务，按创建时间降序排列。
     *
     * @param initiatorId 发起人 ID
     * @return 导出备份任务列表
     */
    @Select("SELECT * FROM export_backup_task WHERE initiator_id = #{initiatorId} AND deleted = 0 ORDER BY created_at DESC")
    List<ExportBackupTask> findByInitiatorId(@Param("initiatorId") Long initiatorId);

    /**
     * 根据下载令牌查询导出任务。
     *
     * @param downloadToken 下载令牌（UUID）
     * @return 导出备份任务，未找到返回 null
     */
    @Select("SELECT * FROM export_backup_task WHERE download_token = #{downloadToken} AND deleted = 0")
    ExportBackupTask findByDownloadToken(@Param("downloadToken") String downloadToken);

    /**
     * 根据状态查询未删除的导出任务。
     *
     * @param status 状态，如：PENDING, RUNNING, DONE, FAILED
     * @return 导出备份任务列表
     */
    @Select("SELECT * FROM export_backup_task WHERE status = #{status} AND deleted = 0 ORDER BY created_at DESC")
    List<ExportBackupTask> findByStatus(@Param("status") String status);

    /**
     * 统计指定状态的导出任务数量。
     *
     * @param status 状态
     * @return 任务数量
     */
    @Select("SELECT COUNT(*) FROM export_backup_task WHERE status = #{status} AND deleted = 0")
    int countByStatus(@Param("status") String status);
}
