package com.oa.backend.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.oa.backend.entity.EvidenceChain;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Select;

/**
 * 工资条确认存证链 Mapper。
 * 提供 evidence_chain 表的数据访问操作。
 *
 * @author OA Backend Team
 * @since 1.0.0
 */
@Mapper
public interface EvidenceChainMapper extends BaseMapper<EvidenceChain> {

    /**
     * 根据工资条 ID 查询存证记录
     *
     * @param slipId 工资条 ID
     * @return 存证链记录，不存在则返回 null
     */
    @Select("SELECT * FROM evidence_chain WHERE slip_id = #{slipId} LIMIT 1")
    EvidenceChain findBySlipId(Long slipId);
}
