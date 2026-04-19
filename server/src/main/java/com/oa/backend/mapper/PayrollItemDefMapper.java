package com.oa.backend.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.oa.backend.entity.PayrollItemDef;
import java.util.List;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Select;

/** 工资项定义 Mapper。 */
@Mapper
public interface PayrollItemDefMapper extends BaseMapper<PayrollItemDef> {

  /** 查找所有启用的工资项定义（按显示顺序排序） */
  @Select(
      "SELECT * FROM payroll_item_def WHERE is_enabled = TRUE AND deleted = 0 ORDER BY display_order ASC")
  List<PayrollItemDef> findAllEnabled();
}
