package com.oa.backend.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.oa.backend.entity.ProjectMaterialCost;
import com.oa.backend.entity.SecondRoleAssignment;
import com.oa.backend.mapper.EmployeeMapper;
import com.oa.backend.mapper.ProjectMaterialCostMapper;
import com.oa.backend.mapper.SecondRoleAssignmentMapper;
import com.oa.backend.security.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/**
 * 项目实体成本（物料/设备直接成本）Controller。
 * 录入权限：PM / 财务 / CEO / 总经理 / 项目下持有 MATERIAL_MANAGER 第二角色的员工。
 */
@RestController
@RequestMapping("/projects/{projectId}/material-costs")
@RequiredArgsConstructor
public class ProjectMaterialCostController {

    private final ProjectMaterialCostMapper costMapper;
    private final SecondRoleAssignmentMapper secondRoleMapper;
    private final EmployeeMapper employeeMapper;

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<ProjectMaterialCost>> list(@PathVariable Long projectId) {
        return ResponseEntity.ok(costMapper.selectList(
                new LambdaQueryWrapper<ProjectMaterialCost>()
                        .eq(ProjectMaterialCost::getProjectId, projectId)
                        .eq(ProjectMaterialCost::getDeleted, 0)
                        .orderByDesc(ProjectMaterialCost::getOccurredOn)));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('CEO','GENERAL_MANAGER','PROJECT_MANAGER','FINANCE','EMPLOYEE')")
    public ResponseEntity<?> create(@PathVariable Long projectId, @RequestBody CostRequest req, Authentication auth) {
        Long me = SecurityUtils.getEmployeeIdFromUsername(auth.getName(), employeeMapper);
        if (!canRecord(me, projectId, auth)) {
            return ResponseEntity.status(403).body(Map.of("message", "无权录入此项目实体成本"));
        }
        if (req.itemName() == null || req.itemName().isBlank()
                || req.quantity() == null || req.unit() == null || req.unit().isBlank()
                || req.unitPrice() == null || req.occurredOn() == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "itemName/quantity/unit/unitPrice/occurredOn 必填"));
        }
        ProjectMaterialCost c = new ProjectMaterialCost();
        c.setProjectId(projectId);
        c.setItemName(req.itemName());
        c.setSpec(req.spec());
        c.setQuantity(req.quantity());
        c.setUnit(req.unit());
        c.setUnitPrice(req.unitPrice());
        c.setOccurredOn(req.occurredOn());
        c.setRemark(req.remark());
        c.setRecordedBy(me);
        c.setCreatedAt(LocalDateTime.now());
        c.setUpdatedAt(LocalDateTime.now());
        costMapper.insert(c);
        return ResponseEntity.ok(c);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('CEO','GENERAL_MANAGER','PROJECT_MANAGER','FINANCE','EMPLOYEE')")
    public ResponseEntity<?> update(@PathVariable Long projectId, @PathVariable Long id, @RequestBody CostRequest req, Authentication auth) {
        ProjectMaterialCost c = costMapper.selectById(id);
        if (c == null || c.getDeleted() == 1 || !c.getProjectId().equals(projectId)) {
            return ResponseEntity.notFound().build();
        }
        Long me = SecurityUtils.getEmployeeIdFromUsername(auth.getName(), employeeMapper);
        if (!canRecord(me, projectId, auth)) {
            return ResponseEntity.status(403).body(Map.of("message", "无权修改"));
        }
        if (req.itemName() != null) c.setItemName(req.itemName());
        if (req.spec() != null) c.setSpec(req.spec());
        if (req.quantity() != null) c.setQuantity(req.quantity());
        if (req.unit() != null) c.setUnit(req.unit());
        if (req.unitPrice() != null) c.setUnitPrice(req.unitPrice());
        if (req.occurredOn() != null) c.setOccurredOn(req.occurredOn());
        if (req.remark() != null) c.setRemark(req.remark());
        c.setUpdatedAt(LocalDateTime.now());
        costMapper.updateById(c);
        return ResponseEntity.ok(c);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('CEO','PROJECT_MANAGER','FINANCE')")
    public ResponseEntity<?> delete(@PathVariable Long projectId, @PathVariable Long id) {
        ProjectMaterialCost c = costMapper.selectById(id);
        if (c == null || c.getDeleted() == 1 || !c.getProjectId().equals(projectId)) {
            return ResponseEntity.notFound().build();
        }
        costMapper.deleteById(id);
        return ResponseEntity.ok(Map.of("message", "已删除", "id", id));
    }

    private boolean canRecord(Long employeeId, Long projectId, Authentication auth) {
        if (employeeId == null) return false;
        if (SecurityUtils.isCEO(auth) || SecurityUtils.isProjectManager(auth) || SecurityUtils.isFinance(auth)) return true;
        if (auth.getAuthorities().stream().anyMatch(a -> "ROLE_GENERAL_MANAGER".equals(a.getAuthority()))) return true;
        Long count = secondRoleMapper.selectCount(
                new LambdaQueryWrapper<SecondRoleAssignment>()
                        .eq(SecondRoleAssignment::getEmployeeId, employeeId)
                        .eq(SecondRoleAssignment::getRoleCode, "MATERIAL_MANAGER")
                        .eq(SecondRoleAssignment::getProjectId, projectId)
                        .eq(SecondRoleAssignment::getRevoked, false)
                        .eq(SecondRoleAssignment::getDeleted, 0));
        return count != null && count > 0;
    }

    public record CostRequest(
            String itemName, String spec, BigDecimal quantity, String unit,
            BigDecimal unitPrice, LocalDate occurredOn, String remark) {}
}
