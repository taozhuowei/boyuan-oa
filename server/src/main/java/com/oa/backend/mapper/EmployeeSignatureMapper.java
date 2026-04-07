package com.oa.backend.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.oa.backend.entity.EmployeeSignature;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Select;

/**
 * 员工电子签名 Mapper。
 */
@Mapper
public interface EmployeeSignatureMapper extends BaseMapper<EmployeeSignature> {

    /**
     * 按员工 ID 查找签名记录
     */
    @Select("SELECT * FROM employee_signature WHERE employee_id = #{employeeId} AND deleted = 0 LIMIT 1")
    EmployeeSignature findByEmployeeId(Long employeeId);
}
