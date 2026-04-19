package com.oa.backend.event;

import com.oa.backend.entity.RetentionPolicy;
import java.time.LocalDate;
import lombok.Getter;
import org.springframework.context.ApplicationEvent;

/**
 * 数据保留期限到期事件。
 *
 * <p>当数据即将到达保留期限时触发此事件，用于通知相关模块处理。 事件包含关联的保留策略和预计删除日期。
 *
 * @author OA Backend Team
 * @since 1.0
 */
@Getter
public class RetentionExpiredEvent extends ApplicationEvent {

  /** 关联的保留策略 */
  private final RetentionPolicy policy;

  /** 预计删除日期 */
  private final LocalDate expectedDeleteDate;

  /** 数据类型 */
  private final String dataType;

  /**
   * 创建保留期限到期事件。
   *
   * @param source 事件源
   * @param policy 关联的保留策略
   * @param expectedDeleteDate 预计删除日期
   * @param dataType 数据类型
   */
  public RetentionExpiredEvent(
      Object source, RetentionPolicy policy, LocalDate expectedDeleteDate, String dataType) {
    super(source);
    this.policy = policy;
    this.expectedDeleteDate = expectedDeleteDate;
    this.dataType = dataType;
  }
}
