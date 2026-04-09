package com.oa.backend.service;

import com.oa.backend.entity.*;
import com.oa.backend.mapper.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * RetentionService 单元测试
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("数据保留服务测试")
class RetentionServiceTest {

    @InjectMocks
    private RetentionService retentionService;

    @Mock
    private RetentionPolicyMapper policyMapper;

    @Mock
    private RetentionReminderMapper reminderMapper;

    @Mock
    private ExportBackupTaskMapper exportTaskMapper;

    @Mock
    private CleanupTaskMapper cleanupTaskMapper;

    @Mock
    private PayrollSlipMapper payrollSlipMapper;

    @Mock
    private FormRecordMapper formRecordMapper;

    @Mock
    private OperationLogMapper operationLogMapper;

    @Mock
    private ConstructionLogSummaryMapper constructionLogMapper;

    @Mock
    private InjuryClaimMapper injuryClaimMapper;

    @Mock
    private org.springframework.context.ApplicationEventPublisher eventPublisher;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(retentionService, "uploadDir", "./uploads");
    }

    @Test
    @DisplayName("查询保留策略 - mapper 返回 3 个策略，service 返回相同 3 个")
    void listPolicies_whenMapperReturns3Policies_shouldReturnSame3() {
        // Given
        RetentionPolicy policy1 = new RetentionPolicy();
        policy1.setId(1L);
        policy1.setDataType("PAYROLL_SLIP");

        RetentionPolicy policy2 = new RetentionPolicy();
        policy2.setId(2L);
        policy2.setDataType("FORM_RECORD");

        RetentionPolicy policy3 = new RetentionPolicy();
        policy3.setId(3L);
        policy3.setDataType("OPERATION_LOG");

        List<RetentionPolicy> expectedList = Arrays.asList(policy1, policy2, policy3);

        when(policyMapper.findAllActive()).thenReturn(expectedList);

        // When
        List<RetentionPolicy> result = retentionService.listPolicies();

        // Then
        assertThat(result).isEqualTo(expectedList);
        assertThat(result).hasSize(3);
        verify(policyMapper, times(1)).findAllActive();
    }

    @Test
    @DisplayName("查询到期提醒 - mapper 返回列表，service 返回相同列表")
    void listReminders_whenMapperReturnsList_shouldReturnSameList() {
        // Given
        RetentionReminder reminder1 = new RetentionReminder();
        reminder1.setId(1L);
        reminder1.setDataType("PAYROLL_SLIP");
        reminder1.setStatus("PENDING");

        RetentionReminder reminder2 = new RetentionReminder();
        reminder2.setId(2L);
        reminder2.setDataType("FORM_RECORD");
        reminder2.setStatus("PENDING");

        List<RetentionReminder> expectedList = Arrays.asList(reminder1, reminder2);

        when(reminderMapper.selectList(any())).thenReturn(expectedList);

        // When
        List<RetentionReminder> result = retentionService.listReminders();

        // Then
        assertThat(result).isEqualTo(expectedList);
        assertThat(result).hasSize(2);
        verify(reminderMapper, times(1)).selectList(any());
    }

    @Test
    @DisplayName("忽略提醒 - 验证 mapper updateById 被调用且状态设为 IGNORED")
    void dismissReminder_shouldCallUpdateByIdWithStatusIgnored() {
        // Given
        Long reminderId = 1L;

        RetentionReminder reminder = new RetentionReminder();
        reminder.setId(reminderId);
        reminder.setDataType("PAYROLL_SLIP");
        reminder.setStatus("PENDING");
        reminder.setDeleted(0);

        when(reminderMapper.selectById(reminderId)).thenReturn(reminder);

        // When
        boolean result = retentionService.dismissReminder(reminderId);

        // Then
        assertThat(result).isTrue();
        assertThat(reminder.getStatus()).isEqualTo("IGNORED");
        verify(reminderMapper, times(1)).selectById(reminderId);
        verify(reminderMapper, times(1)).updateById(reminder);
    }

    @Test
    @DisplayName("忽略提醒 - 提醒不存在时应返回 false")
    void dismissReminder_whenReminderNotFound_shouldReturnFalse() {
        // Given
        Long reminderId = 1L;

        when(reminderMapper.selectById(reminderId)).thenReturn(null);

        // When
        boolean result = retentionService.dismissReminder(reminderId);

        // Then
        assertThat(result).isFalse();
        verify(reminderMapper, times(1)).selectById(reminderId);
        verify(reminderMapper, never()).updateById(any());
    }

    @Test
    @DisplayName("忽略提醒 - 非 PENDING 状态时应返回 false")
    void dismissReminder_whenStatusNotPending_shouldReturnFalse() {
        // Given
        Long reminderId = 1L;

        RetentionReminder reminder = new RetentionReminder();
        reminder.setId(reminderId);
        reminder.setStatus("IGNORED");
        reminder.setDeleted(0);

        when(reminderMapper.selectById(reminderId)).thenReturn(reminder);

        // When
        boolean result = retentionService.dismissReminder(reminderId);

        // Then
        assertThat(result).isFalse();
        verify(reminderMapper, times(1)).selectById(reminderId);
        verify(reminderMapper, never()).updateById(any());
    }

    @Test
    @DisplayName("忽略提醒 - 已逻辑删除时应返回 false")
    void dismissReminder_whenDeleted_shouldReturnFalse() {
        // Given
        Long reminderId = 1L;

        RetentionReminder reminder = new RetentionReminder();
        reminder.setId(reminderId);
        reminder.setStatus("PENDING");
        reminder.setDeleted(1);

        when(reminderMapper.selectById(reminderId)).thenReturn(reminder);

        // When
        boolean result = retentionService.dismissReminder(reminderId);

        // Then
        assertThat(result).isFalse();
        verify(reminderMapper, times(1)).selectById(reminderId);
        verify(reminderMapper, never()).updateById(any());
    }

    @Test
    @DisplayName("启动导出并删除 - 验证 ExportBackupTaskMapper insert 被调用且任务状态为 PENDING")
    void startExportAndDelete_shouldInsertTaskWithStatusPending() {
        // Given
        Long reminderId = 1L;
        Long initiatorId = 2L;

        RetentionReminder reminder = new RetentionReminder();
        reminder.setId(reminderId);
        reminder.setDataType("PAYROLL_SLIP");
        reminder.setStatus("PENDING");
        reminder.setDeleted(0);
        reminder.setExpectedDeleteDate(LocalDate.now());

        when(reminderMapper.selectById(reminderId)).thenReturn(reminder);
        when(exportTaskMapper.insert(any(ExportBackupTask.class))).thenAnswer(invocation -> {
            ExportBackupTask task = invocation.getArgument(0);
            task.setId(100L);
            return 1;
        });

        // When
        Long taskId = retentionService.startExportAndDelete(reminderId, initiatorId);

        // Then
        assertThat(taskId).isNotNull();
        verify(reminderMapper, times(1)).selectById(reminderId);
        verify(exportTaskMapper, times(1)).insert(argThat(task ->
                task.getInitiatorId().equals(initiatorId) &&
                task.getDataTypes().equals("PAYROLL_SLIP") &&
                task.getStatus().equals("PENDING")
        ));
    }

    @Test
    @DisplayName("启动导出并删除 - 提醒不存在时应返回 null")
    void startExportAndDelete_whenReminderNotFound_shouldReturnNull() {
        // Given
        Long reminderId = 1L;
        Long initiatorId = 2L;

        when(reminderMapper.selectById(reminderId)).thenReturn(null);

        // When
        Long taskId = retentionService.startExportAndDelete(reminderId, initiatorId);

        // Then
        assertThat(taskId).isNull();
        verify(reminderMapper, times(1)).selectById(reminderId);
        verify(exportTaskMapper, never()).insert(any());
    }

    @Test
    @DisplayName("启动导出并删除 - 非 PENDING 状态时应返回 null")
    void startExportAndDelete_whenStatusNotPending_shouldReturnNull() {
        // Given
        Long reminderId = 1L;
        Long initiatorId = 2L;

        RetentionReminder reminder = new RetentionReminder();
        reminder.setId(reminderId);
        reminder.setStatus("EXPORTED");
        reminder.setDeleted(0);

        when(reminderMapper.selectById(reminderId)).thenReturn(reminder);

        // When
        Long taskId = retentionService.startExportAndDelete(reminderId, initiatorId);

        // Then
        assertThat(taskId).isNull();
        verify(reminderMapper, times(1)).selectById(reminderId);
        verify(exportTaskMapper, never()).insert(any());
    }

    @Test
    @DisplayName("每日扫描 - 策略触发 30 天警告时应创建提醒")
    void dailyScan_whenPolicyTriggersWarning_shouldCreateReminder() {
        // Given
        LocalDate today = LocalDate.of(2024, 1, 15);
        LocalDate oldestDate = LocalDate.of(2023, 1, 1); // 1 year old data

        RetentionPolicy policy = new RetentionPolicy();
        policy.setId(1L);
        policy.setDataType("PAYROLL_SLIP");
        policy.setRetentionYears(1);
        policy.setWarnBeforeDays(30);

        when(policyMapper.findAllActive()).thenReturn(Collections.singletonList(policy));

        // Mock the oldest date query through payrollSlipMapper
        PayrollSlip oldestSlip = new PayrollSlip();
        oldestSlip.setCreatedAt(oldestDate.atStartOfDay());
        when(payrollSlipMapper.selectOne(any())).thenReturn(oldestSlip);

        // Mock reminder doesn't exist yet
        when(reminderMapper.selectCount(any())).thenReturn(0L);

        when(reminderMapper.insert(any(RetentionReminder.class))).thenReturn(1);

        // When
        retentionService.dailyScan();

        // Then
        verify(policyMapper, times(1)).findAllActive();
        verify(payrollSlipMapper, times(1)).selectOne(any());
        verify(reminderMapper, times(1)).insert(any(RetentionReminder.class));
        verify(eventPublisher, times(1)).publishEvent(any());
    }

    @Test
    @DisplayName("每日扫描 - 无旧数据时不创建提醒")
    void dailyScan_whenNoOldData_shouldNotCreateReminder() {
        // Given
        RetentionPolicy policy = new RetentionPolicy();
        policy.setId(1L);
        policy.setDataType("PAYROLL_SLIP");
        policy.setRetentionYears(1);
        policy.setWarnBeforeDays(30);

        when(policyMapper.findAllActive()).thenReturn(Collections.singletonList(policy));

        // No old data - return null from mapper
        when(payrollSlipMapper.selectOne(any())).thenReturn(null);

        // When
        retentionService.dailyScan();

        // Then
        verify(policyMapper, times(1)).findAllActive();
        verify(payrollSlipMapper, times(1)).selectOne(any());
        verify(reminderMapper, never()).insert(any());
        verify(eventPublisher, never()).publishEvent(any());
    }

    @Test
    @DisplayName("每日扫描 - 提醒已存在时不重复创建")
    void dailyScan_whenReminderAlreadyExists_shouldNotCreateDuplicate() {
        // Given
        LocalDate today = LocalDate.of(2024, 1, 15);
        LocalDate oldestDate = LocalDate.of(2023, 1, 1);

        RetentionPolicy policy = new RetentionPolicy();
        policy.setId(1L);
        policy.setDataType("PAYROLL_SLIP");
        policy.setRetentionYears(1);
        policy.setWarnBeforeDays(30);

        when(policyMapper.findAllActive()).thenReturn(Collections.singletonList(policy));

        PayrollSlip oldestSlip = new PayrollSlip();
        oldestSlip.setCreatedAt(oldestDate.atStartOfDay());
        when(payrollSlipMapper.selectOne(any())).thenReturn(oldestSlip);

        // Reminder already exists
        when(reminderMapper.selectCount(any())).thenReturn(1L);

        // When
        retentionService.dailyScan();

        // Then
        verify(policyMapper, times(1)).findAllActive();
        verify(payrollSlipMapper, times(1)).selectOne(any());
        verify(reminderMapper, never()).insert(any());
        verify(eventPublisher, never()).publishEvent(any());
    }

    @Test
    @DisplayName("每日扫描 - 未到达警告日期时不创建提醒")
    void dailyScan_whenNotReachedWarnDate_shouldNotCreateReminder() {
        // Given - data is 5 years old, but retention is 10 years, warn 30 days before
        LocalDate oldestDate = LocalDate.of(2019, 1, 1); // 5 years old

        RetentionPolicy policy = new RetentionPolicy();
        policy.setId(1L);
        policy.setDataType("PAYROLL_SLIP");
        policy.setRetentionYears(10); // 10 year retention
        policy.setWarnBeforeDays(30);

        when(policyMapper.findAllActive()).thenReturn(Collections.singletonList(policy));

        PayrollSlip oldestSlip = new PayrollSlip();
        oldestSlip.setCreatedAt(oldestDate.atStartOfDay());
        when(payrollSlipMapper.selectOne(any())).thenReturn(oldestSlip);

        // When
        retentionService.dailyScan();

        // Then - no insert should happen because expectedDeleteDate (2019+10=2029) is far in the future
        verify(policyMapper, times(1)).findAllActive();
        verify(payrollSlipMapper, times(1)).selectOne(any());
        verify(reminderMapper, never()).insert(any());
        verify(eventPublisher, never()).publishEvent(any());
    }

    @Test
    @DisplayName("获取数据类型标签 - 已知类型应返回中文标签")
    void getDataTypeLabel_knownTypes_shouldReturnChineseLabels() {
        assertThat(retentionService.getDataTypeLabel("PAYROLL_SLIP")).isEqualTo("工资条");
        assertThat(retentionService.getDataTypeLabel("FORM_RECORD")).isEqualTo("表单记录");
        assertThat(retentionService.getDataTypeLabel("ATTENDANCE_RECORD")).isEqualTo("考勤记录");
        assertThat(retentionService.getDataTypeLabel("CONSTRUCTION_LOG")).isEqualTo("施工日志");
        assertThat(retentionService.getDataTypeLabel("INJURY_CLAIM")).isEqualTo("工伤理赔");
        assertThat(retentionService.getDataTypeLabel("OPERATION_LOG")).isEqualTo("操作日志");
    }

    @Test
    @DisplayName("获取数据类型标签 - 未知类型应返回原编码")
    void getDataTypeLabel_unknownType_shouldReturnOriginalCode() {
        assertThat(retentionService.getDataTypeLabel("UNKNOWN_TYPE")).isEqualTo("UNKNOWN_TYPE");
    }

    @Test
    @DisplayName("下载导出 - 有效令牌应返回文件路径")
    void downloadExport_withValidToken_shouldReturnFilePath() {
        // Given
        String token = "valid-token-uuid";
        String expectedPath = "/path/to/export.zip";

        ExportBackupTask task = new ExportBackupTask();
        task.setId(1L);
        task.setStatus("DONE");
        task.setFilePath(expectedPath);
        task.setTokenExpiresAt(LocalDateTime.now().plusHours(72));
        task.setDeleted(0);

        when(exportTaskMapper.findByDownloadToken(token)).thenReturn(task);

        // When
        String result = retentionService.downloadExport(token);

        // Then
        assertThat(result).isEqualTo(expectedPath);
        verify(exportTaskMapper, times(1)).findByDownloadToken(token);
    }

    @Test
    @DisplayName("下载导出 - 空令牌应返回 null")
    void downloadExport_withEmptyToken_shouldReturnNull() {
        // When
        String result = retentionService.downloadExport("");

        // Then
        assertThat(result).isNull();
        verify(exportTaskMapper, never()).findByDownloadToken(any());
    }

    @Test
    @DisplayName("下载导出 - 过期令牌应返回 null")
    void downloadExport_withExpiredToken_shouldReturnNull() {
        // Given
        String token = "expired-token";

        ExportBackupTask task = new ExportBackupTask();
        task.setId(1L);
        task.setStatus("DONE");
        task.setTokenExpiresAt(LocalDateTime.now().minusHours(1)); // Expired
        task.setDeleted(0);

        when(exportTaskMapper.findByDownloadToken(token)).thenReturn(task);

        // When
        String result = retentionService.downloadExport(token);

        // Then
        assertThat(result).isNull();
        verify(exportTaskMapper, times(1)).findByDownloadToken(token);
    }

    @Test
    @DisplayName("下载导出 - 未完成状态应返回 null")
    void downloadExport_withUnfinishedStatus_shouldReturnNull() {
        // Given
        String token = "unfinished-token";

        ExportBackupTask task = new ExportBackupTask();
        task.setId(1L);
        task.setStatus("PENDING");
        task.setDeleted(0);

        when(exportTaskMapper.findByDownloadToken(token)).thenReturn(task);

        // When
        String result = retentionService.downloadExport(token);

        // Then
        assertThat(result).isNull();
        verify(exportTaskMapper, times(1)).findByDownloadToken(token);
    }
}
