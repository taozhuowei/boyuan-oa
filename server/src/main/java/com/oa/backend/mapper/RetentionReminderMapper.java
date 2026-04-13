package com.oa.backend.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.oa.backend.entity.RetentionReminder;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

/**
 * 保留提醒数据访问层接口，操作 retention_reminder 表。
 * <p>
 * 提供保留提醒的基础 CRUD 操作以及按状态统计功能。
 *
 * @author OA Backend Team
 * @since 1.0
 */
@Mapper
public interface RetentionReminderMapper extends BaseMapper<RetentionReminder> {

    /**
     * 统计指定状态的保留提醒数量。
     *
     * @param status 状态，如：PENDING, REMINDED
     * @return 提醒数量
     */
    @Select("SELECT COUNT(*) FROM retention_reminder WHERE status = #{status} AND deleted = 0")
    int countByStatus(@Param("status") String status);
}
