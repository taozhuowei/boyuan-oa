package com.oa.backend.controller;

import com.oa.backend.dto.InjuryClaimRequest;
import com.oa.backend.entity.InjuryClaim;
import com.oa.backend.service.InjuryService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 工伤理赔控制器（财务专用）
 * 职责：工伤申报审批通过后，财务录入理赔金额并关联薪资周期。
 * 数据来源：injury_claim 表；关联 form_record.id。
 */
@RestController
@RequestMapping("/injury-claims")
@RequiredArgsConstructor
public class InjuryClaimController {

    private final InjuryService injuryService;

    /** 查询所有工伤理赔记录（财务/CEO 可查） */
    @GetMapping
    @PreAuthorize("hasAnyRole('FINANCE','CEO')")
    public ResponseEntity<List<InjuryClaim>> list() {
        return ResponseEntity.ok(injuryService.listAllClaims());
    }

    /**
     * 录入工伤理赔（财务专用）
     * 收到申请单 formRecordId + 员工信息 + 理赔金额，写入 injury_claim 表，状态置 SETTLED
     */
    @PostMapping
    @PreAuthorize("hasRole('FINANCE')")
    public ResponseEntity<InjuryClaim> create(
            @Valid @RequestBody InjuryClaimRequest req,
            Authentication auth) {
        InjuryClaim claim = new InjuryClaim();
        claim.setFormId(req.formRecordId());
        claim.setEmployeeId(req.employeeId());
        claim.setInjuryDate(req.injuryDate());
        claim.setInjuryDescription(req.injuryDescription());
        claim.setCompensationAmount(req.compensationAmount());
        claim.setFinanceNote(req.financeNote());
        claim.setStatus("SETTLED");
        claim.setCreatedAt(LocalDateTime.now());
        claim.setUpdatedAt(LocalDateTime.now());
        claim.setDeleted(0);
        injuryService.saveClaim(claim);
        return ResponseEntity.ok(claim);
    }
}
