package com.oa.backend.controller;

import com.oa.backend.dto.*;
import com.oa.backend.entity.Employee;
import com.oa.backend.entity.Department;
import com.oa.backend.entity.Role;
import com.oa.backend.mapper.DepartmentMapper;
import com.oa.backend.mapper.RoleMapper;
import com.oa.backend.security.JwtTokenService;
import com.oa.backend.security.ResetCodeStore;
import com.oa.backend.service.AccessManagementService;
import com.oa.backend.service.EmployeeService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.crypto.password.PasswordEncoder;
import com.oa.backend.mapper.SecondRoleAssignmentMapper;
import java.util.List;
import java.util.Collections;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.security.SecureRandom;

/**
 * 认证控制器
 * 负责处理用户登录相关的认证请求，包括密码登录和开发环境登录
 */
@Slf4j
@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private final JwtTokenService jwtTokenService;
    private final AccessManagementService accessManagementService;
    private final EmployeeService employeeService;
    private final RoleMapper roleMapper;
    private final DepartmentMapper departmentMapper;
    private final ResetCodeStore resetCodeStore;
    private final PasswordEncoder passwordEncoder;
    private final SecondRoleAssignmentMapper secondRoleAssignmentMapper;

    private final SecureRandom secureRandom = new SecureRandom();

    // Phone change flow stores
    private final Map<String, PhoneChangeCodeEntry> phoneChangeCurrentCodeStore = new ConcurrentHashMap<>();
    private final Map<String, PhoneChangeCodeEntry> phoneChangeNewCodeStore = new ConcurrentHashMap<>();
    private final Map<String, PhoneChangeTokenEntry> phoneChangeTokenStore = new ConcurrentHashMap<>();

    private record PhoneChangeCodeEntry(String code, LocalDateTime expireAt) {
        boolean isExpired() {
            return LocalDateTime.now().isAfter(expireAt);
        }
    }

    private record PhoneChangeTokenEntry(Long userId, LocalDateTime expireAt) {
        boolean isExpired() {
            return LocalDateTime.now().isAfter(expireAt);
        }
    }

    /**
     * 每 10 分钟清理一次手机号变更流程中的过期条目，防止 Map 长期运行内存泄漏。
     * 业务路径已在每次访问时 `isExpired()` 校验，这里仅回收存储空间。
     */
    @Scheduled(fixedDelay = 600_000L)
    void cleanupExpiredPhoneChangeEntries() {
        phoneChangeCurrentCodeStore.entrySet().removeIf(e -> e.getValue().isExpired());
        phoneChangeNewCodeStore.entrySet().removeIf(e -> e.getValue().isExpired());
        phoneChangeTokenStore.entrySet().removeIf(e -> e.getValue().isExpired());
    }

    /**
     * 职责：处理用户密码登录请求，验证用户身份并返回JWT令牌
     * 请求含义：提交用户名和密码进行身份验证
     * 响应含义：返回包含JWT令牌的用户认证信息，包括用户名、显示名称、角色、部门等
     * 权限期望：无需认证，任何用户均可访问
     */
    @PostMapping("/login")
    public ResponseEntity<AuthLoginResponse> login(@Valid @RequestBody AuthPasswordLoginRequest request) {
        // 使用 EmployeeService 进行真实认证
        Optional<Employee> employeeOpt = employeeService.authenticate(
            request.username(), 
            request.password()
        );

        if (employeeOpt.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "账号或密码错误");
        }

        Employee employee = employeeOpt.get();

        // 生成JWT令牌
        String token = jwtTokenService.generateToken(
            employee.getEmployeeNo(),
            employee.getId(),
            employee.getRoleCode(),
            employee.getEmployeeType(),
            employee.getName()
        );

        // 查询角色名称
        String roleName = employee.getRoleCode();
        try {
            Role role = roleMapper.selectOne(
                new com.baomidou.mybatisplus.core.conditions.query.QueryWrapper<Role>()
                    .eq("role_code", employee.getRoleCode())
            );
            if (role != null && role.getRoleName() != null) {
                roleName = role.getRoleName();
            }
        } catch (Exception e) {
            // 如果查询失败，使用 roleCode 本身
            roleName = employee.getRoleCode();
        }

        // 查询部门名称
        String departmentName = "";
        if (employee.getDepartmentId() != null) {
            try {
                Department dept = departmentMapper.selectById(employee.getDepartmentId());
                if (dept != null && dept.getName() != null) {
                    departmentName = dept.getName();
                }
            } catch (Exception e) {
                // 如果查询失败，使用空字符串
                departmentName = "";
            }
        }

        List<String> secondRoles = Collections.emptyList();
        try {
            secondRoles = secondRoleAssignmentMapper.selectList(
                new com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper<com.oa.backend.entity.SecondRoleAssignment>()
                    .eq(com.oa.backend.entity.SecondRoleAssignment::getEmployeeId, employee.getId())
                    .ne(com.oa.backend.entity.SecondRoleAssignment::getRevoked, true)
                    .eq(com.oa.backend.entity.SecondRoleAssignment::getDeleted, 0)
            ).stream().map(com.oa.backend.entity.SecondRoleAssignment::getRoleCode).toList();
        } catch (Exception e) {
            log.warn("Failed to query second roles for employee {}: {}", employee.getId(), e.getMessage());
        }

        return ResponseEntity.ok(new AuthLoginResponse(
            token,
            "Bearer",
            "PASSWORD_LOGIN",
            employee.getId(),
            employee.getEmployeeNo(),
            employee.getName(),
            employee.getRoleCode(),
            roleName,
            departmentName,
            employee.getEmployeeType(),
            secondRoles
        ));
    }

    /**
     * 职责：处理开发环境登录请求，用于开发和测试场景快速登录
     * 请求含义：提交用户名、显示名称和角色信息进行快速身份构建（无需密码验证）
     * 响应含义：返回包含JWT令牌的用户认证信息，登录类型标记为DEV_LOGIN
     * 权限期望：无需认证，但建议仅在开发环境使用
     */
    @PostMapping("/dev-login")
    public ResponseEntity<AuthLoginResponse> devLogin(@Valid @RequestBody AuthLoginRequest request) {
        String displayName = request.displayName() == null || request.displayName().isBlank()
            ? request.username()
            : request.displayName().trim();
        String role = request.role() == null || request.role().isBlank()
            ? "employee"
            : request.role().trim().toLowerCase();
        AccessManagementService.AuthenticatedUser user = accessManagementService
            .buildProfile(request.username().trim(), displayName, role);
        String token = jwtTokenService.generateToken(user.username(), user.roleCode(), user.displayName());

        return ResponseEntity.ok(new AuthLoginResponse(
            token,
            "Bearer",
            "DEV_LOGIN",
            null,  // dev-login 没有真实 userId
            user.username(),
            user.displayName(),
            user.roleCode(),
            user.roleName(),
            user.department(),
            user.employeeType(),
            Collections.emptyList()
        ));
    }

    /**
     * 职责：发送密码重置验证码到用户手机
     * 请求含义：提交手机号请求发送验证码（开发阶段仅打印日志）
     * 响应含义：返回发送成功消息（无论手机号是否存在，都返回成功，避免暴露用户信息）
     * 权限期望：无需认证
     */
    @PostMapping("/send-reset-code")
    public ResponseEntity<Map<String, String>> sendResetCode(@Valid @RequestBody SendResetCodeRequest request) {
        // 查找该手机号对应的员工（仅用于日志记录，不暴露是否存在）
        Optional<Employee> employeeOpt = employeeService.findByPhone(request.phone());

        if (employeeOpt.isPresent()) {
            // 生成6位随机验证码
            String code = String.format("%06d", secureRandom.nextInt(1000000));
            resetCodeStore.storeCode(request.phone(), code);
            log.info("SMS code for {}: {} (employee: {})", request.phone(), code, employeeOpt.get().getEmployeeNo());
        } else {
            // 手机号不存在，仍然返回成功，但记录日志用于调试
            log.debug("Send reset code requested for non-existent phone: {}", request.phone());
        }

        return ResponseEntity.ok(Map.of("message", "验证码已发送"));
    }

    /**
     * 职责：验证重置验证码
     * 请求含义：提交手机号和验证码进行验证
     * 响应含义：验证成功后返回 resetToken，用于后续重置密码
     * 权限期望：无需认证
     */
    @PostMapping("/verify-reset-code")
    public ResponseEntity<VerifyResetCodeResponse> verifyResetCode(@Valid @RequestBody VerifyResetCodeRequest request) {
        // 验证验证码
        if (!resetCodeStore.verifyCode(request.phone(), request.code())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "验证码不正确或已过期");
        }

        // 删除已使用的验证码
        resetCodeStore.removeCode(request.phone());

        // 生成 resetToken
        String token = resetCodeStore.createToken(request.phone());

        return ResponseEntity.ok(new VerifyResetCodeResponse(token));
    }

    /**
     * 职责：使用 resetToken 重置密码
     * 请求含义：提交 resetToken 和新密码进行密码重置
     * 响应含义：重置成功返回 204 No Content
     * 权限期望：无需认证（通过 resetToken 验证身份）
     */
    @PostMapping("/reset-password")
    public ResponseEntity<Void> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        // 验证 resetToken
        String phone = resetCodeStore.verifyToken(request.resetToken());
        if (phone == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "重置令牌无效或已过期");
        }

        // 查找员工
        Employee employee = employeeService.findByPhone(phone)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "用户不存在"));

        // 更新密码
        String newPasswordHash = passwordEncoder.encode(request.newPassword());
        employeeService.updatePassword(employee.getId(), newPasswordHash, false);

        // 删除已使用的 token
        resetCodeStore.removeToken(request.resetToken());

        log.info("Password reset successfully for employee: {}", employee.getEmployeeNo());
        return ResponseEntity.noContent().build();
    }

    /**
     * 职责：发送当前手机号的变更验证码
     * 请求含义：向当前登录用户的绑定手机号发送验证码
     * 响应含义：返回发送成功消息
     * 权限期望：已认证用户
     */
    @PostMapping("/phone-change/send-current-code")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Map<String, String>> sendCurrentPhoneCode(
            @RequestHeader("Authorization") String authorization) {
        Long userId = getCurrentUserId(authorization);
        if (userId == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "无法获取当前用户信息");
        }
        Employee employee = employeeService.findById(userId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "用户不存在"));
        if (employee.getPhone() == null || employee.getPhone().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "当前用户未绑定手机号");
        }
        String code = String.format("%06d", secureRandom.nextInt(1000000));
        phoneChangeCurrentCodeStore.put("phone-change-current:" + userId,
            new PhoneChangeCodeEntry(code, LocalDateTime.now().plusMinutes(5)));
        log.info("Phone change current SMS code for user {} phone {}: {}", userId, employee.getPhone(), code);
        return ResponseEntity.ok(Map.of("message", "验证码已发送"));
    }

    /**
     * 职责：验证当前手机号的变更验证码
     * 请求含义：提交验证码验证当前手机号所有权
     * 响应含义：验证成功后返回 changeToken
     * 权限期望：已认证用户
     */
    @PostMapping("/phone-change/verify-current-code")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Map<String, String>> verifyCurrentPhoneCode(
            @RequestHeader("Authorization") String authorization,
            @RequestBody Map<String, String> request) {
        Long userId = getCurrentUserId(authorization);
        if (userId == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "无法获取当前用户信息");
        }
        String code = request.get("code");
        if (code == null || code.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "验证码不能为空");
        }
        String key = "phone-change-current:" + userId;
        PhoneChangeCodeEntry entry = phoneChangeCurrentCodeStore.get(key);
        if (entry == null || entry.isExpired() || !entry.code().equals(code)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "验证码不正确或已过期");
        }
        phoneChangeCurrentCodeStore.remove(key);

        String token = UUID.randomUUID().toString();
        phoneChangeTokenStore.put("phone-change-token:" + token,
            new PhoneChangeTokenEntry(userId, LocalDateTime.now().plusMinutes(10)));
        return ResponseEntity.ok(Map.of("changeToken", token));
    }

    /**
     * 职责：发送新手机号的变更验证码
     * 请求含义：使用 changeToken 向新手机号发送验证码
     * 响应含义：返回发送成功消息
     * 权限期望：已认证用户
     */
    @PostMapping("/phone-change/send-new-code")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Map<String, String>> sendNewPhoneCode(
            @RequestBody Map<String, String> request) {
        String changeToken = request.get("changeToken");
        String newPhone = request.get("newPhone");
        if (changeToken == null || changeToken.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "changeToken 不能为空");
        }
        if (newPhone == null || newPhone.isBlank() || !newPhone.matches("^1[3-9]\\d{9}$")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "手机号格式不正确");
        }

        String tokenKey = "phone-change-token:" + changeToken;
        PhoneChangeTokenEntry tokenEntry = phoneChangeTokenStore.get(tokenKey);
        if (tokenEntry == null || tokenEntry.isExpired()) {
            phoneChangeTokenStore.remove(tokenKey);
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "changeToken 无效或已过期");
        }
        Long userId = tokenEntry.userId();

        String code = String.format("%06d", secureRandom.nextInt(1000000));
        phoneChangeNewCodeStore.put("phone-change-new:" + userId,
            new PhoneChangeCodeEntry(code, LocalDateTime.now().plusMinutes(5)));
        log.info("Phone change new SMS code for user {} phone {}: {}", userId, newPhone, code);
        return ResponseEntity.ok(Map.of("message", "验证码已发送"));
    }

    /**
     * 职责：确认手机号变更
     * 请求含义：提交 changeToken、新手机号和验证码完成变更
     * 响应含义：返回变更成功消息
     * 权限期望：已认证用户
     */
    @PostMapping("/phone-change/confirm")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Map<String, String>> confirmPhoneChange(
            @RequestBody Map<String, String> request) {
        String changeToken = request.get("changeToken");
        String newPhone = request.get("newPhone");
        String code = request.get("code");
        if (changeToken == null || changeToken.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "changeToken 不能为空");
        }
        if (newPhone == null || newPhone.isBlank() || !newPhone.matches("^1[3-9]\\d{9}$")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "手机号格式不正确");
        }
        if (code == null || code.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "验证码不能为空");
        }

        String tokenKey = "phone-change-token:" + changeToken;
        PhoneChangeTokenEntry tokenEntry = phoneChangeTokenStore.get(tokenKey);
        if (tokenEntry == null || tokenEntry.isExpired()) {
            phoneChangeTokenStore.remove(tokenKey);
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "changeToken 无效或已过期");
        }
        Long userId = tokenEntry.userId();

        String codeKey = "phone-change-new:" + userId;
        PhoneChangeCodeEntry codeEntry = phoneChangeNewCodeStore.get(codeKey);
        if (codeEntry == null || codeEntry.isExpired() || !codeEntry.code().equals(code)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "验证码不正确或已过期");
        }

        employeeService.updatePhone(userId, newPhone);

        // 失效该用户的所有变更令牌和验证码
        phoneChangeTokenStore.entrySet().removeIf(e -> e.getValue().userId().equals(userId));
        phoneChangeCurrentCodeStore.remove("phone-change-current:" + userId);
        phoneChangeNewCodeStore.remove(codeKey);

        return ResponseEntity.ok(Map.of("message", "手机号修改成功"));
    }

    private Long getCurrentUserId(String authorization) {
        if (authorization == null || !authorization.startsWith("Bearer ")) {
            return null;
        }
        String token = authorization.substring(7);
        return jwtTokenService.verify(token)
            .map(decodedJWT -> decodedJWT.getClaim("userId").asLong())
            .orElse(null);
    }

    /**
     * 职责：修改当前登录用户的密码
     * 请求含义：提交当前密码和新密码进行密码修改
     * 响应含义：密码修改成功返回 204 No Content
     * 权限期望：已认证用户
     */
    @PostMapping("/change-password")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Void> changePassword(
            @RequestHeader("Authorization") String authorization,
            @RequestBody Map<String, String> request) {
        Long userId = getCurrentUserId(authorization);
        if (userId == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "无法获取当前用户信息");
        }

        String currentPassword = request.get("currentPassword");
        String newPassword = request.get("newPassword");

        if (currentPassword == null || currentPassword.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "当前密码不能为空");
        }
        if (newPassword == null || newPassword.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "新密码不能为空");
        }
        if (newPassword.length() < 6) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "新密码长度不能少于6位");
        }

        Employee employee = employeeService.findById(userId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "用户不存在"));

        if (!passwordEncoder.matches(currentPassword, employee.getPasswordHash())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "current password is incorrect");
        }

        String newPasswordHash = passwordEncoder.encode(newPassword);
        employeeService.updatePassword(employee.getId(), newPasswordHash, false);

        return ResponseEntity.noContent().build();
    }

    /**
     * 职责：获取当前登录用户的基本信息
     * 请求含义：获取当前登录用户的详细信息
     * 响应含义：返回用户基本信息，包括员工ID、工号、姓名、手机号、角色、部门等
     * 权限期望：已认证用户
     */
    @GetMapping("/me")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Map<String, Object>> me(
            @RequestHeader("Authorization") String authorization) {
        Long userId = getCurrentUserId(authorization);
        if (userId == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "无法获取当前用户信息");
        }

        Employee employee = employeeService.findById(userId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "用户不存在"));

        // 查询角色名称
        String roleName = employee.getRoleCode();
        try {
            Role role = roleMapper.selectOne(
                new com.baomidou.mybatisplus.core.conditions.query.QueryWrapper<Role>()
                    .eq("role_code", employee.getRoleCode())
            );
            if (role != null && role.getRoleName() != null) {
                roleName = role.getRoleName();
            }
        } catch (Exception e) {
            roleName = employee.getRoleCode();
        }

        // 查询部门名称
        String departmentName = "";
        if (employee.getDepartmentId() != null) {
            try {
                Department dept = departmentMapper.selectById(employee.getDepartmentId());
                if (dept != null && dept.getName() != null) {
                    departmentName = dept.getName();
                }
            } catch (Exception e) {
                departmentName = "";
            }
        }

        Map<String, Object> response = new java.util.HashMap<>();
        response.put("employeeId", employee.getId());
        response.put("employeeNo", employee.getEmployeeNo());
        response.put("name", employee.getName());
        response.put("phone", employee.getPhone());
        response.put("roleCode", employee.getRoleCode());
        response.put("roleName", roleName);
        response.put("departmentName", departmentName);
        response.put("employeeType", employee.getEmployeeType());
        response.put("isDefaultPassword", employee.getIsDefaultPassword());

        return ResponseEntity.ok(response);
    }
}
