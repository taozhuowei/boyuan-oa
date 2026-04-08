package com.oa.backend.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.oa.backend.entity.RetentionPolicy;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.util.List;

/**
 * 保留策略数据访问层接口，操作 retention_policy 表。
 * <p>
 * 提供保留策略的基础 CRUD 操作以及按数据类型查询功能。
 *
 * @author OA Backend Team
 * @since 1.0
 */
@Mapper
public interface RetentionPolicyMapper extends BaseMapper<RetentionPolicy> {

    /**
     * 根据数据类型查询保留策略。
     *
     * @param dataType 数据类型，如：PAYROLL_SLIP, FORM_RECORD 等
     * @return 保留策略，未找到返回 null
     */
    @Select("SELECT * FROM retention_policy WHERE data_type = #{dataType} AND deleted = 0")
    RetentionPolicy findByDataType(@Param("dataType") String dataType);

    /**
     * 查询所有未删除的保留策略。
     *
     * @return 保留策略列表
     */
    @Select("SELECT * FROM retention_policy WHERE deleted = 0 ORDER BY data_type")
    List<RetentionPolicy> findAllActive();
}
