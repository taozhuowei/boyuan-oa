package com.oa.backend.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.oa.backend.entity.OvertimeResponse;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Select;

import java.util.List;
import java.util.Optional;

/**
 * 加班响应 Mapper。
 */
@Mapper
public interface OvertimeResponseMapper extends BaseMapper<OvertimeResponse> {

    /**
     * 查找指定通知的所有响应
     */
    @Select("SELECT * FROM overtime_response WHERE notification_id = #{notificationId} AND deleted = 0")
    List<OvertimeResponse> findByNotificationId(Long notificationId);

    /**
     * 查找某员工对某通知的响应（唯一约束）
     */
    @Select("SELECT * FROM overtime_response WHERE notification_id = #{notificationId} AND employee_id = #{employeeId} AND deleted = 0 LIMIT 1")
    OvertimeResponse findByNotificationAndEmployee(Long notificationId, Long employeeId);
}
