package com.oa.backend.event;

import lombok.Getter;
import org.springframework.context.ApplicationEvent;

import java.util.List;

/**
 * 审批节点变更事件。
 * <p>
 * 当表单审批流程进入新节点时发布此事件，用于通知相关审批人。
 * 事件包含表单记录 ID、新节点名称和需要接收通知的用户 ID 列表。
 *
 * @author OA Backend Team
 * @since 1.0
 */
@Getter
public class ApprovalNodeChangedEvent extends ApplicationEvent {

    /** 表单记录 ID */
    private final Long formRecordId;

    /** 新节点名称 */
    private final String newNodeName;

    /** 接收通知的用户 ID 列表 */
    private final List<Long> recipientIds;

    /**
     * 创建审批节点变更事件。
     *
     * @param source       事件源对象
     * @param formRecordId 表单记录 ID
     * @param newNodeName  新节点名称
     * @param recipientIds 接收通知的用户 ID 列表
     */
    public ApprovalNodeChangedEvent(Object source, Long formRecordId,
                                    String newNodeName, List<Long> recipientIds) {
        super(source);
        this.formRecordId = formRecordId;
        this.newNodeName = newNodeName;
        this.recipientIds = recipientIds;
    }
}
