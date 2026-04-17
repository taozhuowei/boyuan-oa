package com.oa.backend.service;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.oa.backend.dto.OrgNodeResponse;
import com.oa.backend.entity.Department;
import com.oa.backend.entity.Employee;
import com.oa.backend.entity.Position;
import com.oa.backend.entity.Role;
import com.oa.backend.mapper.DepartmentMapper;
import com.oa.backend.mapper.EmployeeMapper;
import com.oa.backend.mapper.PositionMapper;
import com.oa.backend.mapper.RoleMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 组织架构服务
 *
 * 职责：
 *   - 构建组织架构树（员工节点 + 部门/岗位/角色名称映射）
 *   - 更新员工直系领导，含循环汇报校验
 *   - 构建单个员工的 OrgNodeResponse（备用路径）
 *
 * 数据来源：employee、department、position、role 四张表。
 * 调用方：OrgController（CEO 专属接口）。
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class OrgService {

    private final EmployeeMapper employeeMapper;
    private final DepartmentMapper departmentMapper;
    private final PositionMapper positionMapper;
    private final RoleMapper roleMapper;

    /**
     * 构建完整组织架构树。
     * 辅助字段（部门名、岗位名、角色名）加载失败时兜底为空值，不阻塞主流程。
     *
     * @return 根节点列表，每个节点含 children（递归）
     */
    public List<OrgNodeResponse> buildOrgTree() {
        // 1. 查询所有在职员工
        QueryWrapper<Employee> empWrapper = new QueryWrapper<>();
        empWrapper.eq("deleted", 0);
        empWrapper.eq("account_status", "ACTIVE");
        List<Employee> employees = employeeMapper.selectList(empWrapper);

        // 2. 加载部门名称映射（失败不阻塞组织树主流程）
        Map<Long, String> deptNameMap = new HashMap<>();
        try {
            List<Department> depts = departmentMapper.selectList(null);
            for (Department d : depts) {
                deptNameMap.put(d.getId(), d.getName());
            }
        } catch (Exception e) {
            log.warn("OrgTree: failed to load department name map", e);
        }

        // 3. 加载岗位名称映射（失败不阻塞主流程）
        Map<Long, String> positionNameMap = new HashMap<>();
        try {
            QueryWrapper<Position> posWrapper = new QueryWrapper<>();
            posWrapper.eq("deleted", 0);
            List<Position> positions = positionMapper.selectList(posWrapper);
            for (Position p : positions) {
                positionNameMap.put(p.getId(), p.getPositionName());
            }
        } catch (Exception e) {
            log.warn("OrgTree: failed to load position name map", e);
        }

        // 4. 加载角色名称映射（失败不阻塞主流程）
        Map<String, String> roleNameMap = new HashMap<>();
        try {
            List<Role> roles = roleMapper.selectList(null);
            for (Role r : roles) {
                roleNameMap.put(r.getRoleCode(), r.getRoleName());
            }
        } catch (Exception e) {
            log.warn("OrgTree: failed to load role name map", e);
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
                roots.add(node);
            } else {
                nodeMap.get(supervisorId).children().add(node);
            }
        }

        // 7. 按角色排序（递归）
        roots.sort(Comparator.comparing(OrgNodeResponse::roleCode));
        sortChildren(roots);

        return roots;
    }

    /**
     * 更新员工直系领导。
     * 校验：员工存在、新上级存在、不能自己设自己、不能将下属设为上级。
     *
     * @param employeeId    被修改的员工 ID
     * @param newSupervisorId 新上级 ID，null 表示清除上级
     * @throws IllegalArgumentException 违反业务规则时抛出
     */
    public Employee updateSupervisor(Long employeeId, Long newSupervisorId) {
        QueryWrapper<Employee> wrapper = new QueryWrapper<>();
        wrapper.eq("id", employeeId);
        wrapper.eq("deleted", 0);
        Employee employee = employeeMapper.selectOne(wrapper);
        if (employee == null) {
            throw new IllegalArgumentException("员工不存在");
        }

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

            if (isSubordinate(newSupervisorId, employeeId)) {
                throw new IllegalArgumentException("不能将下属设为自己的上级（会导致循环汇报）");
            }
        }

        employee.setDirectSupervisorId(newSupervisorId);
        employeeMapper.updateById(employee);
        return employee;
    }

    /**
     * 在树中查找指定节点（递归）。
     *
     * @param tree       节点列表
     * @param employeeId 目标员工 ID
     * @return 找到的节点，未找到返回 null
     */
    public OrgNodeResponse findNodeInTree(List<OrgNodeResponse> tree, Long employeeId) {
        if (tree == null) return null;
        for (OrgNodeResponse node : tree) {
            if (node.id().equals(employeeId)) return node;
            OrgNodeResponse found = findNodeInTree(node.children(), employeeId);
            if (found != null) return found;
        }
        return null;
    }

    /**
     * 构建单个员工的节点响应（备用路径，逐字段查询）。
     * 各辅助字段查询失败时兜底为空，不阻塞响应构建。
     *
     * @param emp 员工实体
     * @return OrgNodeResponse（children 为空列表）
     */
    public OrgNodeResponse buildSimpleNodeResponse(Employee emp) {
        String deptName = "";
        String positionName = "";
        String roleName = emp.getRoleCode();

        try {
            Department dept = departmentMapper.selectById(emp.getDepartmentId());
            if (dept != null) deptName = dept.getName();
        } catch (Exception e) {
            log.warn("OrgNode: failed to load department for empId={}, departmentId={}",
                    emp.getId(), emp.getDepartmentId(), e);
        }

        try {
            Position pos = positionMapper.selectById(emp.getPositionId());
            if (pos != null) positionName = pos.getPositionName();
        } catch (Exception e) {
            log.warn("OrgNode: failed to load position for empId={}, positionId={}",
                    emp.getId(), emp.getPositionId(), e);
        }

        try {
            Role role = roleMapper.selectOne(
                new QueryWrapper<Role>().eq("role_code", emp.getRoleCode())
            );
            if (role != null) roleName = role.getRoleName();
        } catch (Exception e) {
            log.warn("OrgNode: failed to load role for empId={}, roleCode={}",
                    emp.getId(), emp.getRoleCode(), e);
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

    // ── Private helpers ──────────────────────────────────────────────────────

    /**
     * 检查 targetId 是否是 employeeId 的下属（递归，防止循环汇报）。
     */
    private boolean isSubordinate(Long targetId, Long employeeId) {
        QueryWrapper<Employee> wrapper = new QueryWrapper<>();
        wrapper.eq("direct_supervisor_id", employeeId);
        wrapper.eq("deleted", 0);
        List<Employee> subordinates = employeeMapper.selectList(wrapper);

        for (Employee sub : subordinates) {
            if (sub.getId().equals(targetId)) return true;
            if (isSubordinate(targetId, sub.getId())) return true;
        }
        return false;
    }

    /**
     * 递归排序子节点（按 roleCode 字母序）。
     */
    private void sortChildren(List<OrgNodeResponse> nodes) {
        for (OrgNodeResponse node : nodes) {
            if (node.children() != null && !node.children().isEmpty()) {
                node.children().sort(Comparator.comparing(OrgNodeResponse::roleCode));
                sortChildren(node.children());
            }
        }
    }
}
