package com.oa.backend.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.oa.backend.dto.*;
import com.oa.backend.entity.*;
import com.oa.backend.mapper.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

/**
 * 报销服务类
 * 负责处理报销申请的提交、查询和审批流转
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ExpenseService {

    private final ExpenseClaimMapper expenseClaimMapper;
    private final ExpenseItemMapper expenseItemMapper;
    private final ExpenseTypeDefMapper expenseTypeDefMapper;
    private final EmployeeMapper employeeMapper;
    private final DepartmentMapper departmentMapper;
    private final FormRecordMapper formRecordMapper;
    private final FormService formService;
    private final ApprovalFlowService approvalFlowService;
    private final ObjectMapper objectMapper;

    /**
     * 提交报销申请
     * 创建报销记录并初始化审批流
     */
    @Transactional
    public FormRecordResponse submitExpense(Long submitterId, ExpenseSubmitRequest request) {
        // 1. 通过 FormService 创建表单记录，触发审批流
        String formDataJson = buildFormDataJson(request);
        FormRecordResponse formResponse = formService.submitForm(
                submitterId, "EXPENSE", formDataJson, request.remark());

        // 2. 创建报销主记录
        ExpenseClaim claim = new ExpenseClaim();
        claim.setFormId(formResponse.id());
        claim.setEmployeeId(submitterId);
        claim.setExpenseType(request.expenseType());
        claim.setTripStartDate(request.tripStartDate());
        claim.setTripEndDate(request.tripEndDate());
        claim.setTripDestination(request.tripDestination());
        claim.setTripPurpose(request.tripPurpose());
        claim.setTotalAmount(request.totalAmount());
        claim.setInvoicesJson(request.invoicesJson());
        claim.setProjectId(request.projectId());
        claim.setIncludedInPayroll(false);
        claim.setPayrollCycleId(null);
        claim.setRemark(request.remark());
        claim.setCreatedAt(LocalDateTime.now());
        claim.setUpdatedAt(LocalDateTime.now());
        claim.setDeleted(0);

        expenseClaimMapper.insert(claim);

        // 3. 创建报销明细
        if (request.items() != null && !request.items().isEmpty()) {
            for (ExpenseItemDto itemDto : request.items()) {
                ExpenseItem item = new ExpenseItem();
                item.setExpenseClaimId(claim.getId());
                item.setItemType(itemDto.itemType());
                item.setExpenseDate(itemDto.expenseDate());
                item.setAmount(itemDto.amount());
                item.setInvoiceNo(itemDto.invoiceNo());
                item.setDescription(itemDto.description());
                item.setAttachmentId(itemDto.attachmentId());
                item.setCreatedAt(LocalDateTime.now());
                item.setUpdatedAt(LocalDateTime.now());
                item.setDeleted(0);
                expenseItemMapper.insert(item);
            }
        }

        log.info("报销申请提交成功: claimId={}, formId={}, submitterId={}, amount={}",
                claim.getId(), formResponse.id(), submitterId, request.totalAmount());

        return formService.getDetail(formResponse.id(), submitterId);
    }

    /**
     * 获取报销详情
     */
    public ExpenseClaimResponse getExpenseDetail(Long formId, Long requesterId) {
        // 先校验表单查看权限
        FormRecordResponse formResponse = formService.getDetail(formId, requesterId);

        ExpenseClaim claim = expenseClaimMapper.findByFormId(formId);
        if (claim == null) {
            throw new IllegalStateException("报销记录不存在");
        }

        List<ExpenseItem> items = expenseItemMapper.findByExpenseClaimId(claim.getId());
        List<ExpenseItemDto> itemDtos = items.stream()
                .map(this::convertToItemDto)
                .collect(Collectors.toList());

        Employee employee = employeeMapper.selectById(claim.getEmployeeId());
        String employeeName = employee != null ? employee.getName() : "";

        return new ExpenseClaimResponse(
                claim.getId(),
                claim.getFormId(),
                claim.getEmployeeId(),
                employeeName,
                claim.getExpenseType(),
                getExpenseTypeName(claim.getExpenseType()),
                claim.getTripStartDate(),
                claim.getTripEndDate(),
                claim.getTripDestination(),
                claim.getTripPurpose(),
                claim.getTotalAmount(),
                claim.getInvoicesJson(),
                claim.getProjectId(),
                null, // projectName
                claim.getIncludedInPayroll(),
                claim.getRemark(),
                claim.getCreatedAt(),
                itemDtos
        );
    }

    /**
     * 获取我的报销记录列表
     */
    public List<FormRecordResponse> getMyExpenses(Long employeeId, String roleCode) {
        return formService.getHistory(employeeId, roleCode, List.of("EXPENSE"));
    }

    /**
     * 获取费用类型列表
     */
    public List<ExpenseTypeResponse> getExpenseTypes() {
        List<ExpenseTypeDef> types = expenseTypeDefMapper.findAllEnabled();
        return types.stream()
                .map(t -> new ExpenseTypeResponse(
                        t.getId(),
                        t.getCode(),
                        t.getName(),
                        t.getDescription(),
                        t.getRequireInvoice(),
                        t.getDailyLimit()
                ))
                .collect(Collectors.toList());
    }

    /**
     * 构建表单数据 JSON
     */
    private String buildFormDataJson(ExpenseSubmitRequest request) {
        try {
            return objectMapper.writeValueAsString(request);
        } catch (JsonProcessingException e) {
            log.error("构建表单数据 JSON 失败", e);
            return "{}";
        }
    }

    /**
     * 转换明细实体为 DTO
     */
    private ExpenseItemDto convertToItemDto(ExpenseItem item) {
        return new ExpenseItemDto(
                item.getId(),
                item.getItemType(),
                item.getExpenseDate(),
                item.getAmount(),
                item.getInvoiceNo(),
                item.getDescription(),
                item.getAttachmentId()
        );
    }

    /**
     * 获取费用类型名称
     */
    private String getExpenseTypeName(String expenseType) {
        return switch (expenseType) {
            case "TRAVEL" -> "差旅费";
            case "MEAL" -> "餐饮费";
            case "ACCOMMODATION" -> "住宿费";
            case "TRANSPORT" -> "交通费";
            case "OFFICE" -> "办公用品";
            case "OTHER" -> "其他";
            default -> expenseType;
        };
    }
}
