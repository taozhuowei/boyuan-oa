package com.oa.backend.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.oa.backend.entity.*;
import com.oa.backend.event.RetentionExpiredEvent;
import com.oa.backend.mapper.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.scheduling.annotation.Async;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;

/**
 * 数据保留服务，处理数据保留策略、到期提醒、导出备份和数据清理。
 * <p>
 * 核心功能：
 * <ul>
 *   <li>保留策略管理：查询所有保留策略</li>
 *   <li>到期提醒管理：查询提醒列表、忽略提醒</li>
 *   <li>导出备份：异步导出数据并压缩，生成下载令牌</li>
 *   <li>数据清理：删除过期数据记录</li>
 *   <li>每日扫描：自动扫描即将到期的数据并创建提醒</li>
 * </ul>
 *
 * @author OA Backend Team
 * @since 1.0
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class RetentionService {

    private final RetentionPolicyMapper policyMapper;
    private final RetentionReminderMapper reminderMapper;
    private final ExportBackupTaskMapper exportTaskMapper;
    private final CleanupTaskMapper cleanupTaskMapper;
    private final PayrollSlipMapper payrollSlipMapper;
    private final FormRecordMapper formRecordMapper;
    private final OperationLogMapper operationLogMapper;
    private final ConstructionLogSummaryMapper constructionLogMapper;
    private final InjuryClaimMapper injuryClaimMapper;
    private final ApplicationEventPublisher eventPublisher;

    @Value("${oa.upload-dir:./uploads}")
    private String uploadDir;

    private static final String STATUS_PENDING = "PENDING";
    private static final String STATUS_RUNNING = "RUNNING";
    private static final String STATUS_DONE = "DONE";
    private static final String STATUS_FAILED = "FAILED";
    private static final String STATUS_IGNORED = "IGNORED";
    private static final String STATUS_EXPORTED = "EXPORTED";

    private static final Map<String, String> DATA_TYPE_LABELS = Map.of(
            "PAYROLL_SLIP", "工资条",
            "FORM_RECORD", "表单记录",
            "ATTENDANCE_RECORD", "考勤记录",
            "CONSTRUCTION_LOG", "施工日志",
            "INJURY_CLAIM", "工伤理赔",
            "OPERATION_LOG", "操作日志"
    );

    /**
     * 获取数据类型的中文标签。
     *
     * @param dataType 数据类型编码
     * @return 中文标签，未找到返回原编码
     */
    public String getDataTypeLabel(String dataType) {
        return DATA_TYPE_LABELS.getOrDefault(dataType, dataType);
    }

    /**
     * 查询所有未删除的保留策略。
     *
     * @return 保留策略列表
     */
    public List<RetentionPolicy> listPolicies() {
        return policyMapper.findAllActive();
    }

    /**
     * 查询所有待处理的到期提醒，按预计删除日期升序排列。
     * <p>
     * 只返回状态为 PENDING 的提醒记录。
     *
     * @return 到期提醒列表
     */
    public List<RetentionReminder> listReminders() {
        return reminderMapper.selectList(
                new LambdaQueryWrapper<RetentionReminder>()
                        .eq(RetentionReminder::getStatus, STATUS_PENDING)
                        .eq(RetentionReminder::getDeleted, 0)
                        .orderByAsc(RetentionReminder::getExpectedDeleteDate)
        );
    }

    /**
     * 忽略指定的到期提醒。
     * <p>
     * 将提醒状态从 PENDING 更新为 IGNORED。
     *
     * @param id 提醒 ID
     * @return true 如果成功忽略，false 如果提醒不存在或状态不正确
     */
    @Transactional
    public boolean dismissReminder(Long id) {
        RetentionReminder reminder = reminderMapper.selectById(id);
        if (reminder == null || reminder.getDeleted() == 1) {
            log.warn("尝试忽略不存在的提醒: id={}", id);
            return false;
        }
        if (!STATUS_PENDING.equals(reminder.getStatus())) {
            log.warn("尝试忽略非待处理状态的提醒: id={}, status={}", id, reminder.getStatus());
            return false;
        }

        reminder.setStatus(STATUS_IGNORED);
        reminder.setUpdatedAt(LocalDateTime.now());
        reminderMapper.updateById(reminder);
        log.info("已忽略到期提醒: id={}, dataType={}", id, reminder.getDataType());
        return true;
    }

    /**
     * 启动导出并删除流程。
     * <p>
     * 创建导出任务（状态 PENDING），然后异步执行：
     * <ol>
     *   <li>查询相关数据并序列化为 JSON</li>
     *   <li>写入文件并压缩</li>
     *   <li>生成下载令牌（有效期 72 小时）</li>
     *   <li>删除过期数据记录</li>
     *   <li>更新提醒状态为 EXPORTED</li>
     * </ol>
     *
     * @param reminderId  提醒 ID
     * @param initiatorId 发起人 ID
     * @return 创建的导出任务 ID，如果提醒不存在返回 null
     */
    @Transactional
    public Long startExportAndDelete(Long reminderId, Long initiatorId) {
        RetentionReminder reminder = reminderMapper.selectById(reminderId);
        if (reminder == null || reminder.getDeleted() == 1) {
            log.warn("尝试导出不存在的数据: reminderId={}", reminderId);
            return null;
        }
        if (!STATUS_PENDING.equals(reminder.getStatus())) {
            log.warn("尝试导出非待处理状态的数据: reminderId={}, status={}", reminderId, reminder.getStatus());
            return null;
        }

        // 创建导出任务
        ExportBackupTask task = new ExportBackupTask();
        task.setInitiatorId(initiatorId);
        task.setDataTypes(reminder.getDataType());
        task.setStatus(STATUS_PENDING);
        task.setCreatedAt(LocalDateTime.now());
        task.setUpdatedAt(LocalDateTime.now());
        exportTaskMapper.insert(task);

        // 异步执行导出和删除
        executeExportAndDeleteAsync(task.getId(), reminderId, reminder.getDataType(), reminder.getExpectedDeleteDate());

        log.info("已创建导出任务: taskId={}, reminderId={}, dataType={}", task.getId(), reminderId, reminder.getDataType());
        return task.getId();
    }

    /**
     * 异步执行导出和删除操作。
     * <p>
     * 此方法在独立的线程中执行，不会阻塞 HTTP 请求线程。
     *
     * @param taskId           导出任务 ID
     * @param reminderId       提醒 ID
     * @param dataType         数据类型
     * @param expectedDeleteDate 预计删除日期
     */
    @Async
    @Transactional
    protected void executeExportAndDeleteAsync(Long taskId, Long reminderId, String dataType, LocalDate expectedDeleteDate) {
        ExportBackupTask task = exportTaskMapper.selectById(taskId);
        if (task == null) {
            log.error("导出任务不存在: taskId={}", taskId);
            return;
        }

        try {
            // 更新任务状态为运行中
            task.setStatus(STATUS_RUNNING);
            task.setStartedAt(LocalDateTime.now());
            task.setUpdatedAt(LocalDateTime.now());
            exportTaskMapper.updateById(task);

            // 1. 查询相关数据
            List<?> data = queryDataByType(dataType, expectedDeleteDate);

            // 2. 序列化为 JSON 并写入文件
            String exportDir = uploadDir + "/export";
            Path exportPath = Paths.get(exportDir);
            Files.createDirectories(exportPath);

            String jsonFileName = taskId + ".json";
            Path jsonFilePath = exportPath.resolve(jsonFileName);

            ObjectMapper objectMapper = new ObjectMapper();
            objectMapper.registerModule(new JavaTimeModule());
            objectMapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
            objectMapper.writerWithDefaultPrettyPrinter().writeValue(jsonFilePath.toFile(), data);

            // 3. 压缩文件
            String zipFileName = taskId + ".zip";
            Path zipFilePath = exportPath.resolve(zipFileName);
            zipFile(jsonFilePath, zipFilePath, jsonFileName);

            // 删除临时 JSON 文件
            Files.deleteIfExists(jsonFilePath);

            // 4. 生成下载令牌（UUID）
            String downloadToken = UUID.randomUUID().toString();
            LocalDateTime tokenExpiresAt = LocalDateTime.now().plusHours(72);

            // 5. 更新导出任务状态
            task.setStatus(STATUS_DONE);
            task.setFilePath(zipFilePath.toString());
            task.setDownloadToken(downloadToken);
            task.setTokenExpiresAt(tokenExpiresAt);
            task.setFinishedAt(LocalDateTime.now());
            task.setUpdatedAt(LocalDateTime.now());
            exportTaskMapper.updateById(task);

            // 6. 创建清理任务记录
            CleanupTask cleanupTask = new CleanupTask();
            cleanupTask.setDataType(dataType);
            cleanupTask.setTargetDate(expectedDeleteDate);
            cleanupTask.setStatus(STATUS_PENDING);
            cleanupTask.setCreatedAt(LocalDateTime.now());
            cleanupTask.setUpdatedAt(LocalDateTime.now());
            cleanupTaskMapper.insert(cleanupTask);

            // 7. 删除数据记录
            int deletedCount = deleteDataByType(dataType, expectedDeleteDate);

            // 更新清理任务状态
            cleanupTask.setStatus(STATUS_DONE);
            cleanupTask.setRecordsDeleted(deletedCount);
            cleanupTask.setStartedAt(LocalDateTime.now());
            cleanupTask.setFinishedAt(LocalDateTime.now());
            cleanupTask.setUpdatedAt(LocalDateTime.now());
            cleanupTaskMapper.updateById(cleanupTask);

            // 8. 更新提醒状态为 EXPORTED
            RetentionReminder reminder = reminderMapper.selectById(reminderId);
            if (reminder != null) {
                reminder.setStatus(STATUS_EXPORTED);
                reminder.setUpdatedAt(LocalDateTime.now());
                reminderMapper.updateById(reminder);
            }

            log.info("导出并删除完成: taskId={}, dataType={}, deletedCount={}", taskId, dataType, deletedCount);

        } catch (Exception e) {
            log.error("导出并删除失败: taskId={}", taskId, e);
            task.setStatus(STATUS_FAILED);
            task.setErrorMsg(e.getMessage());
            task.setFinishedAt(LocalDateTime.now());
            task.setUpdatedAt(LocalDateTime.now());
            exportTaskMapper.updateById(task);
        }
    }

    /**
     * 根据数据类型查询过期数据。
     *
     * @param dataType     数据类型
     * @param beforeDate   截止日期（包含）
     * @return 数据列表
     */
    private List<?> queryDataByType(String dataType, LocalDate beforeDate) {
        LocalDateTime beforeDateTime = beforeDate.atTime(23, 59, 59);

        return switch (dataType) {
            case "PAYROLL_SLIP" -> payrollSlipMapper.selectList(
                    new LambdaQueryWrapper<PayrollSlip>()
                            .le(PayrollSlip::getCreatedAt, beforeDateTime)
                            .eq(PayrollSlip::getDeleted, 0)
            );
            case "FORM_RECORD" -> formRecordMapper.selectList(
                    new LambdaQueryWrapper<FormRecord>()
                            .le(FormRecord::getCreatedAt, beforeDateTime)
                            .eq(FormRecord::getDeleted, 0)
            );
            case "OPERATION_LOG" -> operationLogMapper.selectList(
                    new LambdaQueryWrapper<OperationLog>()
                            .le(OperationLog::getActedAt, beforeDateTime)
            );
            case "CONSTRUCTION_LOG" -> constructionLogMapper.selectList(
                    new LambdaQueryWrapper<ConstructionLogSummary>()
                            .le(ConstructionLogSummary::getCreatedAt, beforeDateTime)
                            .eq(ConstructionLogSummary::getDeleted, 0)
            );
            case "INJURY_CLAIM" -> injuryClaimMapper.selectList(
                    new LambdaQueryWrapper<InjuryClaim>()
                            .le(InjuryClaim::getCreatedAt, beforeDateTime)
                            .eq(InjuryClaim::getDeleted, 0)
            );
            default -> {
                log.warn("未知的数据类型: {}", dataType);
                yield new ArrayList<>();
            }
        };
    }

    /**
     * 根据数据类型删除过期数据。
     *
     * @param dataType     数据类型
     * @param beforeDate   截止日期（包含）
     * @return 删除的记录数
     */
    private int deleteDataByType(String dataType, LocalDate beforeDate) {
        LocalDateTime beforeDateTime = beforeDate.atTime(23, 59, 59);

        return switch (dataType) {
            case "PAYROLL_SLIP" -> payrollSlipMapper.delete(
                    new LambdaQueryWrapper<PayrollSlip>()
                            .le(PayrollSlip::getCreatedAt, beforeDateTime)
                            .eq(PayrollSlip::getDeleted, 0)
            );
            case "FORM_RECORD" -> formRecordMapper.delete(
                    new LambdaQueryWrapper<FormRecord>()
                            .le(FormRecord::getCreatedAt, beforeDateTime)
                            .eq(FormRecord::getDeleted, 0)
            );
            case "OPERATION_LOG" -> operationLogMapper.delete(
                    new LambdaQueryWrapper<OperationLog>()
                            .le(OperationLog::getActedAt, beforeDateTime)
            );
            case "CONSTRUCTION_LOG" -> constructionLogMapper.delete(
                    new LambdaQueryWrapper<ConstructionLogSummary>()
                            .le(ConstructionLogSummary::getCreatedAt, beforeDateTime)
                            .eq(ConstructionLogSummary::getDeleted, 0)
            );
            case "INJURY_CLAIM" -> injuryClaimMapper.delete(
                    new LambdaQueryWrapper<InjuryClaim>()
                            .le(InjuryClaim::getCreatedAt, beforeDateTime)
                            .eq(InjuryClaim::getDeleted, 0)
            );
            default -> {
                log.warn("未知的数据类型，无法删除: {}", dataType);
                yield 0;
            }
        };
    }

    /**
     * 压缩单个文件到 ZIP。
     *
     * @param source   源文件路径
     * @param target   目标 ZIP 文件路径
     * @param entryName ZIP 条目名称
     * @throws IOException IO 异常
     */
    private void zipFile(Path source, Path target, String entryName) throws IOException {
        try (ZipOutputStream zos = new ZipOutputStream(new FileOutputStream(target.toFile()))) {
            ZipEntry entry = new ZipEntry(entryName);
            zos.putNextEntry(entry);
            Files.copy(source, zos);
            zos.closeEntry();
        }
    }

    /**
     * 验证并获取导出文件路径。
     * <p>
     * 检查下载令牌是否有效（未过期），有效则返回文件路径，
     * 无效（过期或不存在）返回 null。
     *
     * @param token 下载令牌（UUID）
     * @return 文件路径，如果令牌无效返回 null
     */
    public String downloadExport(String token) {
        if (token == null || token.isBlank()) {
            return null;
        }

        ExportBackupTask task = exportTaskMapper.findByDownloadToken(token);
        if (task == null || task.getDeleted() == 1) {
            log.warn("下载令牌不存在: token={}", token);
            return null;
        }

        if (!STATUS_DONE.equals(task.getStatus())) {
            log.warn("导出任务未完成: taskId={}, status={}", task.getId(), task.getStatus());
            return null;
        }

        if (task.getTokenExpiresAt() == null || task.getTokenExpiresAt().isBefore(LocalDateTime.now())) {
            log.warn("下载令牌已过期: taskId={}, tokenExpiresAt={}", task.getId(), task.getTokenExpiresAt());
            return null;
        }

        return task.getFilePath();
    }

    /**
     * 每日扫描任务，凌晨 2 点执行。
     * <p>
     * 扫描所有保留策略，对于每种数据类型：
     * <ol>
     *   <li>查找最旧的记录日期</li>
     *   <li>如果 (最旧日期 + 保留年限) <= (今天 + 警告提前天数)，则创建提醒</li>
     *   <li>如果相同策略和预计删除日期的提醒已存在，则跳过</li>
     *   <li>发布 RetentionExpiredEvent 事件</li>
     * </ol>
     */
    @Scheduled(cron = "0 0 2 * * ?")
    @Transactional
    public void dailyScan() {
        log.info("开始每日数据保留期限扫描...");
        LocalDate today = LocalDate.now();

        List<RetentionPolicy> policies = policyMapper.findAllActive();
        for (RetentionPolicy policy : policies) {
            try {
                scanPolicy(policy, today);
            } catch (Exception e) {
                log.error("扫描策略失败: policyId={}, dataType={}", policy.getId(), policy.getDataType(), e);
            }
        }

        log.info("每日数据保留期限扫描完成");
    }

    /**
     * 扫描单个保留策略。
     *
     * @param policy 保留策略
     * @param today  当前日期
     */
    private void scanPolicy(RetentionPolicy policy, LocalDate today) {
        // 查找最旧的记录日期
        LocalDate oldestDate = findOldestDate(policy.getDataType());
        if (oldestDate == null) {
            log.debug("无数据记录: dataType={}", policy.getDataType());
            return;
        }

        // 计算预计删除日期
        LocalDate expectedDeleteDate = oldestDate.plusYears(policy.getRetentionYears());

        // 计算警告日期
        LocalDate warnDate = today.plusDays(policy.getWarnBeforeDays());

        // 如果预计删除日期 <= 警告日期，则创建提醒
        if (!expectedDeleteDate.isAfter(warnDate)) {
            // 检查是否已存在相同策略和日期的提醒
            boolean exists = reminderExists(policy.getId(), expectedDeleteDate);
            if (!exists) {
                createReminder(policy, expectedDeleteDate);
            }
        }
    }

    /**
     * 查找指定数据类型的最旧记录日期。
     *
     * @param dataType 数据类型
     * @return 最旧记录日期，无记录返回 null
     */
    private LocalDate findOldestDate(String dataType) {
        return switch (dataType) {
            case "PAYROLL_SLIP" -> {
                PayrollSlip slip = payrollSlipMapper.selectOne(
                        new LambdaQueryWrapper<PayrollSlip>()
                                .eq(PayrollSlip::getDeleted, 0)
                                .orderByAsc(PayrollSlip::getCreatedAt)
                                .last("LIMIT 1")
                );
                yield slip != null && slip.getCreatedAt() != null ? slip.getCreatedAt().toLocalDate() : null;
            }
            case "FORM_RECORD" -> {
                FormRecord record = formRecordMapper.selectOne(
                        new LambdaQueryWrapper<FormRecord>()
                                .eq(FormRecord::getDeleted, 0)
                                .orderByAsc(FormRecord::getCreatedAt)
                                .last("LIMIT 1")
                );
                yield record != null && record.getCreatedAt() != null ? record.getCreatedAt().toLocalDate() : null;
            }
            case "OPERATION_LOG" -> {
                // 操作日志无 deleted 字段
                List<OperationLog> logs = operationLogMapper.selectList(
                        new LambdaQueryWrapper<OperationLog>()
                                .orderByAsc(OperationLog::getActedAt)
                                .last("LIMIT 1")
                );
                yield logs.isEmpty() || logs.get(0).getActedAt() == null ? null : logs.get(0).getActedAt().toLocalDate();
            }
            case "CONSTRUCTION_LOG" -> {
                ConstructionLogSummary log = constructionLogMapper.selectOne(
                        new LambdaQueryWrapper<ConstructionLogSummary>()
                                .eq(ConstructionLogSummary::getDeleted, 0)
                                .orderByAsc(ConstructionLogSummary::getCreatedAt)
                                .last("LIMIT 1")
                );
                yield log != null && log.getCreatedAt() != null ? log.getCreatedAt().toLocalDate() : null;
            }
            case "INJURY_CLAIM" -> {
                InjuryClaim claim = injuryClaimMapper.selectOne(
                        new LambdaQueryWrapper<InjuryClaim>()
                                .eq(InjuryClaim::getDeleted, 0)
                                .orderByAsc(InjuryClaim::getCreatedAt)
                                .last("LIMIT 1")
                );
                yield claim != null && claim.getCreatedAt() != null ? claim.getCreatedAt().toLocalDate() : null;
            }
            default -> {
                log.warn("未知的数据类型，无法查找最旧日期: {}", dataType);
                yield null;
            }
        };
    }

    /**
     * 检查是否已存在相同策略和预计删除日期的提醒。
     *
     * @param policyId          策略 ID
     * @param expectedDeleteDate 预计删除日期
     * @return true 如果已存在
     */
    private boolean reminderExists(Long policyId, LocalDate expectedDeleteDate) {
        Long count = reminderMapper.selectCount(
                new LambdaQueryWrapper<RetentionReminder>()
                        .eq(RetentionReminder::getPolicyId, policyId)
                        .eq(RetentionReminder::getExpectedDeleteDate, expectedDeleteDate)
                        .eq(RetentionReminder::getDeleted, 0)
        );
        return count != null && count > 0;
    }

    /**
     * 创建保留提醒。
     *
     * @param policy             保留策略
     * @param expectedDeleteDate 预计删除日期
     */
    private void createReminder(RetentionPolicy policy, LocalDate expectedDeleteDate) {
        RetentionReminder reminder = new RetentionReminder();
        reminder.setPolicyId(policy.getId());
        reminder.setDataType(policy.getDataType());
        reminder.setExpectedDeleteDate(expectedDeleteDate);
        reminder.setStatus(STATUS_PENDING);
        reminder.setCreatedAt(LocalDateTime.now());
        reminder.setUpdatedAt(LocalDateTime.now());
        reminderMapper.insert(reminder);

        // 发布事件
        eventPublisher.publishEvent(new RetentionExpiredEvent(this, policy, expectedDeleteDate, policy.getDataType()));

        log.info("创建保留提醒: policyId={}, dataType={}, expectedDeleteDate={}",
                policy.getId(), policy.getDataType(), expectedDeleteDate);
    }
}
