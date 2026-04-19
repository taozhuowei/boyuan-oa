package com.oa.backend.controller;

import com.oa.backend.entity.RetentionPolicy;
import com.oa.backend.entity.RetentionReminder;
import com.oa.backend.security.SecurityUtils;
import com.oa.backend.service.RetentionService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

/**
 * 数据保留控制器，处理数据保留策略、到期提醒和导出下载。
 *
 * <p>所有管理接口（策略查询、提醒列表、操作提醒）仅限 CEO 角色访问。 下载接口需要认证，验证下载令牌有效性。
 *
 * @author OA Backend Team
 * @since 1.0
 */
@RestController
@RequestMapping("/retention")
@RequiredArgsConstructor
public class RetentionController {

  private final RetentionService retentionService;

  @Value("${oa.upload-dir:./uploads}")
  private String uploadDir;

  /**
   * 获取数据保留策略列表。
   *
   * <p>返回所有未删除的保留策略，包括数据类型、保留年限和提前警告天数。
   *
   * @return 保留策略列表
   */
  @GetMapping("/policies")
  @PreAuthorize("hasRole('CEO')")
  public ResponseEntity<List<RetentionPolicy>> listRetentionPolicies() {
    List<RetentionPolicy> policies = retentionService.listPolicies();
    return ResponseEntity.ok(policies);
  }

  /**
   * 获取到期提醒列表。
   *
   * <p>返回所有状态为 PENDING 的提醒，按预计删除日期升序排列。
   *
   * @return 到期提醒列表
   */
  @GetMapping("/reminders")
  @PreAuthorize("hasRole('CEO')")
  public ResponseEntity<List<RetentionReminder>> listRetentionReminders() {
    List<RetentionReminder> reminders = retentionService.listReminders();
    return ResponseEntity.ok(reminders);
  }

  /**
   * 忽略指定的到期提醒。
   *
   * <p>将提醒状态设置为 IGNORED，该数据将不会被自动清理。
   *
   * @param id 提醒 ID
   * @return 操作结果
   */
  @PostMapping("/reminders/{id}/dismiss")
  @PreAuthorize("hasRole('CEO')")
  public ResponseEntity<?> dismissReminder(@PathVariable Long id) {
    boolean success = retentionService.dismissReminder(id);
    if (success) {
      return ResponseEntity.ok(Map.of("message", "提醒已忽略", "id", id));
    } else {
      return ResponseEntity.badRequest().body(Map.of("message", "忽略失败，提醒不存在或状态不正确"));
    }
  }

  /**
   * 导出并删除过期数据。
   *
   * <p>异步执行导出操作，导出完成后删除过期数据记录。 返回创建的任务 ID，可用于查询任务状态。
   *
   * @param id 提醒 ID
   * @param authentication 当前用户认证信息
   * @return 创建的任务信息
   */
  @PostMapping("/reminders/{id}/export-and-delete")
  @PreAuthorize("hasRole('CEO')")
  public ResponseEntity<?> exportAndDelete(@PathVariable Long id, Authentication authentication) {
    Long initiatorId = SecurityUtils.getCurrentEmployeeId(authentication);
    if (initiatorId == null) {
      return ResponseEntity.status(403).body(Map.of("message", "无法识别当前用户"));
    }

    Long taskId = retentionService.startExportAndDelete(id, initiatorId);
    if (taskId == null) {
      return ResponseEntity.badRequest().body(Map.of("message", "导出失败，提醒不存在或状态不正确"));
    }

    return ResponseEntity.ok(Map.of("message", "导出任务已启动", "taskId", taskId));
  }

  /**
   * 下载导出文件。
   *
   * <p>验证下载令牌有效性（未过期），有效则返回文件流， 无效返回 403 或 404。
   *
   * @param token 下载令牌（UUID）
   * @param request HTTP 请求
   * @param response HTTP 响应
   */
  @GetMapping("/export/{token}/download")
  @PreAuthorize("isAuthenticated()")
  public void downloadExport(
      @PathVariable String token, HttpServletRequest request, HttpServletResponse response) {

    String filePath = retentionService.downloadExport(token);
    if (filePath == null) {
      response.setStatus(HttpServletResponse.SC_NOT_FOUND);
      return;
    }

    // filePath is retrieved from the database (by validated token), not directly from user input.
    // getFileName() extracts only the leaf name, eliminating any traversal sequences.
    // nosemgrep: java.spring.security.injection.tainted-file-path.tainted-file-path
    String safeFileName = Paths.get(filePath).getFileName().toString(); // nosemgrep
    Path path =
        Paths.get(uploadDir).toAbsolutePath().normalize().resolve("export").resolve(safeFileName);
    if (!Files.exists(path)) {
      response.setStatus(HttpServletResponse.SC_NOT_FOUND);
      return;
    }

    // 获取文件名
    String fileName = path.getFileName().toString();

    // 设置响应头
    response.setContentType("application/zip");
    response.setHeader("Content-Disposition", "attachment; filename=\"" + fileName + "\"");

    // 写入文件流
    try (InputStream is = new FileInputStream(path.toFile())) { // nosemgrep
      byte[] buffer = new byte[8192];
      int bytesRead;
      while ((bytesRead = is.read(buffer)) != -1) {
        response.getOutputStream().write(buffer, 0, bytesRead);
      }
      response.flushBuffer();
    } catch (IOException e) {
      response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
    }
  }
}
