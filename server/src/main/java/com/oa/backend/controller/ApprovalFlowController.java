package com.oa.backend.controller;

import com.oa.backend.entity.ApprovalFlowDef;
import com.oa.backend.entity.ApprovalFlowNode;
import com.oa.backend.service.ApprovalFlowService;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

/** 审批流配置控制器 提供审批流定义的查询与更新接口，仅 CEO 可操作（系统配置权限）。 底层 Mapper 操作均委托给 ApprovalFlowService。 */
@RestController
@RequestMapping("/approval/flows")
@RequiredArgsConstructor
public class ApprovalFlowController {

  private final ApprovalFlowService approvalFlowService;

  /** 获取所有审批流定义及其节点列表 权限：CEO */
  @GetMapping
  @PreAuthorize("hasRole('CEO')")
  public ResponseEntity<List<FlowWithNodes>> listFlows() {
    List<ApprovalFlowDef> defs = approvalFlowService.listFlowDefs();
    List<FlowWithNodes> result =
        defs.stream()
            .map(
                def -> {
                  List<ApprovalFlowNode> nodes = approvalFlowService.listNodesByFlowId(def.getId());
                  return new FlowWithNodes(def, nodes);
                })
            .toList();
    return ResponseEntity.ok(result);
  }

  /** 获取指定业务类型的审批流定义（含节点） 权限：CEO */
  @GetMapping("/{businessType}")
  @PreAuthorize("hasRole('CEO')")
  public ResponseEntity<FlowWithNodes> getFlow(@PathVariable String businessType) {
    ApprovalFlowDef def =
        approvalFlowService.findActiveFlowDefByBusinessType(businessType.toUpperCase());
    if (def == null) {
      return ResponseEntity.notFound().build();
    }
    List<ApprovalFlowNode> nodes = approvalFlowService.listNodesByFlowId(def.getId());
    return ResponseEntity.ok(new FlowWithNodes(def, nodes));
  }

  /** 更新指定业务类型的审批流节点配置 操作：软删除旧节点，创建新节点列表（全量替换策略） 权限：CEO */
  @PutMapping("/{businessType}")
  @PreAuthorize("hasRole('CEO')")
  @com.oa.backend.annotation.OperationLogRecord(
      action = "APPROVAL_FLOW_UPDATE",
      targetType = "APPROVAL_FLOW")
  public ResponseEntity<FlowWithNodes> updateFlow(
      @PathVariable String businessType, @RequestBody UpdateFlowRequest request) {

    ApprovalFlowDef def =
        approvalFlowService.findActiveFlowDefByBusinessType(businessType.toUpperCase());
    if (def == null) {
      return ResponseEntity.notFound().build();
    }

    // Convert controller request records to service spec records
    List<ApprovalFlowService.ApprovalFlowNodeSpec> specs =
        request.nodes().stream()
            .map(
                n ->
                    new ApprovalFlowService.ApprovalFlowNodeSpec(
                        n.nodeName(), n.approverType(), n.approverRef(), n.skipCondition()))
            .toList();

    List<ApprovalFlowNode> updated = approvalFlowService.replaceFlowNodes(def.getId(), specs);
    return ResponseEntity.ok(new FlowWithNodes(def, updated));
  }

  // ── Response / Request types ────────────────────────────────────────────

  public record FlowWithNodes(ApprovalFlowDef flow, List<ApprovalFlowNode> nodes) {}

  public record UpdateFlowRequest(List<NodeSpec> nodes) {}

  public record NodeSpec(
      String nodeName,
      String approverType, // DIRECT_SUPERVISOR | ROLE | DESIGNATED
      String approverRef, // role code or employee id
      String skipCondition // nullable JSON
      ) {}
}
