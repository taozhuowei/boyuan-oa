package com.oa.backend.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.oa.backend.entity.Employee;
import org.apache.ibatis.annotations.Mapper;

/**
 * 员工数据访问层接口，操作 sys_employee 表
 */
@Mapper
public interface EmployeeMapper extends BaseMapper<Employee> {
}
