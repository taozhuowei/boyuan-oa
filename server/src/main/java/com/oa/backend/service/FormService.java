package com.oa.backend.service;

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
 * 表单服务类
 * 负责处理表单的提交、查询和历史记录管理
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class FormService {

    private final FormRecordMapper formRecordMapper;
    private final ApprovalFlowDefMapper approvalFlowDefMapper;
    private final ApprovalFlowNodeMapper approvalFlowNodeMapper;
    private final ApprovalRecordMapper approvalRecordMapper;
    private final EmployeeMapper employeeMapper;
    private final DepartmentMapper departmentMapper;
    private final OperationLogMapper operationLogMapper;
    private final ApprovalFlowService approvalFlowService;
    private final ObjectMapper objectMapper;

    /**
     * 提交表单
     * 创建表单记录，初始化审批流，返回响应
     *
     * @param submitterId 提交人 ID
     * @param formType 表单类型
     * @param formDataJson 表单数据 JSON 字符串
     * @param remark 备注
     * @return 表单记录响应
     */
    @Transactional
    public FormRecordResponse submitForm(Long submitterId, String formType, String formDataJson, String remark) {
        // 验证表单类型是否有对应的审批流定义
        ApprovalFlowDef flowDef = approvalFlowDefMapper.findActiveByBusinessType(formType);
        if (flowDef == null) {
            throw new IllegalStateException("未找到业务类型 [" + formType + "] 的激活审批流定义");
        }

        // 创建表单记录
        FormRecord formRecord = new FormRecord();
        formRecord.setFormType(formType);
        formRecord.setSubmitterId(submitterId);
        formRecord.setFormData(formDataJson);
        formRecord.setStatus("PENDING"); // initFlow will update to APPROVING once nodes are assigned
        formRecord.setCurrentNodeOrder(0);
        formRecord.setRemark(remark);
        formRecord.setCreatedAt(LocalDateTime.now());
        formRecord.setUpdatedAt(LocalDateTime.now());
        formRecord.setDeleted(0);

        formRecordMapper.insert(formRecord);

        // 初始化审批流
        approvalFlowService.initFlow(formRecord.getId(), formType, submitterId);

        // 重新查询获取最新状态
        formRecord = formRecordMapper.selectById(formRecord.getId());

        // 记录操作日志
        writeOperationLog(submitterId, "SUBMIT_FORM", "FORM_RECORD", formRecord.getId(),
                buildOperationDetail(formRecord, "表单提交"));

        log.info("表单提交成功: formId={}, formType={}, submitterId={}",
                formRecord.getId(), formType, submitterId);

        return buildFormRecordResponse(formRecord);
    }

    /**
     * 获取历史记录
     * CEO/Finance: 查看所有指定类型的表单
     * 其他角色: 只能查看自己提交的表单
     *
     * @param employeeId 员工 ID
     * @param roleCode 角色代码
     * @param formTypes 表单类型列表
     * @return 表单记录响应列表
     */
    public List<FormRecordResponse> getHistory(Long employeeId, String roleCode, List<String> formTypes) {
        List<FormRecord> records;

        // 判断是否有查看全部权限（CEO、Finance 或 PM）
        if ("ceo".equalsIgnoreCase(roleCode) || "finance".equalsIgnoreCase(roleCode)
                || "project_manager".equalsIgnoreCase(roleCode)) {
            // CEO 和财务可以查看所有指定类型的表单
            records = formRecordMapper.selectList(
                    new com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper<FormRecord>()
                            .in(formTypes != null && !formTypes.isEmpty(), FormRecord::getFormType, formTypes)
                            .eq(FormRecord::getDeleted, 0)
                            .orderByDesc(FormRecord::getCreatedAt)
            );
        } else {
            // 其他角色只能查看自己提交的表单
            records = formRecordMapper.selectList(
                    new com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper<FormRecord>()
                            .eq(FormRecord::getSubmitterId, employeeId)
                            .in(formTypes != null && !formTypes.isEmpty(), FormRecord::getFormType, formTypes)
                            .eq(FormRecord::getDeleted, 0)
                            .orderByDesc(FormRecord::getCreatedAt)
            );
        }

        return records.stream()
                .map(this::buildFormRecordResponse)
                .collect(Collectors.toList());
    }

    /**
     * 获取表单详情
     * 包含审批历史记录
     *
     * @param formId 表单 ID
     * @param requesterEmployeeId 请求人 ID（用于权限校验）
     * @return 表单记录响应
     */
    public FormRecordResponse getDetail(Long formId, Long requesterEmployeeId) {
        FormRecord formRecord = formRecordMapper.selectById(formId);
        if (formRecord == null) {
            throw new IllegalStateException("表单记录 [" + formId + "] 不存在");
        }

        // 权限校验：只能查看自己的表单，或具有审批权限的人查看
        Employee requester = employeeMapper.selectById(requesterEmployeeId);
        if (requester == null) {
            throw new IllegalStateException("请求人不存在");
        }

        boolean canView = false;

        // 是自己的表单
        if (Objects.equals(formRecord.getSubmitterId(), requesterEmployeeId)) {
            canView = true;
        }

        // 是 CEO 或 Finance 角色
        if ("ceo".equalsIgnoreCase(requester.getRoleCode()) ||
                "finance".equalsIgnoreCase(requester.getRoleCode())) {
            canView = true;
        }

        // 是当前节点的审批人
        if (approvalFlowService.canApprove(formId, requesterEmployeeId)) {
            canView = true;
        }

        if (!canView) {
            throw new IllegalStateException("没有权限查看此表单");
        }

        return buildFormRecordResponse(formRecord);
    }

    /**
     * 获取员工的待审批列表
     * 委托给 ApprovalFlowService
     *
     * @param employeeId 员工 ID
     * @return 表单记录响应列表
     */
    public List<FormRecordResponse> getTodo(Long employeeId) {
        return approvalFlowService.getTodo(employeeId);
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
     */
    private List<FormRecordResponse.ApprovalHistory> getApprovalHistory(Long formId) {
        List<ApprovalRecord> records = approvalRecordMapper.findByFormId(formId);
        return records.stream()
                .map(r -> {
                    String approverName = "";
                    if (r.getApproverId() != null) {
                        Employee approver = employeeMapper.selectById(r.getApproverId());
                        if (approver != null) {
                            approverName = approver.getName();
                        }
                    }
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
    private String buildOperationDetail(FormRecord formRecord, String description) {
        Map<String, Object> detail = new HashMap<>();
        detail.put("formId", formRecord.getId());
        detail.put("formType", formRecord.getFormType());
        detail.put("description", description);
        try {
            return objectMapper.writeValueAsString(detail);
        } catch (JsonProcessingException e) {
            return "{}";
        }
    }
}
