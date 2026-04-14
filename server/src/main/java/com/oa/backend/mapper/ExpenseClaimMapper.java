package com.oa.backend.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.oa.backend.entity.ExpenseClaim;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

/**
 * 报销申请 Mapper
 */
@Mapper
public interface ExpenseClaimMapper extends BaseMapper<ExpenseClaim> {

    @Select("SELECT * FROM expense_claim WHERE form_id = #{formId} AND deleted = 0")
    ExpenseClaim findByFormId(@Param("formId") Long formId);

    @Select("SELECT * FROM expense_claim WHERE employee_id = #{employeeId} AND deleted = 0 ORDER BY created_at DESC")
    java.util.List<ExpenseClaim> findByEmployeeId(@Param("employeeId") Long employeeId);
}
