package com.oa.backend.controller;

import java.util.HashMap;
import java.util.Map;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** 健康检查控制器 提供系统健康状态监控和版本信息查询 */
@RestController
@RequestMapping("/health")
public class HealthController {

  /**
   * 职责：检查系统健康状态，返回运行状态、当前阶段和版本信息 请求含义：查询应用的健康状态和基本信息 响应含义：返回包含状态(UP/DOWN)、开发阶段和版本号的JSON对象
   * 权限期望：无需认证，任何用户均可访问，常用于负载均衡健康检查
   */
  @GetMapping
  public ResponseEntity<Map<String, Object>> health() {
    Map<String, Object> result = new HashMap<>();
    result.put("status", "UP");
    result.put("stage", "阶段三：身份、角色、权限、组织");
    result.put("version", "1.0.0");
    return ResponseEntity.ok(result);
  }
}
