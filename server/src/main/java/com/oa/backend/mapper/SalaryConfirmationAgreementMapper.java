package com.oa.backend.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.oa.backend.entity.SalaryConfirmationAgreement;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Select;
import org.apache.ibatis.annotations.Update;

/**
 * 工资确认协议 Mapper。
 */
@Mapper
public interface SalaryConfirmationAgreementMapper extends BaseMapper<SalaryConfirmationAgreement> {

    /**
     * 获取当前生效的协议版本
     */
    @Select("SELECT * FROM salary_confirmation_agreement WHERE is_active = TRUE AND deleted = 0 ORDER BY created_at DESC LIMIT 1")
    SalaryConfirmationAgreement findActive();

    /**
     * 将所有协议设为非激活状态
     */
    @Update("UPDATE salary_confirmation_agreement SET is_active = FALSE, updated_at = CURRENT_TIMESTAMP WHERE is_active = TRUE AND deleted = 0")
    void deactivateAll();
}
