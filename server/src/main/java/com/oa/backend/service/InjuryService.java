package com.oa.backend.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.oa.backend.entity.FormRecord;
import com.oa.backend.entity.InjuryClaim;
import com.oa.backend.mapper.FormRecordMapper;
import com.oa.backend.mapper.InjuryClaimMapper;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

/**
 * 工伤理赔服务类。
 *
 * <p>负责工伤理赔记录的查询和录入，封装 InjuryClaimMapper 和 FormRecordMapper 的调用。 数据来源：injury_claim 表（关联
 * form_record.id）。
 */
@Service
@RequiredArgsConstructor
public class InjuryService {

  private final InjuryClaimMapper injuryClaimMapper;
  private final FormRecordMapper formRecordMapper;

  /**
   * 查询所有未删除的工伤理赔记录，按创建时间降序排列。
   *
   * @return 工伤理赔记录列表
   */
  public List<InjuryClaim> listAllClaims() {
    return injuryClaimMapper.selectList(
        new LambdaQueryWrapper<InjuryClaim>()
            .eq(InjuryClaim::getDeleted, 0)
            .orderByDesc(InjuryClaim::getCreatedAt));
  }

  /**
   * 插入新的工伤理赔记录。
   *
   * @param claim 工伤理赔实体（已填充所有字段）
   */
  public void saveClaim(InjuryClaim claim) {
    injuryClaimMapper.insert(claim);
  }

  /**
   * 根据表单记录 ID 推断员工 ID。
   *
   * <p>当理赔请求未显式传入 employeeId 时，从 form_record 表中读取申请人（submitter_id）。 若 formRecordId 为 null
   * 或对应记录不存在，返回 null。
   *
   * @param formRecordId 关联的表单记录 ID
   * @return 员工 ID，找不到时返回 null
   */
  public Long resolveEmployeeIdFromFormRecord(Long formRecordId) {
    if (formRecordId == null) {
      return null;
    }
    FormRecord fr = formRecordMapper.selectById(formRecordId);
    return fr != null ? fr.getSubmitterId() : null;
  }
}
