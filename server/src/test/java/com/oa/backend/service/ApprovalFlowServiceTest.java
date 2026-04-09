package com.oa.backend.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.oa.backend.dto.FormRecordResponse;
import com.oa.backend.entity.*;
import com.oa.backend.mapper.*;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.quality.Strictness;
import org.mockito.junit.jupiter.MockitoSettings;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.Collections;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * ApprovalFlowService 单元测试
 * 覆盖：审批流初始化、审批推进（通过/驳回）
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@DisplayName("M4 - ApprovalFlowService")
class ApprovalFlowServiceTest {

    @InjectMocks
    private ApprovalFlowService service;

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
    private ObjectMapper objectMapper;

    private static final Long TEST_FORM_ID = 1L;
    private static final Long TEST_FLOW_DEF_ID = 100L;
    private static final Long TEST_SUBMITTER_ID = 10L;
    private static final Long TEST_APPROVER_ID = 20L;

    // ─── initFlow ────────────────────────────────────────────────

    @Test
    @DisplayName("initFlow：无激活流程定义时抛出 IllegalStateException")
    void initFlow_noFlowDef() {
        when(approvalFlowDefMapper.findActiveByBusinessType("LEAVE")).thenReturn(null);

        IllegalStateException ex = assertThrows(IllegalStateException.class,
                () -> service.initFlow(TEST_FORM_ID, "LEAVE", TEST_SUBMITTER_ID));
        assertTrue(ex.getMessage().contains("未找到"));
    }

    @Test
    @DisplayName("initFlow：流程定义无节点时抛出 IllegalStateException")
    void initFlow_noNodes() {
        ApprovalFlowDef flowDef = createFlowDef(TEST_FLOW_DEF_ID, "LEAVE");
        when(approvalFlowDefMapper.findActiveByBusinessType("LEAVE")).thenReturn(flowDef);
        when(approvalFlowNodeMapper.findByFlowId(TEST_FLOW_DEF_ID)).thenReturn(Collections.emptyList());

        IllegalStateException ex = assertThrows(IllegalStateException.class,
                () -> service.initFlow(TEST_FORM_ID, "LEAVE", TEST_SUBMITTER_ID));
        assertTrue(ex.getMessage().contains("没有配置节点"));
    }

    @Test
    @DisplayName("initFlow：正常初始化，表单状态变为 PENDING，首个非跳过节点被分配")
    void initFlow_normal() {
        // Setup flow definition with 2 nodes
        ApprovalFlowDef flowDef = createFlowDef(TEST_FLOW_DEF_ID, "LEAVE");
        when(approvalFlowDefMapper.findActiveByBusinessType("LEAVE")).thenReturn(flowDef);

        ApprovalFlowNode node1 = createNode(1L, TEST_FLOW_DEF_ID, 1, "主管审批", "DESIGNATED", String.valueOf(TEST_APPROVER_ID), null);
        ApprovalFlowNode node2 = createNode(2L, TEST_FLOW_DEF_ID, 2, "HR审批", "DESIGNATED", "30", null);
        when(approvalFlowNodeMapper.findByFlowId(TEST_FLOW_DEF_ID)).thenReturn(Arrays.asList(node1, node2));

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
        ApprovalFlowNode node1 = createNode(1L, TEST_FLOW_DEF_ID, 1, "主管审批", "DESIGNATED", String.valueOf(TEST_APPROVER_ID), null);
        ApprovalFlowNode node2 = createNode(2L, TEST_FLOW_DEF_ID, 2, "HR审批", "DESIGNATED", "30", null);
        when(approvalFlowNodeMapper.findByFlowIdAndNodeOrder(TEST_FLOW_DEF_ID, 1)).thenReturn(node1);
        when(approvalFlowNodeMapper.findByFlowId(TEST_FLOW_DEF_ID)).thenReturn(Arrays.asList(node1, node2));

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
        ApprovalFlowNode node1 = createNode(1L, TEST_FLOW_DEF_ID, 1, "主管审批", "DESIGNATED", String.valueOf(TEST_APPROVER_ID), null);
        when(approvalFlowNodeMapper.findByFlowIdAndNodeOrder(TEST_FLOW_DEF_ID, 1)).thenReturn(node1);
        when(approvalFlowNodeMapper.findByFlowId(TEST_FLOW_DEF_ID)).thenReturn(Collections.singletonList(node1));

        // Setup employee mocks
        Employee approver = new Employee();
        approver.setId(TEST_APPROVER_ID);
        when(employeeMapper.selectById(TEST_APPROVER_ID)).thenReturn(approver);
        when(employeeMapper.selectById(TEST_SUBMITTER_ID)).thenReturn(approver);

        // Execute
        FormRecordResponse result = service.advance(TEST_FORM_ID, TEST_APPROVER_ID, "APPROVE", "最终审批通过");

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
        ApprovalFlowNode node1 = createNode(1L, TEST_FLOW_DEF_ID, 1, "主管审批", "DESIGNATED", String.valueOf(TEST_APPROVER_ID), null);
        when(approvalFlowNodeMapper.findByFlowIdAndNodeOrder(TEST_FLOW_DEF_ID, 1)).thenReturn(node1);
        when(approvalFlowNodeMapper.findByFlowId(TEST_FLOW_DEF_ID)).thenReturn(Collections.singletonList(node1));

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

    private ApprovalFlowNode createNode(Long id, Long flowId, int nodeOrder, String nodeName,
                                         String approverType, String approverRef, String skipCondition) {
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
