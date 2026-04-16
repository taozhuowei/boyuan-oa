package com.oa.backend.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.oa.backend.entity.ProjectMilestone;
import com.oa.backend.mapper.ProjectMilestoneMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 营收管理 Controller（设计 §8.5）。
 * 数据复用 project_milestone 表的财务字段（contract_amount / receipt_status / actual_receipt_amount / receipt_date）。
 *
 * 权限（设计 §8.5）：
 *   - 财务：所有项目完整成本明细 + 营收收款状态
 *   - PM / CEO / 总经理：本项目营收汇总（PM 仅限本项目，已由 ProjectMember 校验）
 *
 * 路由：
 *   GET /projects/{id}/revenue                列出该项目里程碑（含合同金额 + 收款）
 *   PUT /projects/{id}/revenue/{milestoneId}  财务/CEO 更新收款状态与金额
 *   GET /projects/{id}/revenue/summary        汇总（合同合计 / 已收 / 待收）
 */
@RestController
@RequestMapping("/projects/{projectId}/revenue")
@RequiredArgsConstructor
public class ProjectRevenueController {

    private final ProjectMilestoneMapper milestoneMapper;

    @GetMapping
    @PreAuthorize("hasAnyRole('CEO','GENERAL_MANAGER','FINANCE','PROJECT_MANAGER')")
    public ResponseEntity<List<ProjectMilestone>> list(@PathVariable Long projectId) {
        return ResponseEntity.ok(milestoneMapper.selectList(
                new LambdaQueryWrapper<ProjectMilestone>()
                        .eq(ProjectMilestone::getProjectId, projectId)
                        .eq(ProjectMilestone::getDeleted, 0)
                        .orderByAsc(ProjectMilestone::getSort)));
    }

    @PutMapping("/{milestoneId}")
    @PreAuthorize("hasAnyRole('CEO','FINANCE')")
    public ResponseEntity<?> update(@PathVariable Long projectId,
                                    @PathVariable Long milestoneId,
                                    @RequestBody RevenueUpdateRequest req) {
        ProjectMilestone m = milestoneMapper.selectById(milestoneId);
        if (m == null || m.getDeleted() == 1 || !m.getProjectId().equals(projectId)) {
            return ResponseEntity.notFound().build();
        }
        if (req.contractAmount() != null) m.setContractAmount(req.contractAmount());
        if (req.receiptStatus() != null) m.setReceiptStatus(req.receiptStatus());
        if (req.actualReceiptAmount() != null) m.setActualReceiptAmount(req.actualReceiptAmount());
        if (req.receiptDate() != null) m.setReceiptDate(req.receiptDate());
        if (req.receiptRemark() != null) m.setReceiptRemark(req.receiptRemark());
        m.setUpdatedAt(LocalDateTime.now());
        milestoneMapper.updateById(m);
        return ResponseEntity.ok(m);
    }

    @GetMapping("/summary")
    @PreAuthorize("hasAnyRole('CEO','GENERAL_MANAGER','FINANCE','PROJECT_MANAGER')")
    public ResponseEntity<Map<String, Object>> summary(@PathVariable Long projectId) {
        List<ProjectMilestone> list = milestoneMapper.selectList(
                new LambdaQueryWrapper<ProjectMilestone>()
                        .eq(ProjectMilestone::getProjectId, projectId)
                        .eq(ProjectMilestone::getDeleted, 0));
        BigDecimal contractTotal = BigDecimal.ZERO, received = BigDecimal.ZERO;
        for (ProjectMilestone m : list) {
            if (m.getContractAmount() != null) contractTotal = contractTotal.add(m.getContractAmount());
            if ("RECEIVED".equals(m.getReceiptStatus()) && m.getActualReceiptAmount() != null) {
                received = received.add(m.getActualReceiptAmount());
            }
        }
        Map<String, Object> out = new HashMap<>();
        out.put("contractTotal", contractTotal);
        out.put("received", received);
        out.put("pending", contractTotal.subtract(received));
        return ResponseEntity.ok(out);
    }

    public record RevenueUpdateRequest(
            BigDecimal contractAmount, String receiptStatus,
            BigDecimal actualReceiptAmount, LocalDate receiptDate, String receiptRemark) {}
}
