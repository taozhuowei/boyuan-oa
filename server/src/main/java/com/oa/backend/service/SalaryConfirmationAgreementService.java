package com.oa.backend.service;

import com.oa.backend.entity.SalaryConfirmationAgreement;
import com.oa.backend.mapper.EmployeeMapper;
import com.oa.backend.mapper.SalaryConfirmationAgreementMapper;
import com.oa.backend.security.SecurityUtils;
import java.time.LocalDateTime;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 工资确认协议服务类。
 *
 * <p>负责协议版本的上传和当前生效版本的查询，封装 SalaryConfirmationAgreementMapper 和 EmployeeMapper 的调用。
 * 数据来源：salary_confirmation_agreement 表。
 */
@Service
@RequiredArgsConstructor
public class SalaryConfirmationAgreementService {

  private final SalaryConfirmationAgreementMapper agreementMapper;
  private final EmployeeMapper employeeMapper;

  /**
   * 上传新协议版本。
   *
   * <p>将现有所有协议置为非激活，再插入新协议记录并标记为激活。 整个操作在事务中执行，保证同一时刻只有一个激活版本。
   *
   * @param version 协议版本号
   * @param content 协议内容
   * @param uploadedBy 上传人员工 ID
   * @return 新创建的协议实体
   */
  @Transactional
  public SalaryConfirmationAgreement uploadNewVersion(
      String version, String content, Long uploadedBy) {
    agreementMapper.deactivateAll();

    SalaryConfirmationAgreement agreement = new SalaryConfirmationAgreement();
    agreement.setVersion(version);
    agreement.setContent(content);
    agreement.setIsActive(true);
    agreement.setUploadedBy(uploadedBy);
    agreement.setCreatedAt(LocalDateTime.now());
    agreement.setUpdatedAt(LocalDateTime.now());

    agreementMapper.insert(agreement);
    return agreement;
  }

  /**
   * 查询当前生效的协议。
   *
   * @return 当前激活的协议实体，不存在时返回 null
   */
  public SalaryConfirmationAgreement findCurrentAgreement() {
    return agreementMapper.findActive();
  }

  /**
   * 从用户名解析对应员工的 ID。
   *
   * @param username 登录用户名
   * @return 员工 ID，解析失败时返回 null
   */
  public Long resolveEmployeeIdByUsername(String username) {
    return SecurityUtils.getEmployeeIdFromUsername(username, employeeMapper);
  }
}
