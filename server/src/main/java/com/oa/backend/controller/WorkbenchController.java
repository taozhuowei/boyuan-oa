package com.oa.backend.controller;

import com.oa.backend.dto.UserProfileResponse;
import com.oa.backend.dto.WorkbenchConfigResponse;
import com.oa.backend.dto.WorkbenchSummaryResponse;
import com.oa.backend.service.WorkbenchService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

/**
 * 工作台控制器。 仅负责 HTTP 请求分发与响应包装，业务逻辑委托给 {@link WorkbenchService}。 401/403 统一通过 {@link
 * ResponseStatusException} 抛出，交由全局异常处理器格式化响应。
 */
@RestController
@RequiredArgsConstructor
@PreAuthorize("isAuthenticated()")
public class WorkbenchController {

  private final WorkbenchService workbenchService;

  @GetMapping("/me/profile")
  public ResponseEntity<UserProfileResponse> getMyProfile(Authentication authentication) {
    if (authentication == null) {
      throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "未登录");
    }
    return ResponseEntity.ok(workbenchService.buildUserProfile(authentication));
  }

  @GetMapping("/workbench/config")
  public ResponseEntity<WorkbenchConfigResponse> getWorkbenchConfig(Authentication authentication) {
    if (authentication == null) {
      throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "未登录");
    }
    return ResponseEntity.ok(workbenchService.buildWorkbenchConfig(authentication));
  }

  @GetMapping("/workbench/summary")
  public ResponseEntity<WorkbenchSummaryResponse> getWorkbenchSummary(
      Authentication authentication) {
    if (authentication == null) {
      throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "未登录");
    }
    WorkbenchSummaryResponse summary = workbenchService.buildWorkbenchSummary(authentication);
    if (summary == null) {
      throw new ResponseStatusException(HttpStatus.FORBIDDEN, "无法识别当前用户");
    }
    return ResponseEntity.ok(summary);
  }
}
