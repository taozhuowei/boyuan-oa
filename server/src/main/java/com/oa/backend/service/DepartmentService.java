package com.oa.backend.service;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.oa.backend.entity.Department;
import com.oa.backend.entity.Employee;
import com.oa.backend.mapper.DepartmentMapper;
import com.oa.backend.mapper.EmployeeMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * 部门管理服务
 * 职责：封装部门（Department）及员工人数统计的持久层操作，
 *      供 DepartmentController 调用，隔离控制器与 Mapper 细节。
 */
@Service
@RequiredArgsConstructor
public class DepartmentService {

    private final DepartmentMapper departmentMapper;
    private final EmployeeMapper employeeMapper;

    /**
     * 查询所有未删除部门，按 sort、id 升序排列。
     *
     * @return 部门列表（扁平，未组装树形）
     */
    public List<Department> listAllActiveDepartments() {
        QueryWrapper<Department> wrapper = new QueryWrapper<>();
        wrapper.eq("deleted", 0).orderByAsc("sort", "id");
        return departmentMapper.selectList(wrapper);
    }

    /**
     * 统计每个部门的在职员工数（状态为 ACTIVE 且未软删除）。
     * key = department_id，value = 员工数。
     *
     * @return 部门 ID 到员工数的映射
     */
    public Map<Long, Integer> countEmployeesByDepartment() {
        QueryWrapper<Employee> countWrapper = new QueryWrapper<>();
        countWrapper.select("department_id, count(*) as count")
                .eq("deleted", 0)
                .eq("account_status", "ACTIVE")
                .groupBy("department_id");
        List<Map<String, Object>> rows = employeeMapper.selectMaps(countWrapper);
        return rows.stream()
                .filter(m -> m.get("department_id") != null)
                .collect(Collectors.toMap(
                        m -> ((Number) m.get("department_id")).longValue(),
                        m -> ((Number) m.get("count")).intValue(),
                        (a, b) -> a
                ));
    }

    /**
     * 按 id 查询部门；若不存在或已软删除则返回 null。
     *
     * @param id 主键
     * @return 部门实体，或 null
     */
    public Department findActiveById(Long id) {
        Department dept = departmentMapper.selectById(id);
        return (dept == null || dept.getDeleted() == 1) ? null : dept;
    }

    /**
     * 插入新部门到数据库，createdAt/updatedAt/deleted 由调用方在实体上赋值后传入。
     *
     * @param department 待插入的部门实体
     */
    public void createDepartment(Department department) {
        departmentMapper.insert(department);
    }

    /**
     * 更新部门信息。
     *
     * @param department 已修改字段的部门实体
     */
    public void updateDepartment(Department department) {
        department.setUpdatedAt(LocalDateTime.now());
        departmentMapper.updateById(department);
    }

    /**
     * 检查指定部门下是否有在职员工。
     *
     * @param departmentId 部门 ID
     * @return true 表示存在在职员工
     */
    public boolean hasActiveEmployees(Long departmentId) {
        QueryWrapper<Employee> wrapper = new QueryWrapper<>();
        wrapper.eq("department_id", departmentId)
                .eq("deleted", 0)
                .eq("account_status", "ACTIVE");
        return employeeMapper.selectCount(wrapper) > 0;
    }

    /**
     * 检查指定部门下是否有未删除的子部门。
     *
     * @param parentId 父部门 ID
     * @return true 表示存在子部门
     */
    public boolean hasActiveChildDepartments(Long parentId) {
        QueryWrapper<Department> wrapper = new QueryWrapper<>();
        wrapper.eq("parent_id", parentId).eq("deleted", 0);
        return departmentMapper.selectCount(wrapper) > 0;
    }

    /**
     * 软删除部门（将 deleted 置为 1）。
     *
     * @param department 待删除的部门实体
     */
    public void softDeleteDepartment(Department department) {
        department.setDeleted(1);
        department.setUpdatedAt(LocalDateTime.now());
        departmentMapper.updateById(department);
    }
}
