package com.oa.backend.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.oa.backend.entity.InjuryClaim;
import com.oa.backend.mapper.InjuryClaimMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * 工伤理赔服务类。
 * <p>
 * 负责工伤理赔记录的查询和录入，封装 InjuryClaimMapper 的调用。
 * 数据来源：injury_claim 表（关联 form_record.id）。
 */
@Service
@RequiredArgsConstructor
public class InjuryService {

    private final InjuryClaimMapper injuryClaimMapper;

    /**
     * 查询所有未删除的工伤理赔记录，按创建时间降序排列。
     *
     * @return 工伤理赔记录列表
     */
    public List<InjuryClaim> listAllClaims() {
        return injuryClaimMapper.selectList(
                new LambdaQueryWrapper<InjuryClaim>()
                        .eq(InjuryClaim::getDeleted, 0)
                        .orderByDesc(InjuryClaim::getCreatedAt)
        );
    }

    /**
     * 插入新的工伤理赔记录。
     *
     * @param claim 工伤理赔实体（已填充所有字段）
     */
    public void saveClaim(InjuryClaim claim) {
        injuryClaimMapper.insert(claim);
    }
}
