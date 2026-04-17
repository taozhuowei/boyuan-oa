package com.oa.backend.controller;

import com.oa.backend.entity.TemporaryDelegation;
import com.oa.backend.exception.BusinessException;
import com.oa.backend.service.TemporaryDelegationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/**
 * 临时委托 Controller。
 *
 * Routes:
 *   GET    /delegations?as=delegator|delegate  我相关的委托
 *   POST   /delegations                        创建（请假等场景使用）
 *   DELETE /delegations/{id}                   撤销（仅委托人）
 */
@RestController
@RequestMapping("/delegations")
@RequiredArgsConstructor
public class TemporaryDelegationController {

    private final TemporaryDelegationService service;

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<TemporaryDelegation>> listMine(@RequestParam(defaultValue = "delegator") String as,
                                                              Authentication auth) {
        Long me = service.resolveEmployeeIdByUsername(auth.getName());
        return ResponseEntity.ok(service.listMine(me, !"delegate".equalsIgnoreCase(as)));
    }

    @PostMapping
    @PreAuthorize("isAuthenticated()")
    @com.oa.backend.annotation.OperationLogRecord(action = "DELEGATION_CREATE", targetType = "DELEGATION")
    public ResponseEntity<?> create(@RequestBody DelegationRequest req, Authentication auth) {
        Long me = service.resolveEmployeeIdByUsername(auth.getName());
        try {
            TemporaryDelegation d = service.create(
                    me, req.delegatePhone(), req.scope(),
                    req.startsAt(), req.expiresAt(), req.relatedFormId());
            return ResponseEntity.ok(d);
        } catch (IllegalStateException e) {
            throw new BusinessException(400, e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    @com.oa.backend.annotation.OperationLogRecord(action = "DELEGATION_REVOKE", targetType = "DELEGATION")
    public ResponseEntity<?> revoke(@PathVariable Long id, Authentication auth) {
        Long me = service.resolveEmployeeIdByUsername(auth.getName());
        try {
            boolean ok = service.revoke(id, me);
            return ok ? ResponseEntity.ok(Map.of("message", "已撤销", "id", id))
                    : ResponseEntity.notFound().build();
        } catch (IllegalStateException e) {
            // 撤销失败语义为 "非委托人本人"，返回 403
            throw new BusinessException(403, e.getMessage());
        }
    }

    public record DelegationRequest(String delegatePhone, String scope,
                                    LocalDateTime startsAt, LocalDateTime expiresAt,
                                    Long relatedFormId) {}
}
