package com.oa.backend.controller;

import com.oa.backend.entity.TemporaryDelegation;
import com.oa.backend.mapper.EmployeeMapper;
import com.oa.backend.security.SecurityUtils;
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
    private final EmployeeMapper employeeMapper;

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<TemporaryDelegation>> listMine(@RequestParam(defaultValue = "delegator") String as,
                                                              Authentication auth) {
        Long me = SecurityUtils.getEmployeeIdFromUsername(auth.getName(), employeeMapper);
        return ResponseEntity.ok(service.listMine(me, !"delegate".equalsIgnoreCase(as)));
    }

    @PostMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> create(@RequestBody DelegationRequest req, Authentication auth) {
        Long me = SecurityUtils.getEmployeeIdFromUsername(auth.getName(), employeeMapper);
        try {
            TemporaryDelegation d = service.create(
                    me, req.delegatePhone(), req.scope(),
                    req.startsAt(), req.expiresAt(), req.relatedFormId());
            return ResponseEntity.ok(d);
        } catch (IllegalStateException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> revoke(@PathVariable Long id, Authentication auth) {
        Long me = SecurityUtils.getEmployeeIdFromUsername(auth.getName(), employeeMapper);
        try {
            boolean ok = service.revoke(id, me);
            return ok ? ResponseEntity.ok(Map.of("message", "已撤销", "id", id))
                    : ResponseEntity.notFound().build();
        } catch (IllegalStateException e) {
            return ResponseEntity.status(403).body(Map.of("message", e.getMessage()));
        }
    }

    public record DelegationRequest(String delegatePhone, String scope,
                                    LocalDateTime startsAt, LocalDateTime expiresAt,
                                    Long relatedFormId) {}
}
