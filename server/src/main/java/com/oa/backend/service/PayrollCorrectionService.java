package com.oa.backend.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.oa.backend.entity.FormRecord;
import com.oa.backend.entity.PayrollAdjustment;
import com.oa.backend.entity.PayrollSlip;
import com.oa.backend.entity.PayrollSlipItem;
import com.oa.backend.mapper.ApprovalFlowDefMapper;
import com.oa.backend.mapper.FormRecordMapper;
import com.oa.backend.mapper.PayrollAdjustmentMapper;
import com.oa.backend.mapper.PayrollSlipItemMapper;
import com.oa.backend.mapper.PayrollSlipMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 薪资更正服务。
 *
 * 流程：
 *   1. Finance 调用 createCorrection() → 写 payroll_adjustment (status=PENDING)，
 *      并通过 ApprovalFlowService 启动 PAYROLL_CORRECTION 审批流；
 *   2. CEO 在 /todo 审批通过 → form_record.status=APPROVED；
 *   3. 后续 syncFromApprovalForms() 检测到关联 form 已 APPROVED 但 applied=false 的调整，
 *      将原 slip 标记 SUPERSEDED，按更正项 + 原始项创建新 slip（version+1，status=PUBLISHED）；
 *   4. CEO 驳回 → status=REJECTED，原 slip 不变。
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class PayrollCorrectionService {

    public static final String FORM_TYPE = "PAYROLL_CORRECTION";

    private final PayrollAdjustmentMapper adjustmentMapper;
    private final PayrollSlipMapper slipMapper;
    private final PayrollSlipItemMapper slipItemMapper;
    private final FormRecordMapper formRecordMapper;
    private final ApprovalFlowDefMapper approvalFlowDefMapper;
    private final ObjectMapper objectMapper;
    private final ApprovalFlowService approvalFlowService;

    /**
     * Finance 发起更正。
     *
     * @param slipId      原工资条 ID（必须为 PUBLISHED 或 CONFIRMED）
     * @param reason      更正原因（必填）
     * @param corrections 更正项列表，每项 { itemDefId, amount, remark } —— 仅包含改动条目
     * @param financeId   发起人员工 ID
     */
    @Transactional
    public PayrollAdjustment createCorrection(Long slipId, String reason,
                                              List<CorrectionItem> corrections, Long financeId) {
        PayrollSlip slip = slipMapper.selectById(slipId);
        if (slip == null || slip.getDeleted() == 1) {
            throw new IllegalStateException("工资条不存在");
        }
        if ("SUPERSEDED".equals(slip.getStatus())) {
            throw new IllegalStateException("工资条已被更正版本替代，无法再次发起更正");
        }
        if (reason == null || reason.isBlank()) {
            throw new IllegalStateException("更正原因不能为空");
        }
        if (corrections == null || corrections.isEmpty()) {
            throw new IllegalStateException("至少需要一项更正条目");
        }

        // 1. 创建 form_record + 启动审批流
        if (approvalFlowDefMapper.findActiveByBusinessType(FORM_TYPE) == null) {
            throw new IllegalStateException("未找到 PAYROLL_CORRECTION 审批流定义，请联系管理员");
        }
        FormRecord form = new FormRecord();
        form.setFormType(FORM_TYPE);
        form.setSubmitterId(financeId);
        form.setFormData(buildFormData(slip, reason, corrections));
        form.setStatus("PENDING");
        form.setCurrentNodeOrder(0);
        form.setRemark("更正薪资条 #" + slipId);
        form.setCreatedAt(LocalDateTime.now());
        form.setUpdatedAt(LocalDateTime.now());
        form.setDeleted(0);
        formRecordMapper.insert(form);
        approvalFlowService.initFlow(form.getId(), FORM_TYPE, financeId);

        // 2. 写 payroll_adjustment
        PayrollAdjustment adj = new PayrollAdjustment();
        adj.setCycleId(slip.getCycleId());
        adj.setEmployeeId(slip.getEmployeeId());
        adj.setInitiatorId(financeId);
        adj.setReason(reason);
        adj.setStatus("PENDING");
        adj.setSlipId(slipId);
        adj.setFormId(form.getId());
        adj.setApplied(false);
        try {
            adj.setCorrectionsJson(objectMapper.writeValueAsString(corrections));
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("更正项序列化失败", e);
        }
        adj.setCreatedAt(LocalDateTime.now());
        adj.setUpdatedAt(LocalDateTime.now());
        adjustmentMapper.insert(adj);
        log.info("薪资更正已发起: adjustmentId={}, slipId={}, formId={}", adj.getId(), slipId, form.getId());
        return adj;
    }

    /**
     * 同步所有"已审批通过但未应用"的更正：将原 slip 置 SUPERSEDED，生成 version+1 的新 slip。
     * 由 GET /payroll/corrections 等读路径触发，确保眼下数据反映最新审批状态。
     */
    @Transactional
    public int syncFromApprovalForms() {
        List<PayrollAdjustment> pending = adjustmentMapper.selectList(
                new LambdaQueryWrapper<PayrollAdjustment>()
                        .eq(PayrollAdjustment::getStatus, "PENDING")
                        .isNotNull(PayrollAdjustment::getFormId)
                        .eq(PayrollAdjustment::getDeleted, 0)
        );
        int changed = 0;
        for (PayrollAdjustment adj : pending) {
            FormRecord form = formRecordMapper.selectById(adj.getFormId());
            if (form == null) continue;
            if ("APPROVED".equals(form.getStatus()) && !Boolean.TRUE.equals(adj.getApplied())) {
                applyCorrection(adj);
                changed++;
            } else if ("REJECTED".equals(form.getStatus())) {
                adj.setStatus("REJECTED");
                adj.setUpdatedAt(LocalDateTime.now());
                adjustmentMapper.updateById(adj);
                changed++;
            }
        }
        return changed;
    }

    /**
     * 实际应用更正：原 slip → SUPERSEDED；新 slip 写入 PUBLISHED，version+1。
     * 新 slip 的明细在原明细基础上按 corrections 替换金额（按 item_def_id 匹配）。
     */
    @Transactional
    public void applyCorrection(PayrollAdjustment adj) {
        PayrollSlip oldSlip = slipMapper.selectById(adj.getSlipId());
        if (oldSlip == null || oldSlip.getDeleted() == 1) {
            log.warn("应用更正失败：原 slip 不存在 adjId={}", adj.getId());
            return;
        }

        // 1. 解析更正项（itemDefId → 新金额/备注）
        List<CorrectionItem> corrections;
        try {
            corrections = objectMapper.readValue(
                    adj.getCorrectionsJson(),
                    new TypeReference<List<CorrectionItem>>() {});
        } catch (Exception e) {
            log.error("更正项 JSON 解析失败 adjId={}", adj.getId(), e);
            return;
        }
        Map<Long, CorrectionItem> byDef = new HashMap<>();
        for (CorrectionItem c : corrections) {
            if (c.itemDefId() != null) byDef.put(c.itemDefId(), c);
        }

        // 2. 原 slip → SUPERSEDED
        oldSlip.setStatus("SUPERSEDED");
        oldSlip.setUpdatedAt(LocalDateTime.now());
        slipMapper.updateById(oldSlip);

        // 3. 创建新 slip
        PayrollSlip newSlip = new PayrollSlip();
        newSlip.setCycleId(oldSlip.getCycleId());
        newSlip.setEmployeeId(oldSlip.getEmployeeId());
        newSlip.setVersion((oldSlip.getVersion() == null ? 1 : oldSlip.getVersion()) + 1);
        newSlip.setStatus("PUBLISHED");
        newSlip.setCreatedAt(LocalDateTime.now());
        newSlip.setUpdatedAt(LocalDateTime.now());
        newSlip.setDeleted(0);
        slipMapper.insert(newSlip);

        // 4. 复制原明细 + 套用更正
        BigDecimal netPay = BigDecimal.ZERO;
        List<PayrollSlipItem> oldItems = slipItemMapper.findBySlipId(oldSlip.getId());
        for (PayrollSlipItem oldItem : oldItems) {
            BigDecimal amount = oldItem.getAmount();
            String remark = oldItem.getRemark();
            CorrectionItem c = byDef.get(oldItem.getItemDefId());
            if (c != null) {
                if (c.amount() != null) amount = c.amount();
                if (c.remark() != null && !c.remark().isBlank()) remark = c.remark();
            }
            PayrollSlipItem newItem = new PayrollSlipItem();
            newItem.setSlipId(newSlip.getId());
            newItem.setItemDefId(oldItem.getItemDefId());
            newItem.setAmount(amount);
            newItem.setRemark(remark);
            newItem.setCreatedAt(LocalDateTime.now());
            newItem.setUpdatedAt(LocalDateTime.now());
            slipItemMapper.insert(newItem);
            netPay = netPay.add(amount);
        }
        netPay = netPay.max(BigDecimal.ZERO);
        newSlip.setNetPay(netPay);
        newSlip.setUpdatedAt(LocalDateTime.now());
        slipMapper.updateById(newSlip);

        // 5. 标记调整已应用
        adj.setStatus("APPROVED");
        adj.setNewSlipId(newSlip.getId());
        adj.setApplied(true);
        adj.setUpdatedAt(LocalDateTime.now());
        adjustmentMapper.updateById(adj);

        log.info("薪资更正已应用: adjId={}, oldSlipId={}, newSlipId={}, version={}",
                adj.getId(), oldSlip.getId(), newSlip.getId(), newSlip.getVersion());
    }

    /**
     * 列出指定周期/员工的更正记录（不限状态）。先 sync 一次。
     */
    public List<PayrollAdjustment> list(Long cycleId, Long employeeId) {
        syncFromApprovalForms();
        LambdaQueryWrapper<PayrollAdjustment> q = new LambdaQueryWrapper<PayrollAdjustment>()
                .eq(PayrollAdjustment::getDeleted, 0)
                .orderByDesc(PayrollAdjustment::getCreatedAt);
        if (cycleId != null) q.eq(PayrollAdjustment::getCycleId, cycleId);
        if (employeeId != null) q.eq(PayrollAdjustment::getEmployeeId, employeeId);
        return adjustmentMapper.selectList(q);
    }

    // ── Helpers ───────────────────────────────────────────────────────

    private String buildFormData(PayrollSlip slip, String reason, List<CorrectionItem> corrections) {
        Map<String, Object> m = new HashMap<>();
        m.put("slipId", slip.getId());
        m.put("cycleId", slip.getCycleId());
        m.put("employeeId", slip.getEmployeeId());
        m.put("originalNetPay", slip.getNetPay());
        m.put("reason", reason);
        m.put("corrections", corrections);
        try {
            return objectMapper.writeValueAsString(m);
        } catch (JsonProcessingException e) {
            return "{}";
        }
    }

    /** 单条更正项 */
    public record CorrectionItem(Long itemDefId, BigDecimal amount, String remark) {}
}
