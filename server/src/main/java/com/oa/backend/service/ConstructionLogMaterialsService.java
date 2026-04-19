package com.oa.backend.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.oa.backend.entity.FormRecord;
import com.oa.backend.mapper.FormRecordMapper;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.TreeMap;
import java.util.TreeSet;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

/**
 * 施工日志材料用量聚合服务（设计 §8.3 — PM 审核"通过并补充"时展示材料 × 日期合并视图）。
 *
 * <p>解析 form_data.materials 约定：[ { "name": "...", "quantity": 200, "unit": "袋" }, ... ]
 * 聚合维度：material name + date → sum(quantity)。
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ConstructionLogMaterialsService {

  private final FormRecordMapper formRecordMapper;
  private final ObjectMapper objectMapper;

  /**
   * 项目 [start, end] 期间所有已通过 LOG 表单的材料用量聚合。 返回结构： { "materials": [{ "name": "水泥", "unit": "袋",
   * "total": 200, "byDate": { "2026-04-01": 50, ... } }, ...], "dates": ["2026-04-01", ...] }
   */
  public Map<String, Object> aggregate(Long projectId, LocalDate start, LocalDate end) {
    List<FormRecord> records =
        formRecordMapper.selectList(
            new LambdaQueryWrapper<FormRecord>()
                .eq(FormRecord::getFormType, "LOG")
                .in(FormRecord::getStatus, "APPROVED", "APPROVING", "PENDING")
                .eq(FormRecord::getDeleted, 0));

    // materialName → (unit, dateStr → total)
    Map<String, MaterialBucket> byName = new LinkedHashMap<>();
    Set<String> dateSet = new TreeSet<>();

    for (FormRecord r : records) {
      try {
        if (r.getFormData() == null) continue;
        Map<String, Object> data =
            objectMapper.readValue(r.getFormData(), new TypeReference<Map<String, Object>>() {});
        // 过滤同项目
        Object pid = data.get("projectId");
        Long recProjectId =
            pid instanceof Number n
                ? n.longValue()
                : pid == null ? null : Long.parseLong(pid.toString());
        if (recProjectId == null || !recProjectId.equals(projectId)) continue;

        String dateStr = (String) data.get("date");
        if (dateStr == null) continue;
        LocalDate date;
        try {
          date = LocalDate.parse(dateStr.length() > 10 ? dateStr.substring(0, 10) : dateStr);
        } catch (Exception ex) {
          continue;
        }
        if (date.isBefore(start) || date.isAfter(end)) continue;
        String dateKey = date.toString();
        dateSet.add(dateKey);

        Object mats = data.get("materials");
        if (!(mats instanceof List<?> list)) continue;
        for (Object o : list) {
          if (!(o instanceof Map<?, ?> m)) continue;
          String name = (String) m.get("name");
          if (name == null || name.isBlank()) continue;
          Object unitRaw = m.get("unit");
          String unit = unitRaw == null ? "" : unitRaw.toString();
          BigDecimal qty;
          try {
            qty = new BigDecimal(String.valueOf(m.get("quantity")));
          } catch (Exception ex) {
            continue;
          }
          MaterialBucket bucket = byName.computeIfAbsent(name, k -> new MaterialBucket(unit));
          bucket.byDate.merge(dateKey, qty, BigDecimal::add);
          bucket.total = bucket.total.add(qty);
        }
      } catch (Exception e) {
        log.warn("解析 LOG materials 失败 formId={}", r.getId(), e);
      }
    }

    List<Map<String, Object>> materials = new ArrayList<>();
    List<Map.Entry<String, MaterialBucket>> entries = new ArrayList<>(byName.entrySet());
    entries.sort(Comparator.comparing(Map.Entry::getKey));
    for (Map.Entry<String, MaterialBucket> e : entries) {
      Map<String, Object> row = new LinkedHashMap<>();
      row.put("name", e.getKey());
      row.put("unit", e.getValue().unit);
      row.put("total", e.getValue().total);
      row.put("byDate", e.getValue().byDate);
      materials.add(row);
    }

    Map<String, Object> out = new LinkedHashMap<>();
    out.put("materials", materials);
    out.put("dates", new ArrayList<>(dateSet));
    return out;
  }

  private static class MaterialBucket {
    final String unit;
    BigDecimal total = BigDecimal.ZERO;
    final Map<String, BigDecimal> byDate = new TreeMap<>();

    MaterialBucket(String unit) {
      this.unit = unit;
    }
  }
}
