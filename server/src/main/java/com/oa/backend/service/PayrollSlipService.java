package com.oa.backend.service;

import com.oa.backend.entity.PayrollItemDef;
import com.oa.backend.entity.PayrollSlip;
import com.oa.backend.entity.PayrollSlipItem;
import com.oa.backend.mapper.EmployeeMapper;
import com.oa.backend.mapper.PayrollItemDefMapper;
import com.oa.backend.mapper.PayrollSlipItemMapper;
import com.oa.backend.mapper.PayrollSlipMapper;
import com.oa.backend.security.SecurityUtils;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;

/**
 * 工资条服务
 *
 * <p>职责：工资条（payroll_slip）的查询、状态变更（DISPUTED），
 * 以及工资条明细（payroll_slip_item）与项目定义（payroll_item_def）的读取与富化。
 *
 * <p>注意：工资条的确认（电子签名）由 {@link SignatureService} 负责； 本服务仅处理 PayrollController 中直接操作三个 Mapper 的剩余逻辑。
 *
 * <p>数据来源：payroll_slip、payroll_slip_item、payroll_item_def、employee 表。 调用方：PayrollController。
 */
@Service
@RequiredArgsConstructor
public class PayrollSlipService {

  private final PayrollSlipMapper slipMapper;
  private final PayrollSlipItemMapper slipItemMapper;
  private final PayrollItemDefMapper itemDefMapper;
  private final EmployeeMapper employeeMapper;

  /**
   * 按周期 ID 查询所有工资条（Finance/CEO 视角）。
   *
   * @param cycleId 周期 ID
   * @return 工资条列表
   */
  public List<PayrollSlip> listByCycleId(Long cycleId) {
    return slipMapper.findByCycleId(cycleId);
  }

  /**
   * 查询全部工资条（Finance/CEO 无周期过滤，用于更正选单等场景）。
   *
   * @return 所有工资条
   */
  public List<PayrollSlip> listAll() {
    return slipMapper.selectList(null);
  }

  /**
   * 按员工 ID 查询该员工的所有工资条（Employee/Worker 自查）。
   *
   * @param employeeId 员工 ID
   * @return 工资条列表
   */
  public List<PayrollSlip> listByEmployeeId(Long employeeId) {
    return slipMapper.findByEmployeeId(employeeId);
  }

  /**
   * 查询工资条（含存在/删除校验）。
   *
   * @param id 工资条 ID
   * @return 工资条，不存在或已删除返回 null
   */
  public PayrollSlip findById(Long id) {
    PayrollSlip slip = slipMapper.selectById(id);
    if (slip == null || slip.getDeleted() == 1) return null;
    return slip;
  }

  /**
   * 查询工资条明细（含项目定义名称和类型富化）。
   *
   * @param slipId 工资条 ID
   * @return 富化后的明细列表，每项含 id/itemDefId/name/type/amount/remark
   */
  public List<Map<String, Object>> listEnrichedItems(Long slipId) {
    List<PayrollSlipItem> items = slipItemMapper.findBySlipId(slipId);
    return items.stream()
        .map(
            item -> {
              PayrollItemDef def = itemDefMapper.selectById(item.getItemDefId());
              return Map.<String, Object>of(
                  "id",
                  item.getId(),
                  "itemDefId",
                  item.getItemDefId(),
                  "name",
                  def != null ? def.getName() : "未知",
                  "type",
                  def != null ? def.getType() : "",
                  "amount",
                  item.getAmount(),
                  "remark",
                  item.getRemark() != null ? item.getRemark() : "");
            })
        .toList();
  }

  /**
   * 将工资条状态置为 DISPUTED（员工提出异议）。 前置条件：工资条必须处于 PUBLISHED 状态。
   *
   * @param slip 工资条实体（已校验归属权）
   * @return 更新后的工资条，状态不符时返回 null
   */
  public PayrollSlip dispute(PayrollSlip slip) {
    if (!"PUBLISHED".equals(slip.getStatus())) return null;
    slip.setStatus("DISPUTED");
    slip.setUpdatedAt(LocalDateTime.now());
    slipMapper.updateById(slip);
    return slip;
  }

  /**
   * 获取属于当前登录员工的工资条，不属于则返回 null。 用于 confirm/dispute 前的权限校验。
   *
   * @param slipId 工资条 ID
   * @param authentication 当前用户认证信息
   * @return 工资条，不存在/已删除/不属于当前用户均返回 null
   */
  public PayrollSlip getOwnSlip(Long slipId, Authentication authentication) {
    PayrollSlip slip = slipMapper.selectById(slipId);
    if (slip == null || slip.getDeleted() == 1) return null;

    Long employeeId =
        SecurityUtils.getEmployeeIdFromUsername(authentication.getName(), employeeMapper);
    if (employeeId == null || !slip.getEmployeeId().equals(employeeId)) return null;

    return slip;
  }

  /**
   * 根据用户名解析当前员工 ID（SecurityUtils 的 EmployeeMapper 依赖入口）。
   *
   * @param username 登录用户名（employee_no）
   * @return 员工 ID，查询失败返回 null
   */
  public Long resolveEmployeeId(String username) {
    return SecurityUtils.getEmployeeIdFromUsername(username, employeeMapper);
  }
}
