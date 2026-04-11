package com.oa.backend.service;

import com.oa.backend.annotation.OperationLogRecord;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.oa.backend.dto.FormRecordResponse;
import com.oa.backend.entity.*;
import com.oa.backend.mapper.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * 审批流服务类
 * 负责处理表单审批流程的初始化、流转和查询
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ApprovalFlowService {

    private final FormRecordMapper formRecordMapper;
    private final ApprovalFlowDefMapper approvalFlowDefMapper;
    private final ApprovalFlowNodeMapper approvalFlowNodeMapper;
    private final ApprovalRecordMapper approvalRecordMapper;
    private final EmployeeMapper employeeMapper;
    private final DepartmentMapper departmentMapper;
    private final OperationLogMapper operationLogMapper;
    private final ObjectMapper objectMapper;
    private final NotificationService notificationService;

    /**
     * 初始化审批流
     * 加载激活的流程定义，评估 skipCondition，设置第一个有效节点，设置表单状态为 PENDING
     */
    @Transactional
    public void initFlow(Long formRecordId, String formType, Long submitterId) {
        // 查找激活的审批流定义
        ApprovalFlowDef flowDef = approvalFlowDefMapper.findActiveByBusinessType(formType);
        if (flowDef == null) {
            throw new IllegalStateException("未找到业务类型 [" + formType + "] 的激活审批流定义");
        }

        // 获取流程所有节点（按 nodeOrder 升序）
        List<ApprovalFlowNode> nodes = approvalFlowNodeMapper.findByFlowId(flowDef.getId());
        if (nodes.isEmpty()) {
            throw new IllegalStateException("审批流定义 [" + flowDef.getId() + "] 没有配置节点");
        }

        // 更新表单状态
        FormRecord formRecord = formRecordMapper.selectById(formRecordId);
        if (formRecord == null) {
            throw new IllegalStateException("表单记录 [" + formRecordId + "] 不存在");
        }

        // 获取提交人角色，用于 skipCondition 评估
        String submitterRole = resolveSubmitterRole(submitterId);

        // 从第一个节点开始，跳过满足 skipCondition 的节点
        ApprovalFlowNode startNode = null;
        for (ApprovalFlowNode node : nodes) {
            if (!evaluateSkipCondition(node.getSkipCondition(), submitterRole)) {
                startNode = node;
                break;
            }
            // 满足 skipCondition，写入 SKIPPED 审批记录
            ApprovalRecord skipped = new ApprovalRecord();
            skipped.setFormId(formRecordId);
            skipped.setNodeOrder(node.getNodeOrder());
            skipped.setApproverId(null);
            skipped.setAction("SKIP");
            skipped.setComment("submitter role matched skipCondition: " + node.getSkipCondition());
            skipped.setActedAt(LocalDateTime.now());
            approvalRecordMapper.insert(skipped);
            log.info("节点已跳过(skipCondition): formId={}, nodeOrder={}", formRecordId, node.getNodeOrder());
        }

        if (startNode == null) {
            // 所有节点均被跳过 → 直接归档
            formRecord.setStatus("APPROVED");
            formRecord.setCurrentNodeOrder(0);
        } else {
            formRecord.setStatus("PENDING");
            formRecord.setCurrentNodeOrder(startNode.getNodeOrder());
        }
        formRecord.setUpdatedAt(LocalDateTime.now());
        formRecordMapper.updateById(formRecord);

        log.info("审批流初始化完成: formId={}, formType={}, startNodeOrder={}",
                formRecordId, formType, startNode != null ? startNode.getNodeOrder() : "ALL_SKIPPED");
    }

    /**
     * 评估节点跳过条件
     * 格式：JSON {"role":"project_manager"} → 提交人角色匹配时跳过
     *
     * @param skipCondition 条件字符串
     * @param submitterRole 提交人角色代码
     * @return true 表示应跳过此节点
     */
    private boolean evaluateSkipCondition(String skipCondition, String submitterRole) {
        if (skipCondition == null || skipCondition.isBlank()) {
            return false;
        }
        try {
            @SuppressWarnings("unchecked")
            Map<String, Object> cond = objectMapper.readValue(skipCondition, Map.class);
            Object roleVal = cond.get("role");
            if (roleVal != null && submitterRole != null) {
                return roleVal.toString().equalsIgnoreCase(submitterRole);
            }
        } catch (Exception e) {
            log.warn("skipCondition 解析失败，跳过条件不生效: {}", skipCondition, e);
        }
        return false;
    }

    /**
     * 解析提交人角色代码
     */
    private String resolveSubmitterRole(Long submitterId) {
        if (submitterId == null) return null;
        Employee emp = employeeMapper.selectById(submitterId);
        return emp != null ? emp.getRoleCode() : null;
    }

    /**
     * 判断指定员工是否可以审批当前表单节点
     */
    public boolean canApprove(Long formRecordId, Long employeeId) {
        FormRecord formRecord = formRecordMapper.selectById(formRecordId);
        if (formRecord == null) {
            return false;
        }

        // 只有 PENDING 或 APPROVING 状态可以被审批
        if (!"PENDING".equals(formRecord.getStatus()) && !"APPROVING".equals(formRecord.getStatus())) {
            return false;
        }

        // 查找审批流定义
        ApprovalFlowDef flowDef = approvalFlowDefMapper.findActiveByBusinessType(formRecord.getFormType());
        if (flowDef == null) {
            return false;
        }

        // 获取当前节点
        ApprovalFlowNode currentNode = approvalFlowNodeMapper.findByFlowIdAndNodeOrder(
                flowDef.getId(), formRecord.getCurrentNodeOrder());
        if (currentNode == null) {
            return false;
        }

        // 检查员工是否是当前节点的审批人
        Long expectedApproverId = resolveApproverId(currentNode, formRecord.getSubmitterId());
        return Objects.equals(expectedApproverId, employeeId);
    }

    /**
     * 推进审批流
     * 验证权限、插入审批记录、移动到下一节点或完成流程
     *
     * @param formRecordId 表单记录 ID
     * @param approverId 审批人 ID
     * @param action 动作：APPROVE 或 REJECT
     * @param comment 审批意见
     * @return 表单记录响应
     */
    @OperationLogRecord(action = "APPROVAL_ACTION", targetType = "FORM_RECORD")
    @Transactional
    public FormRecordResponse advance(Long formRecordId, Long approverId, String action, String comment) {
        // 获取表单记录
        FormRecord formRecord = formRecordMapper.selectById(formRecordId);
        if (formRecord == null) {
            throw new IllegalStateException("表单记录 [" + formRecordId + "] 不存在");
        }

        // 验证状态
        if (!"PENDING".equals(formRecord.getStatus()) && !"APPROVING".equals(formRecord.getStatus())) {
            throw new IllegalStateException("当前表单状态 [" + formRecord.getStatus() + "] 不允许审批操作");
        }

        // 验证审批权限
        if (!canApprove(formRecordId, approverId)) {
            throw new IllegalStateException("当前员工没有权限审批此表单");
        }

        // 查找审批流定义
        ApprovalFlowDef flowDef = approvalFlowDefMapper.findActiveByBusinessType(formRecord.getFormType());
        if (flowDef == null) {
            throw new IllegalStateException("未找到业务类型 [" + formRecord.getFormType() + "] 的激活审批流定义");
        }

        // 获取当前节点
        ApprovalFlowNode currentNode = approvalFlowNodeMapper.findByFlowIdAndNodeOrder(
                flowDef.getId(), formRecord.getCurrentNodeOrder());
        if (currentNode == null) {
            throw new IllegalStateException("当前节点不存在");
        }

        // 插入审批记录
        ApprovalRecord approvalRecord = new ApprovalRecord();
        approvalRecord.setFormId(formRecordId);
        approvalRecord.setNodeOrder(currentNode.getNodeOrder());
        approvalRecord.setApproverId(approverId);
        approvalRecord.setAction(action);
        approvalRecord.setComment(comment);
        approvalRecord.setActedAt(LocalDateTime.now());
        approvalRecordMapper.insert(approvalRecord);

        // 处理审批动作
        if ("REJECT".equals(action)) {
            // 驳回：表单状态变为 REJECTED
            formRecord.setStatus("REJECTED");
            formRecord.setUpdatedAt(LocalDateTime.now());
            formRecordMapper.updateById(formRecord);
            // 通知提交人（非核心流程，异常不中断审批主流程）
            try {
                notificationService.send(
                        formRecord.getSubmitterId(),
                        "Your request has been rejected",
                        "Your " + formRecord.getFormType() + " request has been rejected. Comment: " + (comment != null ? comment : ""),
                        "APPROVAL",
                        "FORM_RECORD",
                        formRecordId
                );
            } catch (Exception e) {
                log.warn("Failed to send rejection notification for formId={}: {}", formRecordId, e.getMessage());
            }
        } else if ("APPROVE".equals(action)) {
            // 获取所有节点判断是否为最后一个
            List<ApprovalFlowNode> allNodes = approvalFlowNodeMapper.findByFlowId(flowDef.getId());
            Optional<ApprovalFlowNode> nextNodeOpt = allNodes.stream()
                    .filter(n -> n.getNodeOrder() > currentNode.getNodeOrder())
                    .min(Comparator.comparingInt(ApprovalFlowNode::getNodeOrder));

            if (nextNodeOpt.isPresent()) {
                // 不是最后一个节点，移动到下一个节点
                ApprovalFlowNode nextNode = nextNodeOpt.get();
                formRecord.setStatus("APPROVING");
                formRecord.setCurrentNodeOrder(nextNode.getNodeOrder());
                formRecord.setUpdatedAt(LocalDateTime.now());
                formRecordMapper.updateById(formRecord);
            } else {
                // 是最后一个节点，表单状态变为 APPROVED
                formRecord.setStatus("APPROVED");
                formRecord.setUpdatedAt(LocalDateTime.now());
                formRecordMapper.updateById(formRecord);
                // 通知提交人（非核心流程，异常不中断审批主流程）
                try {
                    notificationService.send(
                            formRecord.getSubmitterId(),
                            "Your request has been approved",
                            "Your " + formRecord.getFormType() + " request has been approved.",
                            "APPROVAL",
                            "FORM_RECORD",
                            formRecordId
                    );
                } catch (Exception e) {
                    log.warn("Failed to send approval notification for formId={}: {}", formRecordId, e.getMessage());
                }
            }
        }

        // 记录操作日志
        writeOperationLog(approverId, action, "FORM_RECORD", formRecordId, 
                buildOperationDetail(formRecord, action, comment));

        log.info("审批流推进完成: formId={}, action={}, newStatus={}", 
                formRecordId, action, formRecord.getStatus());

        return buildFormRecordResponse(formRecord);
    }

    /**
     * 获取员工的待审批列表
     * 返回所有状态为 PENDING 或 APPROVING 且当前员工是审批人的表单
     */
    public List<FormRecordResponse> getTodo(Long employeeId) {
        // 查找所有 PENDING 或 APPROVING 状态的表单
        List<FormRecord> pendingForms = formRecordMapper.selectList(
                new com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper<FormRecord>()
                        .in(FormRecord::getStatus, Arrays.asList("PENDING", "APPROVING"))
                        .eq(FormRecord::getDeleted, 0)
                        .orderByDesc(FormRecord::getCreatedAt)
        );

        // 过滤出当前员工可以审批的表单
        return pendingForms.stream()
                .filter(form -> canApprove(form.getId(), employeeId))
                .map(this::buildFormRecordResponse)
                .collect(Collectors.toList());
    }

    /**
     * 解析节点的审批人 ID
     *
     * @param node 审批节点
     * @param submitterId 提交人 ID
     * @return 审批人 ID
     */
    private Long resolveApproverId(ApprovalFlowNode node, Long submitterId) {
        return switch (node.getApproverType()) {
            case "DIRECT_SUPERVISOR" -> resolveDirectSupervisor(submitterId);
            case "ROLE" -> resolveRoleApprover(node.getApproverRef());
            case "DESIGNATED" -> {
                // 指定人员，直接解析 approver_ref 为 ID
                if (node.getApproverRef() != null && !node.getApproverRef().isEmpty()) {
                    try {
                        yield Long.parseLong(node.getApproverRef());
                    } catch (NumberFormatException e) {
                        log.warn("指定人员审批人 ID 格式错误: {}", node.getApproverRef());
                        yield null;
                    }
                }
                yield null;
            }
            default -> null;
        };
    }

    /**
     * 解析直系领导
     */
    private Long resolveDirectSupervisor(Long employeeId) {
        Employee employee = employeeMapper.selectById(employeeId);
        if (employee == null) {
            return findCEOFallback();
        }

        Long supervisorId = employee.getDirectSupervisorId();
        if (supervisorId != null) {
            // 验证直属领导是否存在且有效
            Employee supervisor = employeeMapper.selectById(supervisorId);
            if (supervisor != null && supervisor.getDeleted() != null && supervisor.getDeleted() == 0) {
                return supervisorId;
            }
        }

        // 直系领导为空或无效，回退到 CEO
        return findCEOFallback();
    }

    /**
     * 解析角色审批人
     */
    private Long resolveRoleApprover(String roleCode) {
        if (roleCode == null || roleCode.isEmpty()) {
            return findCEOFallback();
        }

        // 查找具有该角色的第一个员工
        Employee employee = employeeMapper.selectOne(
                new com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper<Employee>()
                        .eq(Employee::getRoleCode, roleCode.toLowerCase())
                        .eq(Employee::getAccountStatus, "ACTIVE")
                        .eq(Employee::getDeleted, 0)
                        .last("LIMIT 1")
        );

        if (employee != null) {
            return employee.getId();
        }

        // 未找到角色对应的员工，回退到 CEO
        return findCEOFallback();
    }

    /**
     * 查找 CEO 作为回退审批人
     */
    private Long findCEOFallback() {
        Employee ceo = employeeMapper.selectOne(
                new com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper<Employee>()
                        .eq(Employee::getRoleCode, "ceo")
                        .eq(Employee::getAccountStatus, "ACTIVE")
                        .eq(Employee::getDeleted, 0)
                        .last("LIMIT 1")
        );
        return ceo != null ? ceo.getId() : null;
    }

    /**
     * 构建表单记录响应
     */
    private FormRecordResponse buildFormRecordResponse(FormRecord formRecord) {
        // 获取提交人信息
        String submitterName = null;
        String departmentName = null;
        if (formRecord.getSubmitterId() != null) {
            Employee submitter = employeeMapper.selectById(formRecord.getSubmitterId());
            if (submitter != null) {
                submitterName = submitter.getName();
                // 获取部门名称
                if (submitter.getDepartmentId() != null) {
                    Department dept = departmentMapper.selectById(submitter.getDepartmentId());
                    if (dept != null) {
                        departmentName = dept.getName();
                    }
                }
            }
        }

        // 如果无法获取部门，使用默认空字符串
        if (departmentName == null) {
            departmentName = "";
        }

        // 解析表单数据
        Map<String, Object> formDataMap = parseFormData(formRecord.getFormData());

        // 获取审批历史
        List<FormRecordResponse.ApprovalHistory> history = getApprovalHistory(formRecord.getId());

        return new FormRecordResponse(
                formRecord.getId(),
                generateFormNo(formRecord.getFormType(), formRecord.getId()),
                formRecord.getFormType(),
                getFormTypeName(formRecord.getFormType()),
                submitterName != null ? submitterName : "",
                departmentName,
                formRecord.getCreatedAt(),
                formRecord.getStatus(),
                getCurrentNodeName(formRecord),
                formDataMap,
                history,
                formRecord.getRemark()
        );
    }

    /**
     * 获取审批历史记录
     * 批量查询 approver 信息，避免循环内 selectById 导致 N+1 查询
     */
    private List<FormRecordResponse.ApprovalHistory> getApprovalHistory(Long formId) {
        List<ApprovalRecord> records = approvalRecordMapper.findByFormId(formId);
        if (records.isEmpty()) {
            return Collections.emptyList();
        }

        // Batch-load all approvers in one query
        List<Long> approverIds = records.stream()
                .map(ApprovalRecord::getApproverId)
                .filter(Objects::nonNull)
                .distinct()
                .collect(Collectors.toList());
        Map<Long, String> approverNames = approverIds.isEmpty()
                ? Collections.emptyMap()
                : employeeMapper.selectBatchIds(approverIds).stream()
                        .collect(Collectors.toMap(Employee::getId, Employee::getName));

        return records.stream()
                .map(r -> {
                    String approverName = r.getApproverId() != null
                            ? approverNames.getOrDefault(r.getApproverId(), "")
                            : "";
                    return new FormRecordResponse.ApprovalHistory(
                            getNodeNameByOrder(formId, r.getNodeOrder()),
                            approverName,
                            r.getAction(),
                            r.getComment(),
                            r.getActedAt()
                    );
                })
                .collect(Collectors.toList());
    }

    /**
     * 根据节点顺序获取节点名称
     */
    private String getNodeNameByOrder(Long formId, Integer nodeOrder) {
        FormRecord formRecord = formRecordMapper.selectById(formId);
        if (formRecord == null) {
            return "";
        }
        ApprovalFlowDef flowDef = approvalFlowDefMapper.findActiveByBusinessType(formRecord.getFormType());
        if (flowDef == null) {
            return "";
        }
        ApprovalFlowNode node = approvalFlowNodeMapper.findByFlowIdAndNodeOrder(flowDef.getId(), nodeOrder);
        return node != null ? node.getNodeName() : "";
    }

    /**
     * 获取当前节点名称
     */
    private String getCurrentNodeName(FormRecord formRecord) {
        ApprovalFlowDef flowDef = approvalFlowDefMapper.findActiveByBusinessType(formRecord.getFormType());
        if (flowDef == null) {
            return "";
        }
        ApprovalFlowNode node = approvalFlowNodeMapper.findByFlowIdAndNodeOrder(
                flowDef.getId(), formRecord.getCurrentNodeOrder());
        return node != null ? node.getNodeName() : "";
    }

    /**
     * 解析表单数据 JSON
     */
    private Map<String, Object> parseFormData(String formData) {
        if (formData == null || formData.isEmpty()) {
            return new HashMap<>();
        }
        try {
            return objectMapper.readValue(formData, HashMap.class);
        } catch (JsonProcessingException e) {
            log.warn("表单数据 JSON 解析失败: {}", formData, e);
            return new HashMap<>();
        }
    }

    /**
     * 生成表单编号
     */
    private String generateFormNo(String formType, Long id) {
        String prefix = switch (formType) {
            case "LEAVE" -> "L";
            case "OVERTIME" -> "OT";
            case "INJURY" -> "INJ";
            case "LOG" -> "LOG";
            default -> "F";
        };
        return prefix + LocalDateTime.now().toLocalDate().toString().replace("-", "") 
                + String.format("%04d", id);
    }

    /**
     * 获取表单类型名称
     */
    private String getFormTypeName(String formType) {
        return switch (formType) {
            case "LEAVE" -> "请假申请";
            case "OVERTIME" -> "加班申请";
            case "INJURY" -> "工伤补偿";
            case "LOG" -> "施工日志";
            default -> formType;
        };
    }

    /**
     * 写入操作日志
     */
    private void writeOperationLog(Long operatorId, String action, String targetType, 
                                   Long targetId, String detail) {
        OperationLog logEntry = new OperationLog();
        logEntry.setOperatorId(operatorId);
        logEntry.setAction(action);
        logEntry.setTargetType(targetType);
        logEntry.setTargetId(targetId);
        logEntry.setDetail(detail);
        logEntry.setActedAt(LocalDateTime.now());
        operationLogMapper.insert(logEntry);
    }

    /**
     * 构建操作详情 JSON
     */
    private String buildOperationDetail(FormRecord formRecord, String action, String comment) {
        Map<String, Object> detail = new HashMap<>();
        detail.put("formId", formRecord.getId());
        detail.put("formType", formRecord.getFormType());
        detail.put("action", action);
        detail.put("newStatus", formRecord.getStatus());
        detail.put("comment", comment);
        try {
            return objectMapper.writeValueAsString(detail);
        } catch (JsonProcessingException e) {
            return "{}";
        }
    }
}
