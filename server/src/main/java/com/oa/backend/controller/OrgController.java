package com.oa.backend.controller;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.oa.backend.dto.OrgNodeResponse;
import com.oa.backend.dto.SupervisorUpdateRequest;
import com.oa.backend.entity.Department;
import com.oa.backend.entity.Employee;
import com.oa.backend.entity.Position;
import com.oa.backend.entity.Role;
import com.oa.backend.mapper.DepartmentMapper;
import com.oa.backend.mapper.EmployeeMapper;
import com.oa.backend.mapper.PositionMapper;
import com.oa.backend.mapper.RoleMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

/**
 * 组织架构控制器
 */
@RestController
@RequestMapping("/org")
@RequiredArgsConstructor
public class OrgController {

    private final EmployeeMapper employeeMapper;
    private final DepartmentMapper departmentMapper;
    private final PositionMapper positionMapper;
    private final RoleMapper roleMapper;

    /**
     * 获取组织架构树
     * 权限：CEO only
     */
    @GetMapping("/tree")
    @PreAuthorize("hasRole('CEO')")
    public ResponseEntity<List<OrgNodeResponse>> getOrgTree() {
        // 1. 查询所有在职员工
        QueryWrapper<Employee> empWrapper = new QueryWrapper<>();
        empWrapper.eq("deleted", 0);
        empWrapper.eq("account_status", "ACTIVE");
        List<Employee> employees = employeeMapper.selectList(empWrapper);

        // 2. 加载部门名称映射
        Map<Long, String> deptNameMap = new HashMap<>();
        try {
            List<Department> depts = departmentMapper.selectList(null);
            for (Department d : depts) {
                deptNameMap.put(d.getId(), d.getName());
            }
        } catch (Exception e) {
            // 忽略查询失败
        }

        // 3. 加载岗位名称映射
        Map<Long, String> positionNameMap = new HashMap<>();
        try {
            QueryWrapper<Position> posWrapper = new QueryWrapper<>();
            posWrapper.eq("deleted", 0);
            List<Position> positions = positionMapper.selectList(posWrapper);
            for (Position p : positions) {
                positionNameMap.put(p.getId(), p.getPositionName());
            }
        } catch (Exception e) {
            // 忽略查询失败
        }

        // 4. 加载角色名称映射
        Map<String, String> roleNameMap = new HashMap<>();
        try {
            List<Role> roles = roleMapper.selectList(null);
            for (Role r : roles) {
                roleNameMap.put(r.getRoleCode(), r.getRoleName());
            }
        } catch (Exception e) {
            // 忽略查询失败
        }

        // 5. 构建员工节点映射
        Map<Long, OrgNodeResponse> nodeMap = new HashMap<>();
        for (Employee emp : employees) {
            String roleName = roleNameMap.getOrDefault(emp.getRoleCode(), emp.getRoleCode());
            String deptName = deptNameMap.getOrDefault(emp.getDepartmentId(), "");
            String positionName = positionNameMap.getOrDefault(emp.getPositionId(), "");

            OrgNodeResponse node = new OrgNodeResponse(
                emp.getId(),
                emp.getEmployeeNo(),
                emp.getName(),
                emp.getRoleCode(),
                roleName,
                emp.getDepartmentId(),
                deptName,
                emp.getPositionId(),
                positionName,
                emp.getDirectSupervisorId(),
                new ArrayList<>()
            );
            nodeMap.put(emp.getId(), node);
        }

        // 6. 构建树结构
        List<OrgNodeResponse> roots = new ArrayList<>();
        for (OrgNodeResponse node : nodeMap.values()) {
            Long supervisorId = node.directSupervisorId();
            if (supervisorId == null || !nodeMap.containsKey(supervisorId)) {
                // 无上级或上级不存在，作为根节点
                roots.add(node);
            } else {
                // 挂到上级节点下
                OrgNodeResponse parent = nodeMap.get(supervisorId);
                parent.children().add(node);
            }
        }

        // 7. 按角色排序（CEO 在前，其他按字母序）
        roots.sort(Comparator.comparing(OrgNodeResponse::roleCode));
        sortChildren(roots);

        return ResponseEntity.ok(roots);
    }

    /**
     * 递归排序子节点
     */
    private void sortChildren(List<OrgNodeResponse> nodes) {
        for (OrgNodeResponse node : nodes) {
            if (node.children() != null && !node.children().isEmpty()) {
                node.children().sort(Comparator.comparing(OrgNodeResponse::roleCode));
                sortChildren(node.children());
            }
        }
    }

    /**
     * 修改员工直系领导
     * 权限：CEO only
     */
    @PatchMapping("/supervisor/{employeeId}")
    @PreAuthorize("hasRole('CEO')")
    public ResponseEntity<OrgNodeResponse> updateSupervisor(
            @PathVariable Long employeeId,
            @RequestBody SupervisorUpdateRequest request) {
        
        // 1. 查找员工
        QueryWrapper<Employee> wrapper = new QueryWrapper<>();
        wrapper.eq("id", employeeId);
        wrapper.eq("deleted", 0);
        Employee employee = employeeMapper.selectOne(wrapper);
        if (employee == null) {
            throw new IllegalArgumentException("员工不存在");
        }

        Long newSupervisorId = request.supervisorId();

        // 2. 如果指定了新上级，验证其存在性
        if (newSupervisorId != null) {
            if (newSupervisorId.equals(employeeId)) {
                throw new IllegalArgumentException("不能将自己设为自己的上级");
            }

            QueryWrapper<Employee> supWrapper = new QueryWrapper<>();
            supWrapper.eq("id", newSupervisorId);
            supWrapper.eq("deleted", 0);
            Employee supervisor = employeeMapper.selectOne(supWrapper);
            if (supervisor == null) {
                throw new IllegalArgumentException("指定的上级不存在");
            }

            // 3. 防止循环汇报：新上级不能是该员工的下属
            if (isSubordinate(newSupervisorId, employeeId)) {
                throw new IllegalArgumentException("不能将下属设为自己的上级（会导致循环汇报）");
            }
        }

        // 4. 更新上级
        employee.setDirectSupervisorId(newSupervisorId);
        employeeMapper.updateById(employee);

        // 5. 重新查询组织架构树并返回该员工节点
        List<OrgNodeResponse> tree = getOrgTree().getBody();
        OrgNodeResponse updatedNode = findNodeInTree(tree, employeeId);
        if (updatedNode == null) {
            // 如果找不到（可能是逻辑问题），构建一个简化响应
            updatedNode = buildSimpleNodeResponse(employee);
        }

        return ResponseEntity.ok(updatedNode);
    }

    /**
     * 检查 targetId 是否是 employeeId 的下属（防止循环汇报）
     */
    private boolean isSubordinate(Long targetId, Long employeeId) {
        QueryWrapper<Employee> wrapper = new QueryWrapper<>();
        wrapper.eq("direct_supervisor_id", employeeId);
        wrapper.eq("deleted", 0);
        List<Employee> subordinates = employeeMapper.selectList(wrapper);

        for (Employee sub : subordinates) {
            if (sub.getId().equals(targetId)) {
                return true;
            }
            // 递归检查下属的下属
            if (isSubordinate(targetId, sub.getId())) {
                return true;
            }
        }
        return false;
    }

    /**
     * 在树中查找指定节点
     */
    private OrgNodeResponse findNodeInTree(List<OrgNodeResponse> tree, Long employeeId) {
        if (tree == null) return null;
        for (OrgNodeResponse node : tree) {
            if (node.id().equals(employeeId)) {
                return node;
            }
            OrgNodeResponse found = findNodeInTree(node.children(), employeeId);
            if (found != null) {
                return found;
            }
        }
        return null;
    }

    /**
     * 构建简化的节点响应（备用）
     */
    private OrgNodeResponse buildSimpleNodeResponse(Employee emp) {
        String deptName = "";
        String positionName = "";
        String roleName = emp.getRoleCode();

        try {
            Department dept = departmentMapper.selectById(emp.getDepartmentId());
            if (dept != null) deptName = dept.getName();
        } catch (Exception e) {
            // 忽略
        }

        try {
            Position pos = positionMapper.selectById(emp.getPositionId());
            if (pos != null) positionName = pos.getPositionName();
        } catch (Exception e) {
            // 忽略
        }

        try {
            Role role = roleMapper.selectOne(
                new QueryWrapper<Role>().eq("role_code", emp.getRoleCode())
            );
            if (role != null) roleName = role.getRoleName();
        } catch (Exception e) {
            // 忽略
        }

        return new OrgNodeResponse(
            emp.getId(),
            emp.getEmployeeNo(),
            emp.getName(),
            emp.getRoleCode(),
            roleName,
            emp.getDepartmentId(),
            deptName,
            emp.getPositionId(),
            positionName,
            emp.getDirectSupervisorId(),
            new ArrayList<>()
        );
    }
}
