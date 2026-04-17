package com.oa.backend.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.oa.backend.dto.WorkItemTemplateRequest;
import com.oa.backend.dto.WorkItemTemplateResponse;
import com.oa.backend.entity.Employee;
import com.oa.backend.entity.WorkItemTemplate;
import com.oa.backend.mapper.EmployeeMapper;
import com.oa.backend.mapper.WorkItemTemplateMapper;
import com.oa.backend.security.SecurityUtils;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

/**
 * 工作项模板控制器
 * 职责：提供模板 CRUD 和派生功能，供 PM/CEO 管理施工工作项模板。
 * 数据来源：work_item_template 表，items 以 JSON 数组存储。
 */
@Slf4j
@RestController
@RequestMapping("/work-item-templates")
@RequiredArgsConstructor
public class WorkItemTemplateController {

    private final WorkItemTemplateMapper templateMapper;
    private final EmployeeMapper employeeMapper;
    private final ObjectMapper objectMapper;

    /** 查询所有模板（含项目级和全局模板） */
    @GetMapping
    @PreAuthorize("hasAnyRole('CEO','PROJECT_MANAGER','WORKER')")
    public ResponseEntity<List<WorkItemTemplateResponse>> list(
            @RequestParam(required = false) Long projectId) {
        LambdaQueryWrapper<WorkItemTemplate> qw = new LambdaQueryWrapper<WorkItemTemplate>()
                .eq(WorkItemTemplate::getDeleted, 0)
                .orderByDesc(WorkItemTemplate::getCreatedAt);
        if (projectId != null) {
            qw.eq(WorkItemTemplate::getProjectId, projectId);
        }
        return ResponseEntity.ok(templateMapper.selectList(qw).stream()
                .map(this::toResponse)
                .collect(Collectors.toList()));
    }

    /** 创建模板 */
    @PostMapping
    @PreAuthorize("hasAnyRole('CEO','PROJECT_MANAGER')")
    public ResponseEntity<WorkItemTemplateResponse> create(
            @Valid @RequestBody WorkItemTemplateRequest req,
            Authentication auth) {
        Long creatorId = getEmployeeId(auth);
        WorkItemTemplate tmpl = buildTemplate(req, creatorId, null);
        templateMapper.insert(tmpl);
        return ResponseEntity.ok(toResponse(tmpl));
    }

    /** 更新模板 */
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('CEO','PROJECT_MANAGER')")
    public ResponseEntity<WorkItemTemplateResponse> update(
            @PathVariable Long id,
            @Valid @RequestBody WorkItemTemplateRequest req) {
        WorkItemTemplate existing = templateMapper.selectById(id);
        if (existing == null || existing.getDeleted() != 0) {
            return ResponseEntity.notFound().build();
        }
        existing.setName(req.name());
        existing.setProjectId(req.projectId());
        existing.setItems(serializeItems(req.items()));
        existing.setUpdatedAt(LocalDateTime.now());
        templateMapper.updateById(existing);
        return ResponseEntity.ok(toResponse(existing));
    }

    /** 删除模板（逻辑删除） */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('CEO','PROJECT_MANAGER')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        WorkItemTemplate existing = templateMapper.selectById(id);
        if (existing == null || existing.getDeleted() != 0) {
            return ResponseEntity.notFound().build();
        }
        existing.setDeleted(1);
        existing.setUpdatedAt(LocalDateTime.now());
        templateMapper.updateById(existing);
        return ResponseEntity.noContent().build();
    }

    /**
     * 派生模板：复制原模板内容为新模板，原模板不变
     * 新模板 derivedFrom 指向原模板 ID
     */
    @PostMapping("/{id}/derive")
    @PreAuthorize("hasAnyRole('CEO','PROJECT_MANAGER')")
    public ResponseEntity<WorkItemTemplateResponse> derive(
            @PathVariable Long id,
            @Valid @RequestBody WorkItemTemplateRequest req,
            Authentication auth) {
        WorkItemTemplate original = templateMapper.selectById(id);
        if (original == null || original.getDeleted() != 0) {
            return ResponseEntity.notFound().build();
        }
        Long creatorId = getEmployeeId(auth);
        WorkItemTemplate derived = buildTemplate(req, creatorId, id);
        templateMapper.insert(derived);
        return ResponseEntity.ok(toResponse(derived));
    }

    // ── helpers ─────────────────────────────────────────────────

    private WorkItemTemplate buildTemplate(WorkItemTemplateRequest req, Long creatorId, Long derivedFrom) {
        WorkItemTemplate tmpl = new WorkItemTemplate();
        tmpl.setName(req.name());
        tmpl.setProjectId(req.projectId());
        tmpl.setCreatedBy(creatorId);
        tmpl.setItems(serializeItems(req.items()));
        tmpl.setDerivedFrom(derivedFrom);
        tmpl.setCreatedAt(LocalDateTime.now());
        tmpl.setUpdatedAt(LocalDateTime.now());
        tmpl.setDeleted(0);
        return tmpl;
    }

    private String serializeItems(List<WorkItemTemplateRequest.ItemDef> items) {
        if (items == null || items.isEmpty()) return "[]";
        try {
            return objectMapper.writeValueAsString(items);
        } catch (JsonProcessingException e) {
            return "[]";
        }
    }

    @SuppressWarnings("unchecked")
    private WorkItemTemplateResponse toResponse(WorkItemTemplate tmpl) {
        List<WorkItemTemplateResponse.ItemDef> items = Collections.emptyList();
        if (tmpl.getItems() != null && !tmpl.getItems().isBlank()) {
            try {
                List<java.util.Map<String, Object>> raw = objectMapper.readValue(tmpl.getItems(), List.class);
                items = raw.stream()
                        .map(m -> new WorkItemTemplateResponse.ItemDef(
                                m.getOrDefault("name", "").toString(),
                                m.get("defaultUnit") != null ? m.get("defaultUnit").toString() : null))
                        .collect(Collectors.toList());
            } catch (Exception e) {
                // 保留原因：items 字段 JSON 损坏时兜底为空列表，不阻塞模板信息返回
                log.warn("WorkItemTemplate: failed to parse items JSON for templateId={}", tmpl.getId(), e);
            }
        }
        return new WorkItemTemplateResponse(
                tmpl.getId(), tmpl.getName(), tmpl.getProjectId(),
                tmpl.getCreatedBy(), items, tmpl.getDerivedFrom(), tmpl.getCreatedAt());
    }

    private Long getEmployeeId(Authentication auth) {
        if (auth == null) return null;
        Employee emp = SecurityUtils.getEmployeeFromUsername(auth.getName(), employeeMapper);
        return emp != null ? emp.getId() : null;
    }
}
