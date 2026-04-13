package com.oa.backend.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.oa.backend.entity.Notification;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;
import org.apache.ibatis.annotations.Update;

import java.util.List;

/**
 * 通知数据访问层接口，操作 notification 表。
 * <p>
 * 提供通知的基础 CRUD 操作以及收件人相关的查询、统计和状态更新功能。
 *
 * @author OA Backend Team
 * @since 1.0
 */
@Mapper
public interface NotificationMapper extends BaseMapper<Notification> {

    /**
     * 根据接收人 ID 分页查询通知列表，按创建时间降序排列（最新的在前）。
     *
     * @param recipientId 接收人 ID
     * @param offset      偏移量
     * @param limit       每页数量
     * @return 通知列表
     */
    @Select("SELECT * FROM notification WHERE recipient_id = #{recipientId} AND deleted = 0 ORDER BY created_at DESC LIMIT #{limit} OFFSET #{offset}")
    List<Notification> findByRecipientId(@Param("recipientId") Long recipientId,
                                          @Param("offset") int offset,
                                          @Param("limit") int limit);

    /**
     * 统计指定接收人的未读通知数量。
     *
     * @param recipientId 接收人 ID
     * @return 未读通知数量
     */
    @Select("SELECT COUNT(*) FROM notification WHERE recipient_id = #{recipientId} AND is_read = FALSE AND deleted = 0")
    int countUnread(@Param("recipientId") Long recipientId);

    /**
     * 将指定接收人的所有未读通知标记为已读。
     *
     * @param recipientId 接收人 ID
     * @return 更新的记录数
     */
    @Update("UPDATE notification SET is_read = TRUE, updated_at = CURRENT_TIMESTAMP WHERE recipient_id = #{recipientId} AND is_read = FALSE AND deleted = 0")
    int markAllReadByRecipient(@Param("recipientId") Long recipientId);

    /**
     * 删除指定接收人的所有已读通知（逻辑删除）。
     *
     * @param recipientId 接收人 ID
     * @return 更新的记录数
     */
    @Update("UPDATE notification SET deleted = 1, updated_at = CURRENT_TIMESTAMP WHERE recipient_id = #{recipientId} AND is_read = TRUE AND deleted = 0")
    int deleteReadByRecipient(@Param("recipientId") Long recipientId);
}
