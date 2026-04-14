package com.oa.backend.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.oa.backend.entity.ExpenseTypeDef;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Select;

import java.util.List;

/**
 * 费用类型定义 Mapper
 */
@Mapper
public interface ExpenseTypeDefMapper extends BaseMapper<ExpenseTypeDef> {

    @Select("SELECT * FROM expense_type_def WHERE is_enabled = TRUE AND deleted = 0 ORDER BY display_order")
    List<ExpenseTypeDef> findAllEnabled();
}
