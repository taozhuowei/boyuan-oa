package com.oa.backend.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import com.oa.backend.entity.*;
import com.oa.backend.mapper.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

/** RetentionService 单元测试 */
@ExtendWith(MockitoExtension.class)
@DisplayName("数据保留服务测试")
class RetentionServiceTest {

  @InjectMocks private RetentionService retentionService;

  @Mock private RetentionPolicyMapper policyMapper;

  @Mock private RetentionReminderMapper reminderMapper;

  @Mock private ExportBackupTaskMapper exportTaskMapper;

  @Mock private CleanupTaskMapper cleanupTaskMapper;

  @Mock private FormRecordMapper formRecordMapper;

  @Mock private OperationLogMapper operationLogMapper;

  @Mock private org.springframework.context.ApplicationEventPublisher eventPublisher;

  @BeforeEach
  void setUp() {
    ReflectionTestUtils.setField(retentionService, "uploadDir", "./uploads");
  }

  @Test
  @DisplayName("查询保留策略 - mapper 返回 3 个策略，service 返回相同 3 个")
  void listPolicies_whenMapperReturns3Policies_shouldReturnSame3() {
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

    List<RetentionPolicy> result = retentionService.listPolicies();

    assertThat(result).isEqualTo(expectedList);
    assertThat(result).hasSize(3);
    verify(policyMapper, times(1)).findAllActive();
  }

  @Test
  @DisplayName("查询到期提醒 - mapper 返回列表，service 返回相同列表")
  void listReminders_whenMapperReturnsList_shouldReturnSameList() {
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

    List<RetentionReminder> result = retentionService.listReminders();

    assertThat(result).isEqualTo(expectedList);
    assertThat(result).hasSize(2);
    verify(reminderMapper, times(1)).selectList(any());
  }

  @Test
  @DisplayName("忽略提醒 - 验证 mapper updateById 被调用且状态设为 IGNORED")
  void dismissReminder_shouldCallUpdateByIdWithStatusIgnored() {
    Long reminderId = 1L;
    RetentionReminder reminder = new RetentionReminder();
    reminder.setId(reminderId);
    reminder.setDataType("PAYROLL_SLIP");
    reminder.setStatus("PENDING");
    reminder.setDeleted(0);

    when(reminderMapper.selectById(reminderId)).thenReturn(reminder);

    boolean result = retentionService.dismissReminder(reminderId);

    assertThat(result).isTrue();
    assertThat(reminder.getStatus()).isEqualTo("IGNORED");
    verify(reminderMapper, times(1)).selectById(reminderId);
    verify(reminderMapper, times(1)).updateById(reminder);
  }

  @Test
  @DisplayName("忽略提醒 - 提醒不存在时应返回 false")
  void dismissReminder_whenReminderNotFound_shouldReturnFalse() {
    Long reminderId = 1L;
    when(reminderMapper.selectById(reminderId)).thenReturn(null);

    boolean result = retentionService.dismissReminder(reminderId);

    assertThat(result).isFalse();
    verify(reminderMapper, times(1)).selectById(reminderId);
    verify(reminderMapper, never()).updateById(any());
  }

  @Test
  @DisplayName("忽略提醒 - 非 PENDING 状态时应返回 false")
  void dismissReminder_whenStatusNotPending_shouldReturnFalse() {
    Long reminderId = 1L;
    RetentionReminder reminder = new RetentionReminder();
    reminder.setId(reminderId);
    reminder.setStatus("IGNORED");
    reminder.setDeleted(0);

    when(reminderMapper.selectById(reminderId)).thenReturn(reminder);

    boolean result = retentionService.dismissReminder(reminderId);

    assertThat(result).isFalse();
    verify(reminderMapper, times(1)).selectById(reminderId);
    verify(reminderMapper, never()).updateById(any());
  }

  @Test
  @DisplayName("忽略提醒 - 已逻辑删除时应返回 false")
  void dismissReminder_whenDeleted_shouldReturnFalse() {
    Long reminderId = 1L;
    RetentionReminder reminder = new RetentionReminder();
    reminder.setId(reminderId);
    reminder.setStatus("PENDING");
    reminder.setDeleted(1);

    when(reminderMapper.selectById(reminderId)).thenReturn(reminder);

    boolean result = retentionService.dismissReminder(reminderId);

    assertThat(result).isFalse();
    verify(reminderMapper, times(1)).selectById(reminderId);
    verify(reminderMapper, never()).updateById(any());
  }

  @Test
  @DisplayName("启动导出并删除 - 验证 ExportBackupTaskMapper insert 被调用且任务状态为 PENDING")
  void startExportAndDelete_shouldInsertTaskWithStatusPending() {
    Long reminderId = 1L;
    Long initiatorId = 2L;

    RetentionReminder reminder = new RetentionReminder();
    reminder.setId(reminderId);
    reminder.setDataType("PAYROLL_SLIP");
    reminder.setStatus("PENDING");
    reminder.setDeleted(0);
    reminder.setExpectedDeleteDate(LocalDate.now());

    when(reminderMapper.selectById(reminderId)).thenReturn(reminder);
    when(exportTaskMapper.insert(any(ExportBackupTask.class)))
        .thenAnswer(
            invocation -> {
              ExportBackupTask task = invocation.getArgument(0);
              task.setId(100L);
              return 1;
            });

    Long taskId = retentionService.startExportAndDelete(reminderId, initiatorId);

    assertThat(taskId).isNotNull();
    verify(reminderMapper, times(1)).selectById(reminderId);
    verify(exportTaskMapper, times(1))
        .insert(
            argThat(
                task ->
                    task.getInitiatorId().equals(initiatorId)
                        && task.getDataTypes().equals("PAYROLL_SLIP")
                        && task.getStatus().equals("PENDING")));
  }

  @Test
  @DisplayName("启动导出并删除 - 提醒不存在时应返回 null")
  void startExportAndDelete_whenReminderNotFound_shouldReturnNull() {
    Long reminderId = 1L;
    Long initiatorId = 2L;

    when(reminderMapper.selectById(reminderId)).thenReturn(null);

    Long taskId = retentionService.startExportAndDelete(reminderId, initiatorId);

    assertThat(taskId).isNull();
    verify(reminderMapper, times(1)).selectById(reminderId);
    verify(exportTaskMapper, never()).insert(any());
  }

  @Test
  @DisplayName("启动导出并删除 - 非 PENDING 状态时应返回 null")
  void startExportAndDelete_whenStatusNotPending_shouldReturnNull() {
    Long reminderId = 1L;
    Long initiatorId = 2L;

    RetentionReminder reminder = new RetentionReminder();
    reminder.setId(reminderId);
    reminder.setStatus("EXPORTED");
    reminder.setDeleted(0);

    when(reminderMapper.selectById(reminderId)).thenReturn(reminder);

    Long taskId = retentionService.startExportAndDelete(reminderId, initiatorId);

    assertThat(taskId).isNull();
    verify(reminderMapper, times(1)).selectById(reminderId);
    verify(exportTaskMapper, never()).insert(any());
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
    String token = "valid-token-uuid";
    String expectedPath = "/path/to/export.zip";

    ExportBackupTask task = new ExportBackupTask();
    task.setId(1L);
    task.setStatus("DONE");
    task.setFilePath(expectedPath);
    task.setTokenExpiresAt(LocalDateTime.now().plusHours(72));
    task.setDeleted(0);

    when(exportTaskMapper.findByDownloadToken(token)).thenReturn(task);

    String result = retentionService.downloadExport(token);

    assertThat(result).isEqualTo(expectedPath);
    verify(exportTaskMapper, times(1)).findByDownloadToken(token);
  }

  @Test
  @DisplayName("下载导出 - 空令牌应返回 null")
  void downloadExport_withEmptyToken_shouldReturnNull() {
    String result = retentionService.downloadExport("");

    assertThat(result).isNull();
    verify(exportTaskMapper, never()).findByDownloadToken(any());
  }

  @Test
  @DisplayName("下载导出 - 过期令牌应返回 null")
  void downloadExport_withExpiredToken_shouldReturnNull() {
    String token = "expired-token";

    ExportBackupTask task = new ExportBackupTask();
    task.setId(1L);
    task.setStatus("DONE");
    task.setTokenExpiresAt(LocalDateTime.now().minusHours(1));
    task.setDeleted(0);

    when(exportTaskMapper.findByDownloadToken(token)).thenReturn(task);

    String result = retentionService.downloadExport(token);

    assertThat(result).isNull();
    verify(exportTaskMapper, times(1)).findByDownloadToken(token);
  }

  @Test
  @DisplayName("下载导出 - 未完成状态应返回 null")
  void downloadExport_withUnfinishedStatus_shouldReturnNull() {
    String token = "unfinished-token";

    ExportBackupTask task = new ExportBackupTask();
    task.setId(1L);
    task.setStatus("PENDING");
    task.setDeleted(0);

    when(exportTaskMapper.findByDownloadToken(token)).thenReturn(task);

    String result = retentionService.downloadExport(token);

    assertThat(result).isNull();
    verify(exportTaskMapper, times(1)).findByDownloadToken(token);
  }

  // ─── New Tests for Additional Coverage ───────────────────────

  @Test
  @DisplayName("启动导出并删除 - 成功路径应返回导出任务 ID")
  void startExportAndDelete_successPath_shouldReturnExportTaskId() {
    Long reminderId = 1L;
    Long initiatorId = 2L;

    RetentionReminder reminder = new RetentionReminder();
    reminder.setId(reminderId);
    reminder.setDataType("PAYROLL_SLIP");
    reminder.setStatus("PENDING");
    reminder.setDeleted(0);
    reminder.setExpectedDeleteDate(LocalDate.of(2024, 1, 1));

    when(reminderMapper.selectById(reminderId)).thenReturn(reminder);
    when(exportTaskMapper.insert(any(ExportBackupTask.class)))
        .thenAnswer(
            invocation -> {
              ExportBackupTask task = invocation.getArgument(0);
              task.setId(200L);
              return 1;
            });

    Long taskId = retentionService.startExportAndDelete(reminderId, initiatorId);

    assertThat(taskId).isNotNull();
    assertThat(taskId).isEqualTo(200L);
    verify(reminderMapper, times(1)).selectById(reminderId);
    verify(exportTaskMapper, times(1))
        .insert(
            argThat(
                task ->
                    task.getInitiatorId().equals(initiatorId)
                        && task.getDataTypes().equals("PAYROLL_SLIP")
                        && task.getStatus().equals("PENDING")));
  }

  @Test
  @DisplayName("下载导出 - 成功路径应返回文件路径")
  void downloadExport_successPath_shouldReturnFilePath() {
    String token = "valid-token-uuid";
    String expectedPath = "/uploads/export/200.zip";

    ExportBackupTask task = new ExportBackupTask();
    task.setId(200L);
    task.setStatus("DONE");
    task.setFilePath(expectedPath);
    task.setTokenExpiresAt(LocalDateTime.now().plusHours(72));
    task.setDeleted(0);

    when(exportTaskMapper.findByDownloadToken(token)).thenReturn(task);

    String result = retentionService.downloadExport(token);

    assertThat(result).isEqualTo(expectedPath);
    verify(exportTaskMapper, times(1)).findByDownloadToken(token);
  }

  @Test
  @DisplayName("下载导出 - 令牌已过期应返回 null")
  void downloadExport_tokenExpired_shouldReturnNull() {
    String token = "expired-token";

    ExportBackupTask task = new ExportBackupTask();
    task.setId(200L);
    task.setStatus("DONE");
    task.setFilePath("/uploads/export/200.zip");
    task.setTokenExpiresAt(LocalDateTime.now().minusHours(1));
    task.setDeleted(0);

    when(exportTaskMapper.findByDownloadToken(token)).thenReturn(task);

    String result = retentionService.downloadExport(token);

    assertThat(result).isNull();
    verify(exportTaskMapper, times(1)).findByDownloadToken(token);
  }

  @Test
  @DisplayName("获取数据类型标签 - 应返回所有已知类型的非空标签")
  void getDataTypeLabel_allKnownTypes_shouldReturnNonNullLabels() {
    assertThat(retentionService.getDataTypeLabel("PAYROLL_SLIP")).isNotNull();
    assertThat(retentionService.getDataTypeLabel("FORM_RECORD")).isNotNull();
    assertThat(retentionService.getDataTypeLabel("ATTENDANCE_RECORD")).isNotNull();
    assertThat(retentionService.getDataTypeLabel("CONSTRUCTION_LOG")).isNotNull();
    assertThat(retentionService.getDataTypeLabel("INJURY_CLAIM")).isNotNull();
    assertThat(retentionService.getDataTypeLabel("OPERATION_LOG")).isNotNull();
  }

  @Test
  @DisplayName("查询保留策略 - 有数据时应返回策略列表")
  void listPolicies_withData_shouldReturnPolicyList() {
    RetentionPolicy policy1 = new RetentionPolicy();
    policy1.setId(1L);
    policy1.setDataType("PAYROLL_SLIP");

    RetentionPolicy policy2 = new RetentionPolicy();
    policy2.setId(2L);
    policy2.setDataType("FORM_RECORD");

    List<RetentionPolicy> expectedList = Arrays.asList(policy1, policy2);
    when(policyMapper.findAllActive()).thenReturn(expectedList);

    List<RetentionPolicy> result = retentionService.listPolicies();

    assertThat(result).hasSize(2);
    assertThat(result).isEqualTo(expectedList);
    verify(policyMapper, times(1)).findAllActive();
  }

  @Test
  @DisplayName("查询到期提醒 - 有数据时应返回提醒列表")
  void listReminders_withData_shouldReturnReminderList() {
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

    List<RetentionReminder> result = retentionService.listReminders();

    assertThat(result).hasSize(2);
    assertThat(result).isEqualTo(expectedList);
    verify(reminderMapper, times(1)).selectList(any());
  }

  @Test
  @DisplayName("忽略提醒 - 提醒已处理时应返回 false")
  void dismissReminder_alreadyProcessed_shouldReturnFalse() {
    Long reminderId = 1L;
    RetentionReminder reminder = new RetentionReminder();
    reminder.setId(reminderId);
    reminder.setDataType("PAYROLL_SLIP");
    reminder.setStatus("EXPORTED");
    reminder.setDeleted(0);

    when(reminderMapper.selectById(reminderId)).thenReturn(reminder);

    boolean result = retentionService.dismissReminder(reminderId);

    assertThat(result).isFalse();
    verify(reminderMapper, times(1)).selectById(reminderId);
    verify(reminderMapper, never()).updateById(any());
  }

  // ─── Additional Tests for Coverage ───────────────────────────

  @Test
  @DisplayName("下载导出 - 令牌不存在应返回 null")
  void downloadExport_withNonExistentToken_shouldReturnNull() {
    String token = "non-existent-token";
    when(exportTaskMapper.findByDownloadToken(token)).thenReturn(null);

    String result = retentionService.downloadExport(token);

    assertThat(result).isNull();
    verify(exportTaskMapper, times(1)).findByDownloadToken(token);
  }

  @Test
  @DisplayName("下载导出 - 已逻辑删除的任务应返回 null")
  void downloadExport_withDeletedTask_shouldReturnNull() {
    String token = "deleted-task-token";

    ExportBackupTask task = new ExportBackupTask();
    task.setId(1L);
    task.setStatus("DONE");
    task.setFilePath("/path/to/export.zip");
    task.setTokenExpiresAt(LocalDateTime.now().plusHours(72));
    task.setDeleted(1);

    when(exportTaskMapper.findByDownloadToken(token)).thenReturn(task);

    String result = retentionService.downloadExport(token);

    assertThat(result).isNull();
  }

  @Test
  @DisplayName("下载导出 - 令牌过期时间为 null 应返回 null")
  void downloadExport_withNullTokenExpiresAt_shouldReturnNull() {
    String token = "no-expiry-token";

    ExportBackupTask task = new ExportBackupTask();
    task.setId(1L);
    task.setStatus("DONE");
    task.setFilePath("/path/to/export.zip");
    task.setTokenExpiresAt(null);
    task.setDeleted(0);

    when(exportTaskMapper.findByDownloadToken(token)).thenReturn(task);

    String result = retentionService.downloadExport(token);

    assertThat(result).isNull();
  }

  @Test
  @DisplayName("下载导出 - 空白令牌应返回 null")
  void downloadExport_withBlankToken_shouldReturnNull() {
    String result = retentionService.downloadExport("   ");

    assertThat(result).isNull();
    verify(exportTaskMapper, never()).findByDownloadToken(any());
  }

  @Test
  @DisplayName("启动导出并删除 - 已删除的提醒应返回 null")
  void startExportAndDelete_whenReminderDeleted_shouldReturnNull() {
    Long reminderId = 1L;
    Long initiatorId = 2L;

    RetentionReminder reminder = new RetentionReminder();
    reminder.setId(reminderId);
    reminder.setStatus("PENDING");
    reminder.setDeleted(1);

    when(reminderMapper.selectById(reminderId)).thenReturn(reminder);

    Long taskId = retentionService.startExportAndDelete(reminderId, initiatorId);

    assertThat(taskId).isNull();
    verify(exportTaskMapper, never()).insert(any());
  }

  @Test
  @DisplayName("启动导出并删除 - FORM_RECORD 数据类型应创建任务")
  void startExportAndDelete_withFormRecordType_shouldCreateTask() {
    Long reminderId = 1L;
    Long initiatorId = 2L;

    RetentionReminder reminder = new RetentionReminder();
    reminder.setId(reminderId);
    reminder.setDataType("FORM_RECORD");
    reminder.setStatus("PENDING");
    reminder.setDeleted(0);
    reminder.setExpectedDeleteDate(LocalDate.now());

    when(reminderMapper.selectById(reminderId)).thenReturn(reminder);
    when(exportTaskMapper.insert(any(ExportBackupTask.class)))
        .thenAnswer(
            invocation -> {
              ExportBackupTask task = invocation.getArgument(0);
              task.setId(101L);
              return 1;
            });

    Long taskId = retentionService.startExportAndDelete(reminderId, initiatorId);

    assertThat(taskId).isEqualTo(101L);
    verify(exportTaskMapper).insert(argThat(task -> task.getDataTypes().equals("FORM_RECORD")));
  }

  @Test
  @DisplayName("启动导出并删除 - OPERATION_LOG 数据类型应创建任务")
  void startExportAndDelete_withOperationLogType_shouldCreateTask() {
    Long reminderId = 1L;
    Long initiatorId = 2L;

    RetentionReminder reminder = new RetentionReminder();
    reminder.setId(reminderId);
    reminder.setDataType("OPERATION_LOG");
    reminder.setStatus("PENDING");
    reminder.setDeleted(0);
    reminder.setExpectedDeleteDate(LocalDate.now());

    when(reminderMapper.selectById(reminderId)).thenReturn(reminder);
    when(exportTaskMapper.insert(any(ExportBackupTask.class)))
        .thenAnswer(
            invocation -> {
              ExportBackupTask task = invocation.getArgument(0);
              task.setId(102L);
              return 1;
            });

    Long taskId = retentionService.startExportAndDelete(reminderId, initiatorId);

    assertThat(taskId).isEqualTo(102L);
    verify(exportTaskMapper).insert(argThat(task -> task.getDataTypes().equals("OPERATION_LOG")));
  }

  @Test
  @DisplayName("每日扫描 - 无策略时不创建提醒")
  void dailyScan_whenNoPolicies_shouldNotCreateReminder() {
    when(policyMapper.findAllActive()).thenReturn(Collections.emptyList());

    retentionService.dailyScan();

    verify(policyMapper, times(1)).findAllActive();
    verify(reminderMapper, never()).insert(any());
    verify(eventPublisher, never()).publishEvent(any());
  }

  @Test
  @DisplayName("每日扫描 - FORM_RECORD 类型应正确查找最旧记录")
  void dailyScan_withFormRecordType_shouldFindOldestDate() {
    LocalDate oldestDate = LocalDate.of(2023, 1, 1);

    RetentionPolicy policy = new RetentionPolicy();
    policy.setId(1L);
    policy.setDataType("FORM_RECORD");
    policy.setRetentionYears(1);
    policy.setWarnBeforeDays(30);

    when(policyMapper.findAllActive()).thenReturn(Collections.singletonList(policy));

    FormRecord oldestRecord = new FormRecord();
    oldestRecord.setCreatedAt(oldestDate.atStartOfDay());
    when(formRecordMapper.selectOne(any())).thenReturn(oldestRecord);

    when(reminderMapper.selectCount(any())).thenReturn(0L);
    when(reminderMapper.insert(any(RetentionReminder.class))).thenReturn(1);

    retentionService.dailyScan();

    verify(formRecordMapper, times(1)).selectOne(any());
    verify(reminderMapper, times(1)).insert(any(RetentionReminder.class));
  }

  @Test
  @DisplayName("每日扫描 - OPERATION_LOG 类型应正确查找最旧记录")
  void dailyScan_withOperationLogType_shouldFindOldestDate() {
    LocalDate oldestDate = LocalDate.of(2023, 1, 1);

    RetentionPolicy policy = new RetentionPolicy();
    policy.setId(1L);
    policy.setDataType("OPERATION_LOG");
    policy.setRetentionYears(1);
    policy.setWarnBeforeDays(30);

    when(policyMapper.findAllActive()).thenReturn(Collections.singletonList(policy));

    OperationLog oldestLog = new OperationLog();
    oldestLog.setActedAt(oldestDate.atStartOfDay());
    when(operationLogMapper.selectList(any())).thenReturn(Collections.singletonList(oldestLog));

    when(reminderMapper.selectCount(any())).thenReturn(0L);
    when(reminderMapper.insert(any(RetentionReminder.class))).thenReturn(1);

    retentionService.dailyScan();

    verify(operationLogMapper, times(1)).selectList(any());
    verify(reminderMapper, times(1)).insert(any(RetentionReminder.class));
  }

  @Test
  @DisplayName("每日扫描 - 未知数据类型应记录警告且不创建提醒")
  void dailyScan_withUnknownDataType_shouldLogWarning() {
    RetentionPolicy policy = new RetentionPolicy();
    policy.setId(1L);
    policy.setDataType("UNKNOWN_TYPE");
    policy.setRetentionYears(1);
    policy.setWarnBeforeDays(30);

    when(policyMapper.findAllActive()).thenReturn(Collections.singletonList(policy));

    retentionService.dailyScan();

    verify(policyMapper, times(1)).findAllActive();
    verify(reminderMapper, never()).insert(any());
  }

  @Test
  @DisplayName("每日扫描 - OperationLog 列表为空应跳过")
  void dailyScan_withEmptyOperationLogList_shouldSkip() {
    RetentionPolicy policy = new RetentionPolicy();
    policy.setId(1L);
    policy.setDataType("OPERATION_LOG");
    policy.setRetentionYears(1);
    policy.setWarnBeforeDays(30);

    when(policyMapper.findAllActive()).thenReturn(Collections.singletonList(policy));
    when(operationLogMapper.selectList(any())).thenReturn(Collections.emptyList());

    retentionService.dailyScan();

    verify(reminderMapper, never()).insert(any());
  }

  @Test
  @DisplayName("每日扫描 - OperationLog 第一条记录 actedAt 为 null 应跳过")
  void dailyScan_withNullActedAt_shouldSkip() {
    RetentionPolicy policy = new RetentionPolicy();
    policy.setId(1L);
    policy.setDataType("OPERATION_LOG");
    policy.setRetentionYears(1);
    policy.setWarnBeforeDays(30);

    when(policyMapper.findAllActive()).thenReturn(Collections.singletonList(policy));

    OperationLog log = new OperationLog();
    log.setActedAt(null);
    when(operationLogMapper.selectList(any())).thenReturn(Collections.singletonList(log));

    retentionService.dailyScan();

    verify(reminderMapper, never()).insert(any());
  }
}
