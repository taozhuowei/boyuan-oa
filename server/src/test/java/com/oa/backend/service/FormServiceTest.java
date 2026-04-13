package com.oa.backend.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.oa.backend.dto.FormRecordResponse;
import com.oa.backend.entity.*;
import com.oa.backend.mapper.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * FormService 单元测试
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("表单服务测试")
class FormServiceTest {

    @InjectMocks
    private FormService formService;

    @Mock
    private FormRecordMapper formRecordMapper;

    @Mock
    private ApprovalFlowDefMapper approvalFlowDefMapper;

    @Mock
    private ApprovalFlowNodeMapper approvalFlowNodeMapper;

    @Mock
    private ApprovalRecordMapper approvalRecordMapper;

    @Mock
    private EmployeeMapper employeeMapper;

    @Mock
    private DepartmentMapper departmentMapper;

    @Mock
    private OperationLogMapper operationLogMapper;

    @Mock
    private ApprovalFlowService approvalFlowService;

    @Spy
    private ObjectMapper objectMapper = new ObjectMapper();

    @BeforeEach
    void setUp() {
        // No @Value fields to set up
    }

    @Test
    @DisplayName("提交表单 - 成功提交应创建记录并初始化审批流")
    void submitForm_success_shouldCreateRecordAndInitFlow() {
        // Given
        Long submitterId = 1L;
        String formType = "LEAVE";
        String formDataJson = "{\"reason\":\"vacation\"}";
        String remark = "Test remark";

        ApprovalFlowDef flowDef = new ApprovalFlowDef();
        flowDef.setId(1L);
        flowDef.setBusinessType(formType);

        FormRecord savedRecord = new FormRecord();
        savedRecord.setId(100L);
        savedRecord.setFormType(formType);
        savedRecord.setSubmitterId(submitterId);
        savedRecord.setFormData(formDataJson);
        savedRecord.setStatus("PENDING");
        savedRecord.setCurrentNodeOrder(0);

        Employee submitter = new Employee();
        submitter.setId(submitterId);
        submitter.setName("Test User");
        submitter.setDepartmentId(10L);

        Department department = new Department();
        department.setId(10L);
        department.setName("Test Dept");

        when(approvalFlowDefMapper.findActiveByBusinessType(formType)).thenReturn(flowDef);
        when(formRecordMapper.insert(any(FormRecord.class))).thenReturn(1);
        when(formRecordMapper.selectById(any())).thenReturn(savedRecord);
        when(employeeMapper.selectById(submitterId)).thenReturn(submitter);
        when(departmentMapper.selectById(10L)).thenReturn(department);
        when(approvalFlowNodeMapper.findByFlowIdAndNodeOrder(any(), any())).thenReturn(null);
        when(approvalRecordMapper.findByFormId(any())).thenReturn(Collections.emptyList());

        // When
        FormRecordResponse result = formService.submitForm(submitterId, formType, formDataJson, remark);

        // Then
        assertThat(result).isNotNull();
        verify(approvalFlowDefMapper, atLeast(1)).findActiveByBusinessType(formType);
        verify(formRecordMapper, times(1)).insert(any(FormRecord.class));
        verify(approvalFlowService, times(1)).initFlow(any(), eq(formType), eq(submitterId));
        verify(formRecordMapper, times(1)).selectById(any());
        verify(operationLogMapper, times(1)).insert(any(OperationLog.class));
    }

    @Test
    @DisplayName("提交表单 - 未找到审批流定义应抛出异常")
    void submitForm_noFlowDef_shouldThrowIllegalStateException() {
        // Given
        Long submitterId = 1L;
        String formType = "UNKNOWN_TYPE";
        String formDataJson = "{}";
        String remark = "";

        when(approvalFlowDefMapper.findActiveByBusinessType(formType)).thenReturn(null);

        // When & Then
        assertThatThrownBy(() -> formService.submitForm(submitterId, formType, formDataJson, remark))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("未找到业务类型");

        verify(formRecordMapper, never()).insert(any());
    }

    @Test
    @DisplayName("获取历史记录 - CEO 角色应查看所有表单")
    void getHistory_ceoRole_shouldViewAllForms() {
        // Given
        Long employeeId = 1L;
        String roleCode = "ceo";
        List<String> formTypes = Arrays.asList("LEAVE", "OVERTIME");

        FormRecord record1 = new FormRecord();
        record1.setId(1L);
        record1.setFormType("LEAVE");
        record1.setSubmitterId(2L);

        FormRecord record2 = new FormRecord();
        record2.setId(2L);
        record2.setFormType("OVERTIME");
        record2.setSubmitterId(3L);

        List<FormRecord> records = Arrays.asList(record1, record2);

        when(formRecordMapper.selectList(any())).thenReturn(records);

        // When
        List<FormRecordResponse> result = formService.getHistory(employeeId, roleCode, formTypes);

        // Then
        assertThat(result).hasSize(2);
        verify(formRecordMapper, times(1)).selectList(any());
    }

    @Test
    @DisplayName("获取历史记录 - Finance 角色应查看所有表单")
    void getHistory_financeRole_shouldViewAllForms() {
        // Given
        Long employeeId = 1L;
        String roleCode = "finance";
        List<String> formTypes = Collections.singletonList("LEAVE");

        FormRecord record = new FormRecord();
        record.setId(1L);
        record.setFormType("LEAVE");

        when(formRecordMapper.selectList(any())).thenReturn(Collections.singletonList(record));

        // When
        List<FormRecordResponse> result = formService.getHistory(employeeId, roleCode, formTypes);

        // Then
        assertThat(result).hasSize(1);
    }

    @Test
    @DisplayName("获取历史记录 - PM 角色应查看所有表单")
    void getHistory_pmRole_shouldViewAllForms() {
        // Given
        Long employeeId = 1L;
        String roleCode = "project_manager";
        List<String> formTypes = Collections.singletonList("LEAVE");

        FormRecord record = new FormRecord();
        record.setId(1L);
        record.setFormType("LEAVE");

        when(formRecordMapper.selectList(any())).thenReturn(Collections.singletonList(record));

        // When
        List<FormRecordResponse> result = formService.getHistory(employeeId, roleCode, formTypes);

        // Then
        assertThat(result).hasSize(1);
    }

    @Test
    @DisplayName("获取历史记录 - 普通角色只能查看自己的表单")
    void getHistory_normalRole_shouldViewOwnFormsOnly() {
        // Given
        Long employeeId = 1L;
        String roleCode = "employee";
        List<String> formTypes = Collections.singletonList("LEAVE");

        FormRecord record = new FormRecord();
        record.setId(1L);
        record.setFormType("LEAVE");
        record.setSubmitterId(employeeId);

        when(formRecordMapper.selectList(any())).thenReturn(Collections.singletonList(record));

        // When
        List<FormRecordResponse> result = formService.getHistory(employeeId, roleCode, formTypes);

        // Then
        assertThat(result).hasSize(1);
    }

    @Test
    @DisplayName("获取历史记录 - 空表单类型列表应查询所有类型")
    void getHistory_emptyFormTypes_shouldQueryAllTypes() {
        // Given
        Long employeeId = 1L;
        String roleCode = "ceo";
        List<String> emptyFormTypes = Collections.emptyList();

        FormRecord record = new FormRecord();
        record.setId(1L);
        record.setFormType("LEAVE");

        when(formRecordMapper.selectList(any())).thenReturn(Collections.singletonList(record));

        // When
        List<FormRecordResponse> result = formService.getHistory(employeeId, roleCode, emptyFormTypes);

        // Then
        assertThat(result).hasSize(1);
    }

    @Test
    @DisplayName("获取表单详情 - 提交人可以查看自己的表单")
    void getDetail_submitterCanViewOwnForm_shouldReturnResponse() {
        // Given
        Long formId = 100L;
        Long requesterId = 1L;

        FormRecord formRecord = new FormRecord();
        formRecord.setId(formId);
        formRecord.setFormType("LEAVE");
        formRecord.setSubmitterId(requesterId);
        formRecord.setFormData("{\"reason\":\"test\"}");

        Employee requester = new Employee();
        requester.setId(requesterId);
        requester.setName("Requester");
        requester.setRoleCode("employee");

        when(formRecordMapper.selectById(formId)).thenReturn(formRecord);
        when(employeeMapper.selectById(requesterId)).thenReturn(requester);
        when(approvalFlowService.canApprove(formId, requesterId)).thenReturn(false);
        when(approvalRecordMapper.findByFormId(any())).thenReturn(Collections.emptyList());

        // When
        FormRecordResponse result = formService.getDetail(formId, requesterId);

        // Then
        assertThat(result).isNotNull();
        assertThat(result.id()).isEqualTo(formId);
    }

    @Test
    @DisplayName("获取表单详情 - CEO 可以查看任何表单")
    void getDetail_ceoCanViewAnyForm_shouldReturnResponse() {
        // Given
        Long formId = 100L;
        Long requesterId = 1L;
        Long otherUserId = 2L;

        FormRecord formRecord = new FormRecord();
        formRecord.setId(formId);
        formRecord.setFormType("LEAVE");
        formRecord.setSubmitterId(otherUserId); // Form belongs to another user
        formRecord.setFormData("{}");

        Employee requester = new Employee();
        requester.setId(requesterId);
        requester.setName("CEO");
        requester.setRoleCode("ceo");

        when(formRecordMapper.selectById(formId)).thenReturn(formRecord);
        when(employeeMapper.selectById(requesterId)).thenReturn(requester);
        when(approvalRecordMapper.findByFormId(any())).thenReturn(Collections.emptyList());

        // When
        FormRecordResponse result = formService.getDetail(formId, requesterId);

        // Then
        assertThat(result).isNotNull();
    }

    @Test
    @DisplayName("获取表单详情 - 当前审批人可以查看表单")
    void getDetail_approverCanViewForm_shouldReturnResponse() {
        // Given
        Long formId = 100L;
        Long requesterId = 1L;
        Long otherUserId = 2L;

        FormRecord formRecord = new FormRecord();
        formRecord.setId(formId);
        formRecord.setFormType("LEAVE");
        formRecord.setSubmitterId(otherUserId);
        formRecord.setFormData("{}");

        Employee requester = new Employee();
        requester.setId(requesterId);
        requester.setName("Approver");
        requester.setRoleCode("manager");

        when(formRecordMapper.selectById(formId)).thenReturn(formRecord);
        when(employeeMapper.selectById(requesterId)).thenReturn(requester);
        when(approvalFlowService.canApprove(formId, requesterId)).thenReturn(true);
        when(approvalRecordMapper.findByFormId(any())).thenReturn(Collections.emptyList());

        // When
        FormRecordResponse result = formService.getDetail(formId, requesterId);

        // Then
        assertThat(result).isNotNull();
    }

    @Test
    @DisplayName("获取表单详情 - 表单不存在应抛出异常")
    void getDetail_formNotFound_shouldThrowIllegalStateException() {
        // Given
        Long formId = 100L;
        Long requesterId = 1L;

        when(formRecordMapper.selectById(formId)).thenReturn(null);

        // When & Then
        assertThatThrownBy(() -> formService.getDetail(formId, requesterId))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("表单记录");
    }

    @Test
    @DisplayName("获取表单详情 - 请求人不存在应抛出异常")
    void getDetail_requesterNotFound_shouldThrowIllegalStateException() {
        // Given
        Long formId = 100L;
        Long requesterId = 1L;

        FormRecord formRecord = new FormRecord();
        formRecord.setId(formId);
        formRecord.setFormType("LEAVE");

        when(formRecordMapper.selectById(formId)).thenReturn(formRecord);
        when(employeeMapper.selectById(requesterId)).thenReturn(null);

        // When & Then
        assertThatThrownBy(() -> formService.getDetail(formId, requesterId))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("请求人不存在");
    }

    @Test
    @DisplayName("获取表单详情 - 无权限查看应抛出异常")
    void getDetail_noPermission_shouldThrowIllegalStateException() {
        // Given
        Long formId = 100L;
        Long requesterId = 1L;
        Long otherUserId = 2L;

        FormRecord formRecord = new FormRecord();
        formRecord.setId(formId);
        formRecord.setFormType("LEAVE");
        formRecord.setSubmitterId(otherUserId); // Not the requester's form

        Employee requester = new Employee();
        requester.setId(requesterId);
        requester.setName("Regular User");
        requester.setRoleCode("employee"); // Not CEO/Finance

        when(formRecordMapper.selectById(formId)).thenReturn(formRecord);
        when(employeeMapper.selectById(requesterId)).thenReturn(requester);
        when(approvalFlowService.canApprove(formId, requesterId)).thenReturn(false); // Not an approver

        // When & Then
        assertThatThrownBy(() -> formService.getDetail(formId, requesterId))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("没有权限查看此表单");
    }

    @Test
    @DisplayName("获取待办列表 - 应委托给 ApprovalFlowService")
    void getTodo_shouldDelegateToApprovalFlowService() {
        // Given
        Long employeeId = 1L;

        FormRecordResponse response1 = new FormRecordResponse(
                1L, "L202401010001", "LEAVE", "请假申请", "User1", "Dept1",
                LocalDateTime.now(), "PENDING", "审批中", Map.of(), List.of(), ""
        );

        when(approvalFlowService.getTodo(employeeId)).thenReturn(Collections.singletonList(response1));

        // When
        List<FormRecordResponse> result = formService.getTodo(employeeId);

        // Then
        assertThat(result).hasSize(1);
        verify(approvalFlowService, times(1)).getTodo(employeeId);
    }

    @Test
    @DisplayName("表单类型名称映射 - 各种类型应返回正确中文名称")
    void getFormTypeName_variousTypes_shouldReturnCorrectNames() {
        // This is a private method, tested indirectly through submitForm or getDetail
        // We'll test the behavior through getHistory which builds responses

        // Given
        Long employeeId = 1L;
        String roleCode = "ceo";

        FormRecord leaveRecord = createFormRecord(1L, "LEAVE", employeeId);
        FormRecord overtimeRecord = createFormRecord(2L, "OVERTIME", employeeId);
        FormRecord injuryRecord = createFormRecord(3L, "INJURY", employeeId);
        FormRecord logRecord = createFormRecord(4L, "LOG", employeeId);
        FormRecord unknownRecord = createFormRecord(5L, "UNKNOWN", employeeId);

        List<FormRecord> records = Arrays.asList(leaveRecord, overtimeRecord, injuryRecord, logRecord, unknownRecord);

        when(formRecordMapper.selectList(any())).thenReturn(records);

        // When
        List<FormRecordResponse> result = formService.getHistory(employeeId, roleCode, Collections.emptyList());

        // Then
        assertThat(result).hasSize(5);
        assertThat(result.get(0).formTypeName()).isEqualTo("请假申请");
        assertThat(result.get(1).formTypeName()).isEqualTo("加班申请");
        assertThat(result.get(2).formTypeName()).isEqualTo("工伤补偿");
        assertThat(result.get(3).formTypeName()).isEqualTo("施工日志");
        assertThat(result.get(4).formTypeName()).isEqualTo("UNKNOWN");
    }

    @Test
    @DisplayName("表单编号生成 - 应生成正确格式的编号")
    void generateFormNo_shouldGenerateCorrectFormat() {
        // Given
        Long employeeId = 1L;
        String roleCode = "ceo";

        FormRecord record = new FormRecord();
        record.setId(123L);
        record.setFormType("LEAVE");
        record.setSubmitterId(employeeId);

        when(formRecordMapper.selectList(any())).thenReturn(Collections.singletonList(record));

        // When
        List<FormRecordResponse> result = formService.getHistory(employeeId, roleCode, Collections.emptyList());

        // Then
        assertThat(result).hasSize(1);
        String formNo = result.get(0).formNo();
        assertThat(formNo).startsWith("L");
        assertThat(formNo).contains("0123"); // Zero-padded to 4 digits
    }

    @Test
    @DisplayName("表单数据解析 - JSON 数据应正确解析为 Map")
    void parseFormData_validJson_shouldParseToMap() {
        // Given
        Long formId = 100L;
        Long requesterId = 1L;
        String formData = "{\"reason\":\"vacation\",\"days\":5}";

        FormRecord formRecord = new FormRecord();
        formRecord.setId(formId);
        formRecord.setFormType("LEAVE");
        formRecord.setSubmitterId(requesterId);
        formRecord.setFormData(formData);

        Employee requester = new Employee();
        requester.setId(requesterId);
        requester.setName("User");
        requester.setRoleCode("employee");

        when(formRecordMapper.selectById(formId)).thenReturn(formRecord);
        when(employeeMapper.selectById(requesterId)).thenReturn(requester);
        when(approvalFlowService.canApprove(any(), any())).thenReturn(false);
        when(approvalRecordMapper.findByFormId(any())).thenReturn(Collections.emptyList());

        // When
        FormRecordResponse result = formService.getDetail(formId, requesterId);

        // Then
        assertThat(result.formData()).isNotNull();
        assertThat(result.formData().get("reason")).isEqualTo("vacation");
        assertThat(result.formData().get("days")).isEqualTo(5);
    }

    @Test
    @DisplayName("表单数据解析 - 无效 JSON 应返回空 Map")
    void parseFormData_invalidJson_shouldReturnEmptyMap() {
        // Given
        Long formId = 100L;
        Long requesterId = 1L;
        String invalidFormData = "{invalid json";

        FormRecord formRecord = new FormRecord();
        formRecord.setId(formId);
        formRecord.setFormType("LEAVE");
        formRecord.setSubmitterId(requesterId);
        formRecord.setFormData(invalidFormData);

        Employee requester = new Employee();
        requester.setId(requesterId);
        requester.setName("User");
        requester.setRoleCode("employee");

        when(formRecordMapper.selectById(formId)).thenReturn(formRecord);
        when(employeeMapper.selectById(requesterId)).thenReturn(requester);
        when(approvalFlowService.canApprove(any(), any())).thenReturn(false);
        when(approvalRecordMapper.findByFormId(any())).thenReturn(Collections.emptyList());

        // When
        FormRecordResponse result = formService.getDetail(formId, requesterId);

        // Then
        assertThat(result.formData()).isNotNull();
        assertThat(result.formData()).isEmpty();
    }

    @Test
    @DisplayName("表单数据解析 - 空数据应返回空 Map")
    void parseFormData_emptyData_shouldReturnEmptyMap() {
        // Given
        Long formId = 100L;
        Long requesterId = 1L;

        FormRecord formRecord = new FormRecord();
        formRecord.setId(formId);
        formRecord.setFormType("LEAVE");
        formRecord.setSubmitterId(requesterId);
        formRecord.setFormData("");

        Employee requester = new Employee();
        requester.setId(requesterId);
        requester.setName("User");
        requester.setRoleCode("employee");

        when(formRecordMapper.selectById(formId)).thenReturn(formRecord);
        when(employeeMapper.selectById(requesterId)).thenReturn(requester);
        when(approvalFlowService.canApprove(any(), any())).thenReturn(false);
        when(approvalRecordMapper.findByFormId(any())).thenReturn(Collections.emptyList());

        // When
        FormRecordResponse result = formService.getDetail(formId, requesterId);

        // Then
        assertThat(result.formData()).isNotNull();
        assertThat(result.formData()).isEmpty();
    }

    @Test
    @DisplayName("审批历史 - 应正确构建审批历史记录")
    void getApprovalHistory_shouldBuildHistoryCorrectly() {
        // Given
        Long formId = 100L;
        Long requesterId = 1L;

        FormRecord formRecord = new FormRecord();
        formRecord.setId(formId);
        formRecord.setFormType("LEAVE");
        formRecord.setSubmitterId(requesterId);
        formRecord.setFormData("{}");
        formRecord.setCurrentNodeOrder(1);

        Employee requester = new Employee();
        requester.setId(requesterId);
        requester.setName("User");
        requester.setRoleCode("employee");

        ApprovalRecord approvalRecord = new ApprovalRecord();
        approvalRecord.setId(1L);
        approvalRecord.setFormId(formId);
        approvalRecord.setNodeOrder(1);
        approvalRecord.setApproverId(2L);
        approvalRecord.setAction("APPROVED");
        approvalRecord.setComment("Good");
        approvalRecord.setActedAt(LocalDateTime.now());

        Employee approver = new Employee();
        approver.setId(2L);
        approver.setName("Manager");

        when(formRecordMapper.selectById(formId)).thenReturn(formRecord);
        when(employeeMapper.selectById(requesterId)).thenReturn(requester);
        when(approvalFlowService.canApprove(any(), any())).thenReturn(false);
        when(approvalRecordMapper.findByFormId(formId)).thenReturn(Collections.singletonList(approvalRecord));
        when(employeeMapper.selectById(2L)).thenReturn(approver);
        when(approvalFlowDefMapper.findActiveByBusinessType(any())).thenReturn(null);

        // When
        FormRecordResponse result = formService.getDetail(formId, requesterId);

        // Then
        assertThat(result.history()).isNotNull();
        assertThat(result.history()).hasSize(1);
        assertThat(result.history().get(0).action()).isEqualTo("APPROVED");
        assertThat(result.history().get(0).comment()).isEqualTo("Good");
        assertThat(result.history().get(0).approver()).isEqualTo("Manager");
    }

    @Test
    @DisplayName("提交人信息 - 应正确获取部门名称")
    void buildResponse_shouldGetDepartmentName() {
        // Given
        Long formId = 100L;
        Long requesterId = 1L;
        Long departmentId = 10L;

        FormRecord formRecord = new FormRecord();
        formRecord.setId(formId);
        formRecord.setFormType("LEAVE");
        formRecord.setSubmitterId(requesterId);
        formRecord.setFormData("{}");

        Employee submitter = new Employee();
        submitter.setId(requesterId);
        submitter.setName("Test User");
        submitter.setDepartmentId(departmentId);

        Department department = new Department();
        department.setId(departmentId);
        department.setName("Engineering");

        Employee requester = new Employee();
        requester.setId(requesterId);
        requester.setName("User");
        requester.setRoleCode("employee");

        when(formRecordMapper.selectById(formId)).thenReturn(formRecord);
        when(employeeMapper.selectById(requesterId)).thenReturn(requester);
        when(employeeMapper.selectById(submitter.getId())).thenReturn(submitter);
        when(departmentMapper.selectById(departmentId)).thenReturn(department);
        when(approvalFlowService.canApprove(any(), any())).thenReturn(false);
        when(approvalRecordMapper.findByFormId(any())).thenReturn(Collections.emptyList());

        // When
        FormRecordResponse result = formService.getDetail(formId, requesterId);

        // Then
        assertThat(result.submitter()).isEqualTo("Test User");
        assertThat(result.department()).isEqualTo("Engineering");
    }

    @Test
    @DisplayName("提交人信息 - 部门为空时应返回空字符串")
    void buildResponse_nullDepartment_shouldReturnEmptyString() {
        // Given
        Long formId = 100L;
        Long requesterId = 1L;

        FormRecord formRecord = new FormRecord();
        formRecord.setId(formId);
        formRecord.setFormType("LEAVE");
        formRecord.setSubmitterId(requesterId);
        formRecord.setFormData("{}");

        Employee submitter = new Employee();
        submitter.setId(requesterId);
        submitter.setName("Test User");
        submitter.setDepartmentId(null);

        Employee requester = new Employee();
        requester.setId(requesterId);
        requester.setName("User");
        requester.setRoleCode("employee");

        when(formRecordMapper.selectById(formId)).thenReturn(formRecord);
        when(employeeMapper.selectById(requesterId)).thenReturn(requester);
        when(employeeMapper.selectById(submitter.getId())).thenReturn(submitter);
        when(approvalFlowService.canApprove(any(), any())).thenReturn(false);
        when(approvalRecordMapper.findByFormId(any())).thenReturn(Collections.emptyList());

        // When
        FormRecordResponse result = formService.getDetail(formId, requesterId);

        // Then
        assertThat(result.department()).isEqualTo("");
    }

    private FormRecord createFormRecord(Long id, String formType, Long submitterId) {
        FormRecord record = new FormRecord();
        record.setId(id);
        record.setFormType(formType);
        record.setSubmitterId(submitterId);
        record.setFormData("{}");
        record.setCreatedAt(LocalDateTime.now());
        record.setStatus("PENDING");
        return record;
    }
}
