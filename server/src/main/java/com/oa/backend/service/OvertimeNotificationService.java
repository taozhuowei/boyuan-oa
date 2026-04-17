package com.oa.backend.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.oa.backend.entity.Employee;
import com.oa.backend.entity.OvertimeNotification;
import com.oa.backend.entity.OvertimeResponse;
import com.oa.backend.mapper.EmployeeMapper;
import com.oa.backend.mapper.OvertimeNotificationMapper;
import com.oa.backend.mapper.OvertimeResponseMapper;
import com.oa.backend.security.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * 加班通知服务类。
 * <p>
 * 负责加班通知的创建、查询和员工响应操作，封装 OvertimeNotificationMapper、
 * OvertimeResponseMapper 和 EmployeeMapper 的调用。
 * 数据来源：overtime_notification 表、overtime_response 表。
 * <p>
 * 注意：本服务与 NotificationService 相互独立——NotificationService 处理系统站内信，
 * 本服务处理业务层加班通知及员工响应记录。
 */
@Service
@RequiredArgsConstructor
public class OvertimeNotificationService {

    private final OvertimeNotificationMapper notificationMapper;
    private final OvertimeResponseMapper responseMapper;
    private final EmployeeMapper employeeMapper;

    /**
     * 插入新的加班通知记录。
     *
     * @param notification 加班通知实体（已填充所有字段）
     */
    public void saveNotification(OvertimeNotification notification) {
        notificationMapper.insert(notification);
    }

    /**
     * 查询所有未删除的加班通知，按创建时间降序排列。
     *
     * @return 通知列表
     */
    public List<OvertimeNotification> listAllNotifications() {
        return notificationMapper.selectList(
                new LambdaQueryWrapper<OvertimeNotification>()
                        .eq(OvertimeNotification::getDeleted, 0)
                        .orderByDesc(OvertimeNotification::getCreatedAt)
        );
    }

    /**
     * 查询指定发起人发起的所有通知。
     *
     * @param initiatorId 发起人员工 ID
     * @return 通知列表
     */
    public List<OvertimeNotification> listNotificationsByInitiator(Long initiatorId) {
        return notificationMapper.findByInitiatorId(initiatorId);
    }

    /**
     * 根据 ID 查询加班通知（包括已删除记录，由调用方判断删除状态）。
     *
     * @param id 通知 ID
     * @return 通知实体，不存在时返回 null
     */
    public OvertimeNotification findNotificationById(Long id) {
        return notificationMapper.selectById(id);
    }

    /**
     * 查询指定通知中特定员工的响应记录。
     *
     * @param notificationId 通知 ID
     * @param employeeId     员工 ID
     * @return 响应记录，不存在时返回 null
     */
    public OvertimeResponse findResponse(Long notificationId, Long employeeId) {
        return responseMapper.findByNotificationAndEmployee(notificationId, employeeId);
    }

    /**
     * 查询指定通知下的所有员工响应记录。
     *
     * @param notificationId 通知 ID
     * @return 响应列表
     */
    public List<OvertimeResponse> listResponsesByNotification(Long notificationId) {
        return responseMapper.findByNotificationId(notificationId);
    }

    /**
     * 更新现有响应记录。
     *
     * @param response 已修改的响应实体
     */
    public void updateResponse(OvertimeResponse response) {
        responseMapper.updateById(response);
    }

    /**
     * 插入新的员工响应记录。
     *
     * @param response 响应实体（已填充所有字段）
     */
    public void saveResponse(OvertimeResponse response) {
        responseMapper.insert(response);
    }

    /**
     * 从认证信息中解析当前登录的员工实体。
     *
     * @param authentication Spring Security 认证对象
     * @return 员工实体，解析失败时返回 null
     */
    public Employee resolveEmployee(Authentication authentication) {
        if (authentication == null) return null;
        return SecurityUtils.getEmployeeFromUsername(authentication.getName(), employeeMapper);
    }
}
