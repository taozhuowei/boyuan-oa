package com.oa.backend.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.oa.backend.entity.ExpenseItem;
import java.util.List;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

/** 报销明细 Mapper */
@Mapper
public interface ExpenseItemMapper extends BaseMapper<ExpenseItem> {

  @Select(
      "SELECT * FROM expense_item WHERE expense_claim_id = #{expenseClaimId} AND deleted = 0 ORDER BY expense_date")
  List<ExpenseItem> findByExpenseClaimId(@Param("expenseClaimId") Long expenseClaimId);
}
