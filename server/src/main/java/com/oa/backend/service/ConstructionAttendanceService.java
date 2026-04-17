package com.oa.backend.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.oa.backend.entity.ConstructionAttendance;
import com.oa.backend.entity.FormRecord;
import com.oa.backend.mapper.ConstructionAttendanceMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * 结构化施工出勤服务（设计 §8.4 / §8.3）。
 *
 * 写入入口：
 *   - WorkLogController.submitLog 调用 {@link #recordFromLogForm} 自动写入
 *   - 重新提交日志时先 {@link #softDeleteByForm} 再写入
 *
 * 查询入口：
 *   - {@link #countDaysByEmployee} 单员工指定项目+周期天数
 *   - {@link #aggregatePerEmployee} 项目周期内全员明细
 *
 * form_data 标准约定（设计 §8.3 工长字段）：
 *   { "date": "YYYY-MM-DD", "attendees": [employeeId, ...], "content": "...", "materials": [...] }
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ConstructionAttendanceService {

    private final ConstructionAttendanceMapper attendanceMapper;
    private final ObjectMapper objectMapper;

    /**
     * 从 LOG/INJURY/OVERTIME form_record 中抽取 attendees + date 写入 attendance 表。
     * source 由调用方传入。幂等：相同 (employee_id, date, source_form_id) 触发 UNIQUE 约束 → 静默忽略。
     */
    @Transactional
    public int recordFromLogForm(FormRecord form, Long projectId, String source) {
        if (form == null || form.getFormData() == null || projectId == null) return 0;
        try {
            Map<String, Object> data = objectMapper.readValue(form.getFormData(),
                    new TypeReference<Map<String, Object>>() {});
            String dateStr = (String) data.get("date");
            if (dateStr == null || dateStr.isBlank()) {
                log.warn("LOG form 缺少 date 字段，跳过出勤记录: formId={}", form.getId());
                return 0;
            }
            LocalDate date;
            try { date = LocalDate.parse(dateStr.length() > 10 ? dateStr.substring(0, 10) : dateStr); }
            catch (Exception e) { log.warn("date 格式无效: {} formId={}", dateStr, form.getId()); return 0; }

            Set<Long> empIds = new HashSet<>();
            // attendees: [Long] — 标准约定
            Object att = data.get("attendees");
            if (att instanceof List<?> list) {
                for (Object o : list) {
                    if (o instanceof Number n) empIds.add(n.longValue());
                    else if (o != null) {
                        // 保留原因：attendees 列表中单条非数字项静默跳过，避免脏数据阻塞整条日志写入；
                        // 用 debug 级别避免循环内每条脏数据刷屏
                        try { empIds.add(Long.parseLong(o.toString())); }
                        catch (NumberFormatException e) {
                            log.debug("attendees item is not a valid numeric id, skipped: formId={}, value={}",
                                    form.getId(), o);
                        }
                    }
                }
            }
            // 兼容：若 attendees 缺失，至少把 submitter 自己计为出勤一天
            if (empIds.isEmpty() && form.getSubmitterId() != null) {
                empIds.add(form.getSubmitterId());
            }

            int written = 0;
            for (Long empId : empIds) {
                ConstructionAttendance row = new ConstructionAttendance();
                row.setProjectId(projectId);
                row.setEmployeeId(empId);
                row.setAttendanceDate(date);
                row.setSource(source != null ? source : "LOG");
                row.setSourceFormId(form.getId());
                row.setCreatedAt(LocalDateTime.now());
                row.setUpdatedAt(LocalDateTime.now());
                try {
                    attendanceMapper.insert(row);
                    written++;
                } catch (org.springframework.dao.DuplicateKeyException e) {
                    // 保留原因: UNIQUE 冲突表示记录已存在，属于幂等写入的正常路径，不中断循环
                    log.debug("出勤记录已存在，跳过 empId={} date={}", empId, date, e);
                }
            }
            return written;
        } catch (Exception e) {
            log.warn("解析 LOG form_data 写入出勤失败 formId={}", form.getId(), e);
            return 0;
        }
    }

    /** 当一条 LOG 表单被驳回/撤回/修改时，先软删原出勤记录 */
    @Transactional
    public void softDeleteByForm(Long formId) {
        if (formId == null) return;
        List<ConstructionAttendance> rows = attendanceMapper.selectList(
                new LambdaQueryWrapper<ConstructionAttendance>()
                        .eq(ConstructionAttendance::getSourceFormId, formId)
                        .eq(ConstructionAttendance::getDeleted, 0));
        for (ConstructionAttendance r : rows) attendanceMapper.deleteById(r.getId());
    }

    /** 项目周期内全员去重出勤天数：employeeId → days */
    public Map<Long, Long> aggregatePerEmployee(Long projectId, LocalDate start, LocalDate end) {
        Map<Long, Long> out = new HashMap<>();
        List<Map<String, Object>> rows = attendanceMapper.aggregatePerEmployee(projectId, start, end);
        for (Map<String, Object> r : rows) {
            Object eid = r.get("employeeId"), days = r.get("days");
            if (eid != null && days != null) {
                out.put(((Number) eid).longValue(), ((Number) days).longValue());
            }
        }
        return out;
    }

    /** 单员工指定项目周期天数，员工不在 → 0 */
    public long countDaysByEmployee(Long projectId, Long employeeId, LocalDate start, LocalDate end) {
        return aggregatePerEmployee(projectId, start, end).getOrDefault(employeeId, 0L);
    }

    /** 项目周期总出勤人天（所有去重 employee+date 行数） */
    public long totalManDays(Long projectId, LocalDate start, LocalDate end) {
        return attendanceMapper.totalManDays(projectId, start, end);
    }
}
