package com.oa.backend.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.oa.backend.entity.OvertimeNotification;
import java.util.List;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Select;

/** 加班通知 Mapper，继承 MP BaseMapper 获得基础 CRUD。 */
@Mapper
public interface OvertimeNotificationMapper extends BaseMapper<OvertimeNotification> {

  /** 查询指定项目的加班通知（按创建时间倒序） */
  @Select(
      "SELECT * FROM overtime_notification WHERE project_id = #{projectId} AND deleted = 0 ORDER BY created_at DESC")
  List<OvertimeNotification> findByProjectId(Long projectId);

  /** 查询发起人的所有通知 */
  @Select(
      "SELECT * FROM overtime_notification WHERE initiator_id = #{initiatorId} AND deleted = 0 ORDER BY created_at DESC")
  List<OvertimeNotification> findByInitiatorId(Long initiatorId);
}
