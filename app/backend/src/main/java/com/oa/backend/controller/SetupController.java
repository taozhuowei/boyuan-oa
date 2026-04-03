package com.oa.backend.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * 系统初始化控制器
 * 负责系统初始化状态查询和初始化向导相关接口
 */
@RestController
@RequestMapping("/setup")
public class SetupController {

    /**
     * 获取系统初始化状态
     * 用于前端判断是否需要跳转到初始化向导页面
     *
     * @return 初始化状态信息
     */
    @GetMapping("/status")
    public ResponseEntity<Map<String, Object>> status() {
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("initialized", false);   // Phase 0B 固定返回 false，Phase 2 接入真实判断
        result.put("message", "系统待初始化，请使用 Sysadmin 账号登录完成初始化向导");
        return ResponseEntity.ok(result);
    }
}
