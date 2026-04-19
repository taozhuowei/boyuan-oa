package com.oa.backend.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.oa.backend.entity.CleanupTask;
import java.util.List;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

/**
 * 清理任务数据访问层接口，操作 cleanup_task 表。
 *
 * <p>提供清理任务的基础 CRUD 操作以及按状态查询功能。
 *
 * @author OA Backend Team
 * @since 1.0
 */
@Mapper
public interface CleanupTaskMapper extends BaseMapper<CleanupTask> {

  /**
   * 查询所有未删除的清理任务，按创建时间降序排列。
   *
   * @return 清理任务列表
   */
  @Select("SELECT * FROM cleanup_task WHERE deleted = 0 ORDER BY created_at DESC")
  List<CleanupTask> findAllActive();

  /**
   * 根据数据类型查询未删除的清理任务。
   *
   * @param dataType 数据类型
   * @return 清理任务列表
   */
  @Select(
      "SELECT * FROM cleanup_task WHERE data_type = #{dataType} AND deleted = 0 ORDER BY created_at DESC")
  List<CleanupTask> findByDataType(@Param("dataType") String dataType);

  /**
   * 统计指定状态的清理任务数量。
   *
   * @param status 状态，如：PENDING, RUNNING, DONE, FAILED
   * @return 任务数量
   */
  @Select("SELECT COUNT(*) FROM cleanup_task WHERE status = #{status} AND deleted = 0")
  int countByStatus(@Param("status") String status);
}
