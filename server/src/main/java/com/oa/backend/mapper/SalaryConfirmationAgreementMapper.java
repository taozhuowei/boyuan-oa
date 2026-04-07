package com.oa.backend.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.oa.backend.entity.SalaryConfirmationAgreement;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Select;

/**
 * 工资确认协议 Mapper。
 */
@Mapper
public interface SalaryConfirmationAgreementMapper extends BaseMapper<SalaryConfirmationAgreement> {

    /**
     * 获取当前生效的协议版本
     */
    @Select("SELECT * FROM salary_confirmation_agreement WHERE is_active = TRUE ORDER BY created_at DESC LIMIT 1")
    SalaryConfirmationAgreement findActive();
}
