package com.oa.backend.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.oa.backend.dto.FormRecordResponse;
import com.oa.backend.entity.*;
import com.oa.backend.mapper.*;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

/** ApprovalFlowService 单元测试 覆盖：审批流初始化、审批推进（通过/驳回） */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@DisplayName("M4 - ApprovalFlowService")
class ApprovalFlowServiceTest {

  @InjectMocks private ApprovalFlowService service;

  @Mock private FormRecordMapper formRecordMapper;

  @Mock private ApprovalFlowDefMapper approvalFlowDefMapper;

  @Mock private ApprovalFlowNodeMapper approvalFlowNodeMapper;

  @Mock private ApprovalRecordMapper approvalRecordMapper;

  @Mock private EmployeeMapper employeeMapper;

  @Mock private DepartmentMapper departmentMapper;

  @Mock private OperationLogMapper operationLogMapper;

  @Mock private ObjectMapper objectMapper;

  @Mock private NotificationService notificationService;

  private static final Long TEST_FORM_ID = 1L;
  private static final Long TEST_FLOW_DEF_ID = 100L;
  private static final Long TEST_SUBMITTER_ID = 10L;
  private static final Long TEST_APPROVER_ID = 20L;

  // ─── initFlow ────────────────────────────────────────────────

  @Test
  @DisplayName("initFlow：无激活流程定义时抛出 IllegalStateException")
  void initFlow_noFlowDef() {
    when(approvalFlowDefMapper.findActiveByBusinessType("LEAVE")).thenReturn(null);

    IllegalStateException ex =
        assertThrows(
            IllegalStateException.class,
            () -> service.initFlow(TEST_FORM_ID, "LEAVE", TEST_SUBMITTER_ID));
    assertTrue(ex.getMessage().contains("未找到"));
  }

  @Test
  @DisplayName("initFlow：流程定义无节点时抛出 IllegalStateException")
  void initFlow_noNodes() {
    ApprovalFlowDef flowDef = createFlowDef(TEST_FLOW_DEF_ID, "LEAVE");
    when(approvalFlowDefMapper.findActiveByBusinessType("LEAVE")).thenReturn(flowDef);
    when(approvalFlowNodeMapper.findByFlowId(TEST_FLOW_DEF_ID)).thenReturn(Collections.emptyList());

    IllegalStateException ex =
        assertThrows(
            IllegalStateException.class,
            () -> service.initFlow(TEST_FORM_ID, "LEAVE", TEST_SUBMITTER_ID));
    assertTrue(ex.getMessage().contains("没有配置节点"));
  }

  @Test
  @DisplayName("initFlow：正常初始化，表单状态变为 PENDING，首个非跳过节点被分配")
  void initFlow_normal() {
    // Setup flow definition with 2 nodes
    ApprovalFlowDef flowDef = createFlowDef(TEST_FLOW_DEF_ID, "LEAVE");
    when(approvalFlowDefMapper.findActiveByBusinessType("LEAVE")).thenReturn(flowDef);

    ApprovalFlowNode node1 =
        createNode(
            1L, TEST_FLOW_DEF_ID, 1, "主管审批", "DESIGNATED", String.valueOf(TEST_APPROVER_ID), null);
    ApprovalFlowNode node2 = createNode(2L, TEST_FLOW_DEF_ID, 2, "HR审批", "DESIGNATED", "30", null);
    when(approvalFlowNodeMapper.findByFlowId(TEST_FLOW_DEF_ID))
        .thenReturn(Arrays.asList(node1, node2));

    // Setup form record
    FormRecord formRecord = createFormRecord(TEST_FORM_ID, "LEAVE", "DRAFT", TEST_SUBMITTER_ID);
    when(formRecordMapper.selectById(TEST_FORM_ID)).thenReturn(formRecord);

    // Setup submitter role
    Employee submitter = new Employee();
    submitter.setId(TEST_SUBMITTER_ID);
    submitter.setRoleCode("member");
    when(employeeMapper.selectById(TEST_SUBMITTER_ID)).thenReturn(submitter);

    service.initFlow(TEST_FORM_ID, "LEAVE", TEST_SUBMITTER_ID);

    // Verify form record updated
    ArgumentCaptor<FormRecord> captor = ArgumentCaptor.forClass(FormRecord.class);
    verify(formRecordMapper).updateById(captor.capture());
    FormRecord updated = captor.getValue();
    assertEquals("PENDING", updated.getStatus());
    assertEquals(1, updated.getCurrentNodeOrder());
    assertNotNull(updated.getUpdatedAt());
  }

  // ─── advance ─────────────────────────────────────────────────

  @Test
  @DisplayName("advance：审批通过移动到下一节点")
  void advance_approve_moves_to_next_node() {
    // Setup form record
    FormRecord formRecord = createFormRecord(TEST_FORM_ID, "LEAVE", "PENDING", TEST_SUBMITTER_ID);
    formRecord.setCurrentNodeOrder(1);
    when(formRecordMapper.selectById(TEST_FORM_ID)).thenReturn(formRecord);

    // Setup flow def
    ApprovalFlowDef flowDef = createFlowDef(TEST_FLOW_DEF_ID, "LEAVE");
    when(approvalFlowDefMapper.findActiveByBusinessType("LEAVE")).thenReturn(flowDef);

    // Setup nodes - 2 approval nodes
    ApprovalFlowNode node1 =
        createNode(
            1L, TEST_FLOW_DEF_ID, 1, "主管审批", "DESIGNATED", String.valueOf(TEST_APPROVER_ID), null);
    ApprovalFlowNode node2 = createNode(2L, TEST_FLOW_DEF_ID, 2, "HR审批", "DESIGNATED", "30", null);
    when(approvalFlowNodeMapper.findByFlowIdAndNodeOrder(TEST_FLOW_DEF_ID, 1)).thenReturn(node1);
    when(approvalFlowNodeMapper.findByFlowId(TEST_FLOW_DEF_ID))
        .thenReturn(Arrays.asList(node1, node2));

    // Setup employee mocks for canApprove and buildFormRecordResponse
    Employee approver = new Employee();
    approver.setId(TEST_APPROVER_ID);
    when(employeeMapper.selectById(TEST_APPROVER_ID)).thenReturn(approver);
    when(employeeMapper.selectById(TEST_SUBMITTER_ID)).thenReturn(approver);

    // Execute
    FormRecordResponse result = service.advance(TEST_FORM_ID, TEST_APPROVER_ID, "APPROVE", "同意");

    // Verify approval record inserted
    ArgumentCaptor<ApprovalRecord> recordCaptor = ArgumentCaptor.forClass(ApprovalRecord.class);
    verify(approvalRecordMapper).insert(recordCaptor.capture());
    ApprovalRecord approvalRecord = recordCaptor.getValue();
    assertEquals(TEST_FORM_ID, approvalRecord.getFormId());
    assertEquals(1, approvalRecord.getNodeOrder());
    assertEquals(TEST_APPROVER_ID, approvalRecord.getApproverId());
    assertEquals("APPROVE", approvalRecord.getAction());

    // Verify form moved to next node
    ArgumentCaptor<FormRecord> formCaptor = ArgumentCaptor.forClass(FormRecord.class);
    verify(formRecordMapper, atLeastOnce()).updateById(formCaptor.capture());
    FormRecord updatedForm = formCaptor.getAllValues().get(formCaptor.getAllValues().size() - 1);
    assertEquals("APPROVING", updatedForm.getStatus());
    assertEquals(2, updatedForm.getCurrentNodeOrder());
  }

  @Test
  @DisplayName("advance：最后一个节点审批通过，表单变为 APPROVED")
  void advance_approve_last_node_completes_form() {
    // Setup form record - at last node
    FormRecord formRecord = createFormRecord(TEST_FORM_ID, "LEAVE", "APPROVING", TEST_SUBMITTER_ID);
    formRecord.setCurrentNodeOrder(1);
    when(formRecordMapper.selectById(TEST_FORM_ID)).thenReturn(formRecord);

    // Setup flow def
    ApprovalFlowDef flowDef = createFlowDef(TEST_FLOW_DEF_ID, "LEAVE");
    when(approvalFlowDefMapper.findActiveByBusinessType("LEAVE")).thenReturn(flowDef);

    // Setup single node (last node)
    ApprovalFlowNode node1 =
        createNode(
            1L, TEST_FLOW_DEF_ID, 1, "主管审批", "DESIGNATED", String.valueOf(TEST_APPROVER_ID), null);
    when(approvalFlowNodeMapper.findByFlowIdAndNodeOrder(TEST_FLOW_DEF_ID, 1)).thenReturn(node1);
    when(approvalFlowNodeMapper.findByFlowId(TEST_FLOW_DEF_ID))
        .thenReturn(Collections.singletonList(node1));

    // Setup employee mocks
    Employee approver = new Employee();
    approver.setId(TEST_APPROVER_ID);
    when(employeeMapper.selectById(TEST_APPROVER_ID)).thenReturn(approver);
    when(employeeMapper.selectById(TEST_SUBMITTER_ID)).thenReturn(approver);

    // Execute
    FormRecordResponse result =
        service.advance(TEST_FORM_ID, TEST_APPROVER_ID, "APPROVE", "最终审批通过");

    // Verify form completed
    ArgumentCaptor<FormRecord> formCaptor = ArgumentCaptor.forClass(FormRecord.class);
    verify(formRecordMapper, atLeastOnce()).updateById(formCaptor.capture());
    FormRecord updatedForm = formCaptor.getAllValues().get(formCaptor.getAllValues().size() - 1);
    assertEquals("APPROVED", updatedForm.getStatus());
  }

  @Test
  @DisplayName("advance：审批驳回，表单变为 REJECTED")
  void advance_reject() {
    // Setup form record
    FormRecord formRecord = createFormRecord(TEST_FORM_ID, "LEAVE", "PENDING", TEST_SUBMITTER_ID);
    formRecord.setCurrentNodeOrder(1);
    when(formRecordMapper.selectById(TEST_FORM_ID)).thenReturn(formRecord);

    // Setup flow def
    ApprovalFlowDef flowDef = createFlowDef(TEST_FLOW_DEF_ID, "LEAVE");
    when(approvalFlowDefMapper.findActiveByBusinessType("LEAVE")).thenReturn(flowDef);

    // Setup node
    ApprovalFlowNode node1 =
        createNode(
            1L, TEST_FLOW_DEF_ID, 1, "主管审批", "DESIGNATED", String.valueOf(TEST_APPROVER_ID), null);
    when(approvalFlowNodeMapper.findByFlowIdAndNodeOrder(TEST_FLOW_DEF_ID, 1)).thenReturn(node1);
    when(approvalFlowNodeMapper.findByFlowId(TEST_FLOW_DEF_ID))
        .thenReturn(Collections.singletonList(node1));

    // Setup employee mocks
    Employee approver = new Employee();
    approver.setId(TEST_APPROVER_ID);
    when(employeeMapper.selectById(TEST_APPROVER_ID)).thenReturn(approver);
    when(employeeMapper.selectById(TEST_SUBMITTER_ID)).thenReturn(approver);

    // Execute
    FormRecordResponse result = service.advance(TEST_FORM_ID, TEST_APPROVER_ID, "REJECT", "信息不完整");

    // Verify approval record
    ArgumentCaptor<ApprovalRecord> recordCaptor = ArgumentCaptor.forClass(ApprovalRecord.class);
    verify(approvalRecordMapper).insert(recordCaptor.capture());
    assertEquals("REJECT", recordCaptor.getValue().getAction());

    // Verify form rejected
    ArgumentCaptor<FormRecord> formCaptor = ArgumentCaptor.forClass(FormRecord.class);
    verify(formRecordMapper, atLeastOnce()).updateById(formCaptor.capture());
    FormRecord updatedForm = formCaptor.getAllValues().get(formCaptor.getAllValues().size() - 1);
    assertEquals("REJECTED", updatedForm.getStatus());
  }

  // ─── Additional Tests for Coverage ───────────────────────────

  @Test
  @DisplayName("initFlow：skipCondition 为 null 或空时不跳过")
  void initFlow_nullSkipCondition_noSkip() {
    // Setup flow definition
    ApprovalFlowDef flowDef = createFlowDef(TEST_FLOW_DEF_ID, "LEAVE");
    when(approvalFlowDefMapper.findActiveByBusinessType("LEAVE")).thenReturn(flowDef);

    // Setup nodes with null and empty skip conditions
    ApprovalFlowNode node1 = createNode(1L, TEST_FLOW_DEF_ID, 1, "主管审批", "DESIGNATED", "20", null);
    ApprovalFlowNode node2 = createNode(2L, TEST_FLOW_DEF_ID, 2, "HR审批", "DESIGNATED", "30", "");
    when(approvalFlowNodeMapper.findByFlowId(TEST_FLOW_DEF_ID))
        .thenReturn(Arrays.asList(node1, node2));

    // Setup form record
    FormRecord formRecord = createFormRecord(TEST_FORM_ID, "LEAVE", "DRAFT", TEST_SUBMITTER_ID);
    when(formRecordMapper.selectById(TEST_FORM_ID)).thenReturn(formRecord);

    // Setup submitter
    Employee submitter = new Employee();
    submitter.setId(TEST_SUBMITTER_ID);
    submitter.setRoleCode("ceo");
    when(employeeMapper.selectById(TEST_SUBMITTER_ID)).thenReturn(submitter);

    service.initFlow(TEST_FORM_ID, "LEAVE", TEST_SUBMITTER_ID);

    // Verify no skip records were inserted
    verify(approvalRecordMapper, never())
        .insert(argThat(record -> "SKIP".equals(record.getAction())));
  }

  @Test
  @DisplayName("initFlow：skipCondition JSON 解析失败不中断流程")
  void initFlow_invalidSkipConditionJson_noSkip() {
    // Setup flow definition
    ApprovalFlowDef flowDef = createFlowDef(TEST_FLOW_DEF_ID, "LEAVE");
    when(approvalFlowDefMapper.findActiveByBusinessType("LEAVE")).thenReturn(flowDef);

    // Setup node with invalid JSON skip condition
    ApprovalFlowNode node1 =
        createNode(1L, TEST_FLOW_DEF_ID, 1, "主管审批", "DESIGNATED", "20", "invalid json");
    when(approvalFlowNodeMapper.findByFlowId(TEST_FLOW_DEF_ID))
        .thenReturn(Collections.singletonList(node1));

    // Setup form record
    FormRecord formRecord = createFormRecord(TEST_FORM_ID, "LEAVE", "DRAFT", TEST_SUBMITTER_ID);
    when(formRecordMapper.selectById(TEST_FORM_ID)).thenReturn(formRecord);

    // Setup submitter
    Employee submitter = new Employee();
    submitter.setId(TEST_SUBMITTER_ID);
    submitter.setRoleCode("ceo");
    when(employeeMapper.selectById(TEST_SUBMITTER_ID)).thenReturn(submitter);

    service.initFlow(TEST_FORM_ID, "LEAVE", TEST_SUBMITTER_ID);

    // Verify form starts at node 1 (skip condition parsing failed)
    ArgumentCaptor<FormRecord> captor = ArgumentCaptor.forClass(FormRecord.class);
    verify(formRecordMapper).updateById(captor.capture());
    FormRecord updated = captor.getValue();
    assertEquals(1, updated.getCurrentNodeOrder());
  }

  @Test
  @DisplayName("canApprove：表单不存在返回 false")
  void canApprove_formNotFound_returnsFalse() {
    when(formRecordMapper.selectById(TEST_FORM_ID)).thenReturn(null);

    boolean result = service.canApprove(TEST_FORM_ID, TEST_APPROVER_ID);

    assertFalse(result);
  }

  @Test
  @DisplayName("canApprove：非 PENDING/APPROVING 状态返回 false")
  void canApprove_invalidStatus_returnsFalse() {
    FormRecord formRecord = createFormRecord(TEST_FORM_ID, "LEAVE", "DRAFT", TEST_SUBMITTER_ID);
    when(formRecordMapper.selectById(TEST_FORM_ID)).thenReturn(formRecord);

    boolean result = service.canApprove(TEST_FORM_ID, TEST_APPROVER_ID);

    assertFalse(result);
  }

  @Test
  @DisplayName("canApprove：无激活审批流定义返回 false")
  void canApprove_noFlowDef_returnsFalse() {
    FormRecord formRecord = createFormRecord(TEST_FORM_ID, "LEAVE", "PENDING", TEST_SUBMITTER_ID);
    when(formRecordMapper.selectById(TEST_FORM_ID)).thenReturn(formRecord);
    when(approvalFlowDefMapper.findActiveByBusinessType("LEAVE")).thenReturn(null);

    boolean result = service.canApprove(TEST_FORM_ID, TEST_APPROVER_ID);

    assertFalse(result);
  }

  @Test
  @DisplayName("canApprove：当前节点不存在返回 false")
  void canApprove_noCurrentNode_returnsFalse() {
    FormRecord formRecord = createFormRecord(TEST_FORM_ID, "LEAVE", "PENDING", TEST_SUBMITTER_ID);
    formRecord.setCurrentNodeOrder(1);
    when(formRecordMapper.selectById(TEST_FORM_ID)).thenReturn(formRecord);

    ApprovalFlowDef flowDef = createFlowDef(TEST_FLOW_DEF_ID, "LEAVE");
    when(approvalFlowDefMapper.findActiveByBusinessType("LEAVE")).thenReturn(flowDef);
    when(approvalFlowNodeMapper.findByFlowIdAndNodeOrder(TEST_FLOW_DEF_ID, 1)).thenReturn(null);

    boolean result = service.canApprove(TEST_FORM_ID, TEST_APPROVER_ID);

    assertFalse(result);
  }

  @Test
  @DisplayName("canApprove：DIRECT_SUPERVISOR 类型审批人解析")
  void canApprove_directSupervisorApproverType() {
    FormRecord formRecord = createFormRecord(TEST_FORM_ID, "LEAVE", "PENDING", TEST_SUBMITTER_ID);
    formRecord.setCurrentNodeOrder(1);
    when(formRecordMapper.selectById(TEST_FORM_ID)).thenReturn(formRecord);

    ApprovalFlowDef flowDef = createFlowDef(TEST_FLOW_DEF_ID, "LEAVE");
    when(approvalFlowDefMapper.findActiveByBusinessType("LEAVE")).thenReturn(flowDef);

    ApprovalFlowNode node =
        createNode(1L, TEST_FLOW_DEF_ID, 1, "主管审批", "DIRECT_SUPERVISOR", null, null);
    when(approvalFlowNodeMapper.findByFlowIdAndNodeOrder(TEST_FLOW_DEF_ID, 1)).thenReturn(node);

    Employee submitter = new Employee();
    submitter.setId(TEST_SUBMITTER_ID);
    submitter.setDirectSupervisorId(TEST_APPROVER_ID);
    when(employeeMapper.selectById(TEST_SUBMITTER_ID)).thenReturn(submitter);

    Employee supervisor = new Employee();
    supervisor.setId(TEST_APPROVER_ID);
    supervisor.setDeleted(0);
    when(employeeMapper.selectById(TEST_APPROVER_ID)).thenReturn(supervisor);

    boolean result = service.canApprove(TEST_FORM_ID, TEST_APPROVER_ID);

    assertTrue(result);
  }

  @Test
  @DisplayName("canApprove：ROLE 类型审批人解析")
  void canApprove_roleApproverType() {
    FormRecord formRecord = createFormRecord(TEST_FORM_ID, "LEAVE", "PENDING", TEST_SUBMITTER_ID);
    formRecord.setCurrentNodeOrder(1);
    when(formRecordMapper.selectById(TEST_FORM_ID)).thenReturn(formRecord);

    ApprovalFlowDef flowDef = createFlowDef(TEST_FLOW_DEF_ID, "LEAVE");
    when(approvalFlowDefMapper.findActiveByBusinessType("LEAVE")).thenReturn(flowDef);

    ApprovalFlowNode node = createNode(1L, TEST_FLOW_DEF_ID, 1, "CEO审批", "ROLE", "ceo", null);
    when(approvalFlowNodeMapper.findByFlowIdAndNodeOrder(TEST_FLOW_DEF_ID, 1)).thenReturn(node);

    Employee ceo = new Employee();
    ceo.setId(TEST_APPROVER_ID);
    ceo.setRoleCode("ceo");
    ceo.setAccountStatus("ACTIVE");
    ceo.setDeleted(0);
    when(employeeMapper.selectOne(any())).thenReturn(ceo);

    boolean result = service.canApprove(TEST_FORM_ID, TEST_APPROVER_ID);

    assertTrue(result);
  }

  @Test
  @DisplayName("canApprove：DESIGNATED 类型审批人 ID 格式错误返回 false")
  void canApprove_designatedInvalidId_returnsFalse() {
    FormRecord formRecord = createFormRecord(TEST_FORM_ID, "LEAVE", "PENDING", TEST_SUBMITTER_ID);
    formRecord.setCurrentNodeOrder(1);
    when(formRecordMapper.selectById(TEST_FORM_ID)).thenReturn(formRecord);

    ApprovalFlowDef flowDef = createFlowDef(TEST_FLOW_DEF_ID, "LEAVE");
    when(approvalFlowDefMapper.findActiveByBusinessType("LEAVE")).thenReturn(flowDef);

    ApprovalFlowNode node =
        createNode(1L, TEST_FLOW_DEF_ID, 1, "指定审批", "DESIGNATED", "invalid_id", null);
    when(approvalFlowNodeMapper.findByFlowIdAndNodeOrder(TEST_FLOW_DEF_ID, 1)).thenReturn(node);

    boolean result = service.canApprove(TEST_FORM_ID, TEST_APPROVER_ID);

    assertFalse(result);
  }

  @Test
  @DisplayName("advance：表单不存在抛出 IllegalStateException")
  void advance_formNotFound_throwsException() {
    when(formRecordMapper.selectById(TEST_FORM_ID)).thenReturn(null);

    IllegalStateException ex =
        assertThrows(
            IllegalStateException.class,
            () -> service.advance(TEST_FORM_ID, TEST_APPROVER_ID, "APPROVE", "同意"));
    assertTrue(ex.getMessage().contains("不存在"));
  }

  @Test
  @DisplayName("advance：非 PENDING/APPROVING 状态抛出 IllegalStateException")
  void advance_invalidStatus_throwsException() {
    FormRecord formRecord = createFormRecord(TEST_FORM_ID, "LEAVE", "APPROVED", TEST_SUBMITTER_ID);
    when(formRecordMapper.selectById(TEST_FORM_ID)).thenReturn(formRecord);

    IllegalStateException ex =
        assertThrows(
            IllegalStateException.class,
            () -> service.advance(TEST_FORM_ID, TEST_APPROVER_ID, "APPROVE", "同意"));
    assertTrue(ex.getMessage().contains("不允许审批"));
  }

  @Test
  @DisplayName("advance：无审批权限抛出 IllegalStateException")
  void advance_noPermission_throwsException() {
    FormRecord formRecord = createFormRecord(TEST_FORM_ID, "LEAVE", "PENDING", TEST_SUBMITTER_ID);
    formRecord.setCurrentNodeOrder(1);
    when(formRecordMapper.selectById(TEST_FORM_ID)).thenReturn(formRecord);
    when(approvalFlowDefMapper.findActiveByBusinessType("LEAVE")).thenReturn(null);

    IllegalStateException ex =
        assertThrows(
            IllegalStateException.class,
            () -> service.advance(TEST_FORM_ID, TEST_APPROVER_ID, "APPROVE", "同意"));
    assertTrue(ex.getMessage().contains("没有权限"));
  }

  @Test
  @DisplayName("resolveDirectSupervisor：员工不存在回退到 CEO")
  void resolveDirectSupervisor_employeeNotFound_fallbackToCEO() {
    when(employeeMapper.selectById(TEST_SUBMITTER_ID)).thenReturn(null);

    Employee ceo = new Employee();
    ceo.setId(100L);
    ceo.setRoleCode("ceo");
    ceo.setAccountStatus("ACTIVE");
    ceo.setDeleted(0);
    when(employeeMapper.selectOne(any())).thenReturn(ceo);

    FormRecord formRecord = createFormRecord(TEST_FORM_ID, "LEAVE", "PENDING", TEST_SUBMITTER_ID);
    formRecord.setCurrentNodeOrder(1);
    when(formRecordMapper.selectById(TEST_FORM_ID)).thenReturn(formRecord);

    ApprovalFlowDef flowDef = createFlowDef(TEST_FLOW_DEF_ID, "LEAVE");
    when(approvalFlowDefMapper.findActiveByBusinessType("LEAVE")).thenReturn(flowDef);

    ApprovalFlowNode node =
        createNode(1L, TEST_FLOW_DEF_ID, 1, "主管审批", "DIRECT_SUPERVISOR", null, null);
    when(approvalFlowNodeMapper.findByFlowIdAndNodeOrder(TEST_FLOW_DEF_ID, 1)).thenReturn(node);

    boolean result = service.canApprove(TEST_FORM_ID, 100L);

    assertTrue(result);
  }

  @Test
  @DisplayName("resolveDirectSupervisor：直属领导已删除回退到 CEO")
  void resolveDirectSupervisor_supervisorDeleted_fallbackToCEO() {
    Employee submitter = new Employee();
    submitter.setId(TEST_SUBMITTER_ID);
    submitter.setDirectSupervisorId(50L);
    when(employeeMapper.selectById(TEST_SUBMITTER_ID)).thenReturn(submitter);

    Employee supervisor = new Employee();
    supervisor.setId(50L);
    supervisor.setDeleted(1); // Deleted
    when(employeeMapper.selectById(50L)).thenReturn(supervisor);

    Employee ceo = new Employee();
    ceo.setId(100L);
    ceo.setRoleCode("ceo");
    ceo.setAccountStatus("ACTIVE");
    ceo.setDeleted(0);
    when(employeeMapper.selectOne(any())).thenReturn(ceo);

    FormRecord formRecord = createFormRecord(TEST_FORM_ID, "LEAVE", "PENDING", TEST_SUBMITTER_ID);
    formRecord.setCurrentNodeOrder(1);
    when(formRecordMapper.selectById(TEST_FORM_ID)).thenReturn(formRecord);

    ApprovalFlowDef flowDef = createFlowDef(TEST_FLOW_DEF_ID, "LEAVE");
    when(approvalFlowDefMapper.findActiveByBusinessType("LEAVE")).thenReturn(flowDef);

    ApprovalFlowNode node =
        createNode(1L, TEST_FLOW_DEF_ID, 1, "主管审批", "DIRECT_SUPERVISOR", null, null);
    when(approvalFlowNodeMapper.findByFlowIdAndNodeOrder(TEST_FLOW_DEF_ID, 1)).thenReturn(node);

    boolean result = service.canApprove(TEST_FORM_ID, 100L);

    assertTrue(result);
  }

  @Test
  @DisplayName("resolveRoleApprover：未找到角色对应员工回退到 CEO")
  void resolveRoleApprover_noEmployeeFound_fallbackToCEO() {
    FormRecord formRecord = createFormRecord(TEST_FORM_ID, "LEAVE", "PENDING", TEST_SUBMITTER_ID);
    formRecord.setCurrentNodeOrder(1);
    when(formRecordMapper.selectById(TEST_FORM_ID)).thenReturn(formRecord);

    ApprovalFlowDef flowDef = createFlowDef(TEST_FLOW_DEF_ID, "LEAVE");
    when(approvalFlowDefMapper.findActiveByBusinessType("LEAVE")).thenReturn(flowDef);

    ApprovalFlowNode node =
        createNode(1L, TEST_FLOW_DEF_ID, 1, "角色审批", "ROLE", "nonexistent_role", null);
    when(approvalFlowNodeMapper.findByFlowIdAndNodeOrder(TEST_FLOW_DEF_ID, 1)).thenReturn(node);

    when(employeeMapper.selectOne(any()))
        .thenReturn(null)
        .thenReturn(null); // First for role, second for CEO

    boolean result = service.canApprove(TEST_FORM_ID, TEST_APPROVER_ID);

    assertFalse(result);
  }

  @Test
  @DisplayName("resolveRoleApprover：空角色编码回退到 CEO")
  void resolveRoleApprover_emptyRoleCode_fallbackToCEO() {
    FormRecord formRecord = createFormRecord(TEST_FORM_ID, "LEAVE", "PENDING", TEST_SUBMITTER_ID);
    formRecord.setCurrentNodeOrder(1);
    when(formRecordMapper.selectById(TEST_FORM_ID)).thenReturn(formRecord);

    ApprovalFlowDef flowDef = createFlowDef(TEST_FLOW_DEF_ID, "LEAVE");
    when(approvalFlowDefMapper.findActiveByBusinessType("LEAVE")).thenReturn(flowDef);

    ApprovalFlowNode node = createNode(1L, TEST_FLOW_DEF_ID, 1, "角色审批", "ROLE", "", null);
    when(approvalFlowNodeMapper.findByFlowIdAndNodeOrder(TEST_FLOW_DEF_ID, 1)).thenReturn(node);

    Employee ceo = new Employee();
    ceo.setId(TEST_APPROVER_ID);
    ceo.setRoleCode("ceo");
    ceo.setAccountStatus("ACTIVE");
    ceo.setDeleted(0);
    when(employeeMapper.selectOne(any())).thenReturn(ceo);

    boolean result = service.canApprove(TEST_FORM_ID, TEST_APPROVER_ID);

    assertTrue(result);
  }

  @Test
  @DisplayName("advance：记录操作日志")
  void advance_writesOperationLog() {
    FormRecord formRecord = createFormRecord(TEST_FORM_ID, "LEAVE", "PENDING", TEST_SUBMITTER_ID);
    formRecord.setCurrentNodeOrder(1);
    when(formRecordMapper.selectById(TEST_FORM_ID)).thenReturn(formRecord);

    ApprovalFlowDef flowDef = createFlowDef(TEST_FLOW_DEF_ID, "LEAVE");
    when(approvalFlowDefMapper.findActiveByBusinessType("LEAVE")).thenReturn(flowDef);

    ApprovalFlowNode node =
        createNode(
            1L, TEST_FLOW_DEF_ID, 1, "审批", "DESIGNATED", String.valueOf(TEST_APPROVER_ID), null);
    when(approvalFlowNodeMapper.findByFlowIdAndNodeOrder(TEST_FLOW_DEF_ID, 1)).thenReturn(node);
    when(approvalFlowNodeMapper.findByFlowId(TEST_FLOW_DEF_ID))
        .thenReturn(Collections.singletonList(node));

    Employee approver = new Employee();
    approver.setId(TEST_APPROVER_ID);
    when(employeeMapper.selectById(TEST_APPROVER_ID)).thenReturn(approver);
    when(employeeMapper.selectById(TEST_SUBMITTER_ID)).thenReturn(approver);

    service.advance(TEST_FORM_ID, TEST_APPROVER_ID, "APPROVE", "同意");

    verify(operationLogMapper, times(1)).insert(any(OperationLog.class));
  }

  // ─── Additional Tests for Uncovered Code Paths ───────────────

  @Test
  @DisplayName("getTodo：成功返回员工可以审批的表单列表")
  void getTodo_success_returnsFormsEmployeeCanApprove() {
    Long employeeId = 1L;

    // Setup: Two pending forms
    FormRecord form1 = createFormRecord(1L, "LEAVE", "PENDING", TEST_SUBMITTER_ID);
    form1.setCurrentNodeOrder(1);
    FormRecord form2 = createFormRecord(2L, "OVERTIME", "APPROVING", TEST_SUBMITTER_ID);
    form2.setCurrentNodeOrder(1);

    when(formRecordMapper.selectList(any())).thenReturn(Arrays.asList(form1, form2));

    // Setup canApprove mocks for form1
    ApprovalFlowDef flowDef1 = createFlowDef(TEST_FLOW_DEF_ID, "LEAVE");
    when(approvalFlowDefMapper.findActiveByBusinessType("LEAVE")).thenReturn(flowDef1);
    when(formRecordMapper.selectById(1L)).thenReturn(form1);
    when(approvalFlowNodeMapper.findByFlowIdAndNodeOrder(TEST_FLOW_DEF_ID, 1))
        .thenReturn(
            createNode(
                1L, TEST_FLOW_DEF_ID, 1, "主管审批", "DESIGNATED", String.valueOf(employeeId), null));

    // Setup canApprove mocks for form2
    ApprovalFlowDef flowDef2 = createFlowDef(TEST_FLOW_DEF_ID + 1, "OVERTIME");
    when(approvalFlowDefMapper.findActiveByBusinessType("OVERTIME")).thenReturn(flowDef2);
    when(formRecordMapper.selectById(2L)).thenReturn(form2);
    when(approvalFlowNodeMapper.findByFlowIdAndNodeOrder(TEST_FLOW_DEF_ID + 1, 1))
        .thenReturn(
            createNode(
                2L,
                TEST_FLOW_DEF_ID + 1,
                1,
                "经理审批",
                "DESIGNATED",
                String.valueOf(employeeId),
                null));

    // Setup buildFormRecordResponse mocks
    Employee submitter = new Employee();
    submitter.setId(TEST_SUBMITTER_ID);
    submitter.setName("提交人");
    when(employeeMapper.selectById(TEST_SUBMITTER_ID)).thenReturn(submitter);
    when(approvalRecordMapper.findByFormId(any())).thenReturn(Collections.emptyList());

    List<FormRecordResponse> result = service.getTodo(employeeId);

    assertEquals(2, result.size());
  }

  @Test
  @DisplayName("getTodo：canApprove返回false时返回空列表")
  void getTodo_canApproveFalse_returnsEmptyList() {
    Long employeeId = 1L;

    // Setup: One pending form
    FormRecord form = createFormRecord(1L, "LEAVE", "PENDING", TEST_SUBMITTER_ID);
    form.setCurrentNodeOrder(1);

    when(formRecordMapper.selectList(any())).thenReturn(Collections.singletonList(form));

    // Setup: form not found in canApprove check
    when(formRecordMapper.selectById(1L)).thenReturn(null);

    List<FormRecordResponse> result = service.getTodo(employeeId);

    assertTrue(result.isEmpty());
  }

  @Test
  @DisplayName("resolveDirectSupervisor：成功解析有效的直属领导")
  void resolveDirectSupervisor_validSupervisor_canApproveReturnsTrue() {
    Long submitterId = 10L;
    Long supervisorId = 2L;

    FormRecord formRecord = createFormRecord(TEST_FORM_ID, "LEAVE", "PENDING", submitterId);
    formRecord.setCurrentNodeOrder(1);
    when(formRecordMapper.selectById(TEST_FORM_ID)).thenReturn(formRecord);

    ApprovalFlowDef flowDef = createFlowDef(TEST_FLOW_DEF_ID, "LEAVE");
    when(approvalFlowDefMapper.findActiveByBusinessType("LEAVE")).thenReturn(flowDef);

    // Node requires DIRECT_SUPERVISOR
    ApprovalFlowNode node =
        createNode(1L, TEST_FLOW_DEF_ID, 1, "主管审批", "DIRECT_SUPERVISOR", null, null);
    when(approvalFlowNodeMapper.findByFlowIdAndNodeOrder(TEST_FLOW_DEF_ID, 1)).thenReturn(node);

    // Submitter has directSupervisorId=2L
    Employee submitter = new Employee();
    submitter.setId(submitterId);
    submitter.setDirectSupervisorId(supervisorId);
    when(employeeMapper.selectById(submitterId)).thenReturn(submitter);

    // Supervisor is valid (deleted=0)
    Employee supervisor = new Employee();
    supervisor.setId(supervisorId);
    supervisor.setDeleted(0);
    when(employeeMapper.selectById(supervisorId)).thenReturn(supervisor);

    // The supervisor should be able to approve
    boolean result = service.canApprove(TEST_FORM_ID, supervisorId);

    assertTrue(result);
  }

  @Test
  @DisplayName("resolveRoleApprover：成功找到具有角色的员工")
  void resolveRoleApprover_validRoleEmployee_canApproveReturnsTrue() {
    Long roleEmployeeId = 3L;

    FormRecord formRecord = createFormRecord(TEST_FORM_ID, "LEAVE", "PENDING", TEST_SUBMITTER_ID);
    formRecord.setCurrentNodeOrder(1);
    when(formRecordMapper.selectById(TEST_FORM_ID)).thenReturn(formRecord);

    ApprovalFlowDef flowDef = createFlowDef(TEST_FLOW_DEF_ID, "LEAVE");
    when(approvalFlowDefMapper.findActiveByBusinessType("LEAVE")).thenReturn(flowDef);

    // Node requires ROLE approver with role="manager"
    ApprovalFlowNode node = createNode(1L, TEST_FLOW_DEF_ID, 1, "经理审批", "ROLE", "manager", null);
    when(approvalFlowNodeMapper.findByFlowIdAndNodeOrder(TEST_FLOW_DEF_ID, 1)).thenReturn(node);

    // Employee with role=manager found
    Employee roleEmployee = new Employee();
    roleEmployee.setId(roleEmployeeId);
    roleEmployee.setRoleCode("manager");
    roleEmployee.setAccountStatus("ACTIVE");
    roleEmployee.setDeleted(0);
    when(employeeMapper.selectOne(any())).thenReturn(roleEmployee);

    // The role employee should be able to approve
    boolean result = service.canApprove(TEST_FORM_ID, roleEmployeeId);

    assertTrue(result);
  }

  @Test
  @DisplayName("resolveApproverId：DESIGNATED类型使用有效的ID")
  void resolveApproverId_designatedValidId_canApproveReturnsTrue() {
    Long designatedApproverId = 5L;

    FormRecord formRecord = createFormRecord(TEST_FORM_ID, "LEAVE", "PENDING", TEST_SUBMITTER_ID);
    formRecord.setCurrentNodeOrder(1);
    when(formRecordMapper.selectById(TEST_FORM_ID)).thenReturn(formRecord);

    ApprovalFlowDef flowDef = createFlowDef(TEST_FLOW_DEF_ID, "LEAVE");
    when(approvalFlowDefMapper.findActiveByBusinessType("LEAVE")).thenReturn(flowDef);

    // Node requires DESIGNATED approver with ID=5
    ApprovalFlowNode node =
        createNode(
            1L,
            TEST_FLOW_DEF_ID,
            1,
            "指定审批",
            "DESIGNATED",
            String.valueOf(designatedApproverId),
            null);
    when(approvalFlowNodeMapper.findByFlowIdAndNodeOrder(TEST_FLOW_DEF_ID, 1)).thenReturn(node);

    // The designated employee should be able to approve
    boolean result = service.canApprove(TEST_FORM_ID, designatedApproverId);

    assertTrue(result);
  }

  @Test
  @DisplayName("buildFormRecordResponse：提交人有部门时正确返回部门名称")
  void buildFormRecordResponse_withDepartment_returnsDepartmentName() {
    Long departmentId = 1L;
    String departmentName = "研发部";

    // Setup form record at last node
    FormRecord formRecord = createFormRecord(TEST_FORM_ID, "LEAVE", "APPROVING", TEST_SUBMITTER_ID);
    formRecord.setCurrentNodeOrder(1);
    when(formRecordMapper.selectById(TEST_FORM_ID)).thenReturn(formRecord);

    ApprovalFlowDef flowDef = createFlowDef(TEST_FLOW_DEF_ID, "LEAVE");
    when(approvalFlowDefMapper.findActiveByBusinessType("LEAVE")).thenReturn(flowDef);

    // Single node (last node)
    ApprovalFlowNode node =
        createNode(
            1L, TEST_FLOW_DEF_ID, 1, "主管审批", "DESIGNATED", String.valueOf(TEST_APPROVER_ID), null);
    when(approvalFlowNodeMapper.findByFlowIdAndNodeOrder(TEST_FLOW_DEF_ID, 1)).thenReturn(node);
    when(approvalFlowNodeMapper.findByFlowId(TEST_FLOW_DEF_ID))
        .thenReturn(Collections.singletonList(node));

    // Submitter has department
    Employee submitter = new Employee();
    submitter.setId(TEST_SUBMITTER_ID);
    submitter.setName("张三");
    submitter.setDepartmentId(departmentId);
    when(employeeMapper.selectById(TEST_SUBMITTER_ID)).thenReturn(submitter);

    // Department exists
    Department dept = new Department();
    dept.setId(departmentId);
    dept.setName(departmentName);
    when(departmentMapper.selectById(departmentId)).thenReturn(dept);

    // Approver
    Employee approver = new Employee();
    approver.setId(TEST_APPROVER_ID);
    when(employeeMapper.selectById(TEST_APPROVER_ID)).thenReturn(approver);

    when(approvalRecordMapper.findByFormId(TEST_FORM_ID)).thenReturn(Collections.emptyList());

    FormRecordResponse result = service.advance(TEST_FORM_ID, TEST_APPROVER_ID, "APPROVE", "同意");

    assertEquals(departmentName, result.department());
  }

  @Test
  @DisplayName("getApprovalHistory：返回包含审批人名称的审批历史")
  void getApprovalHistory_withRecords_returnsHistoryWithApproverNames() {
    String approverName = "张三";

    // Setup form record at last node
    FormRecord formRecord = createFormRecord(TEST_FORM_ID, "LEAVE", "APPROVING", TEST_SUBMITTER_ID);
    formRecord.setCurrentNodeOrder(1);
    when(formRecordMapper.selectById(TEST_FORM_ID)).thenReturn(formRecord);

    ApprovalFlowDef flowDef = createFlowDef(TEST_FLOW_DEF_ID, "LEAVE");
    when(approvalFlowDefMapper.findActiveByBusinessType("LEAVE")).thenReturn(flowDef);

    // Single node (last node)
    ApprovalFlowNode node =
        createNode(
            1L, TEST_FLOW_DEF_ID, 1, "主管审批", "DESIGNATED", String.valueOf(TEST_APPROVER_ID), null);
    when(approvalFlowNodeMapper.findByFlowIdAndNodeOrder(TEST_FLOW_DEF_ID, 1)).thenReturn(node);
    when(approvalFlowNodeMapper.findByFlowId(TEST_FLOW_DEF_ID))
        .thenReturn(Collections.singletonList(node));

    // Existing approval record
    ApprovalRecord record = new ApprovalRecord();
    record.setFormId(TEST_FORM_ID);
    record.setApproverId(1L);
    record.setAction("APPROVE");
    record.setComment("OK");
    record.setNodeOrder(0);
    record.setActedAt(LocalDateTime.now());
    when(approvalRecordMapper.findByFormId(TEST_FORM_ID))
        .thenReturn(Collections.singletonList(record));

    // Approver name lookup — getApprovalHistory now uses selectBatchIds (batch query)
    Employee approver = new Employee();
    approver.setId(1L);
    approver.setName(approverName);
    when(employeeMapper.selectById(1L)).thenReturn(approver);
    when(employeeMapper.selectById(TEST_APPROVER_ID)).thenReturn(approver);
    when(employeeMapper.selectById(TEST_SUBMITTER_ID)).thenReturn(approver);
    when(employeeMapper.selectBatchIds(anyList())).thenReturn(Collections.singletonList(approver));

    FormRecordResponse result = service.advance(TEST_FORM_ID, TEST_APPROVER_ID, "APPROVE", "最终审批");

    assertNotNull(result.history());
    assertEquals(1, result.history().size());
    assertEquals(approverName, result.history().get(0).approver());
    assertEquals("APPROVE", result.history().get(0).action());
    assertEquals("OK", result.history().get(0).comment());
  }

  // ─── helpers ─────────────────────────────────────────────────

  private ApprovalFlowDef createFlowDef(Long id, String businessType) {
    ApprovalFlowDef def = new ApprovalFlowDef();
    def.setId(id);
    def.setBusinessType(businessType);
    def.setVersion(1);
    def.setIsActive(true);
    def.setCreatedAt(LocalDateTime.now());
    def.setUpdatedAt(LocalDateTime.now());
    def.setDeleted(0);
    return def;
  }

  private ApprovalFlowNode createNode(
      Long id,
      Long flowId,
      int nodeOrder,
      String nodeName,
      String approverType,
      String approverRef,
      String skipCondition) {
    ApprovalFlowNode node = new ApprovalFlowNode();
    node.setId(id);
    node.setFlowId(flowId);
    node.setNodeOrder(nodeOrder);
    node.setNodeName(nodeName);
    node.setApprovalMode("SEQUENTIAL");
    node.setApproverType(approverType);
    node.setApproverRef(approverRef);
    node.setSkipCondition(skipCondition);
    node.setCreatedAt(LocalDateTime.now());
    node.setUpdatedAt(LocalDateTime.now());
    node.setDeleted(0);
    return node;
  }

  private FormRecord createFormRecord(Long id, String formType, String status, Long submitterId) {
    FormRecord record = new FormRecord();
    record.setId(id);
    record.setFormType(formType);
    record.setStatus(status);
    record.setSubmitterId(submitterId);
    record.setCurrentNodeOrder(0);
    record.setCreatedAt(LocalDateTime.now());
    record.setUpdatedAt(LocalDateTime.now());
    record.setDeleted(0);
    return record;
  }
}
