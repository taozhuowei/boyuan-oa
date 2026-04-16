package com.oa.backend.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.oa.backend.entity.ApprovalFlowDef;
import com.oa.backend.entity.ApprovalFlowNode;
import com.oa.backend.mapper.ApprovalFlowDefMapper;
import com.oa.backend.mapper.ApprovalFlowNodeMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/**
 * 审批流配置控制器
 * 提供审批流定义的查询与更新接口，仅 CEO 可操作（系统配置权限）。
 */
@RestController
@RequestMapping("/approval/flows")
@RequiredArgsConstructor
public class ApprovalFlowController {

    private final ApprovalFlowDefMapper approvalFlowDefMapper;
    private final ApprovalFlowNodeMapper approvalFlowNodeMapper;

    /**
     * 获取所有审批流定义及其节点列表
     * 权限：CEO
     */
    @GetMapping
    @PreAuthorize("hasRole('CEO')")
    public ResponseEntity<List<FlowWithNodes>> listFlows() {
        List<ApprovalFlowDef> defs = approvalFlowDefMapper.selectList(
                new LambdaQueryWrapper<ApprovalFlowDef>().eq(ApprovalFlowDef::getDeleted, 0));
        List<FlowWithNodes> result = defs.stream().map(def -> {
            List<ApprovalFlowNode> nodes = approvalFlowNodeMapper.findByFlowId(def.getId());
            return new FlowWithNodes(def, nodes);
        }).toList();
        return ResponseEntity.ok(result);
    }

    /**
     * 获取指定业务类型的审批流定义（含节点）
     * 权限：CEO
     */
    @GetMapping("/{businessType}")
    @PreAuthorize("hasRole('CEO')")
    public ResponseEntity<FlowWithNodes> getFlow(@PathVariable String businessType) {
        ApprovalFlowDef def = approvalFlowDefMapper.findActiveByBusinessType(businessType.toUpperCase());
        if (def == null) {
            return ResponseEntity.notFound().build();
        }
        List<ApprovalFlowNode> nodes = approvalFlowNodeMapper.findByFlowId(def.getId());
        return ResponseEntity.ok(new FlowWithNodes(def, nodes));
    }

    /**
     * 更新指定业务类型的审批流节点配置
     * 操作：软删除旧节点，创建新节点列表（全量替换策略）
     * 权限：CEO
     */
    @PutMapping("/{businessType}")
    @PreAuthorize("hasRole('CEO')")
    @com.oa.backend.annotation.OperationLogRecord(action = "APPROVAL_FLOW_UPDATE", targetType = "APPROVAL_FLOW")
    public ResponseEntity<FlowWithNodes> updateFlow(
            @PathVariable String businessType,
            @RequestBody UpdateFlowRequest request) {

        ApprovalFlowDef def = approvalFlowDefMapper.findActiveByBusinessType(businessType.toUpperCase());
        if (def == null) {
            return ResponseEntity.notFound().build();
        }

        // Soft-delete existing nodes for this flow
        List<ApprovalFlowNode> existing = approvalFlowNodeMapper.findByFlowId(def.getId());
        for (ApprovalFlowNode node : existing) {
            node.setDeleted(1);
            node.setUpdatedAt(LocalDateTime.now());
            approvalFlowNodeMapper.updateById(node);
        }

        // Insert new nodes
        int order = 1;
        for (NodeSpec spec : request.nodes()) {
            ApprovalFlowNode node = new ApprovalFlowNode();
            node.setFlowId(def.getId());
            node.setNodeOrder(order++);
            node.setNodeName(spec.nodeName());
            node.setApprovalMode("SEQUENTIAL");
            node.setApproverType(spec.approverType());
            node.setApproverRef(spec.approverRef());
            node.setSkipCondition(spec.skipCondition());
            node.setCreatedAt(LocalDateTime.now());
            node.setUpdatedAt(LocalDateTime.now());
            node.setDeleted(0);
            approvalFlowNodeMapper.insert(node);
        }

        // Return updated state
        List<ApprovalFlowNode> updated = approvalFlowNodeMapper.findByFlowId(def.getId());
        return ResponseEntity.ok(new FlowWithNodes(def, updated));
    }

    // ── Response / Request types ────────────────────────────────────────────

    public record FlowWithNodes(ApprovalFlowDef flow, List<ApprovalFlowNode> nodes) {}

    public record UpdateFlowRequest(List<NodeSpec> nodes) {}

    public record NodeSpec(
            String nodeName,
            String approverType,   // DIRECT_SUPERVISOR | ROLE | DESIGNATED
            String approverRef,    // role code or employee id
            String skipCondition   // nullable JSON
    ) {}
}
