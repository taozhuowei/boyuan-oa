package com.oa.backend.dto;

import jakarta.validation.constraints.NotBlank;

/**
 * 密码登录请求 DTO
 *
 * @param username 用户名
 * @param password 密码
 * @param captchaId （可选）验证码 ID，DEF-AUTH-02 captcha 挑战层使用；失败次数 ≥ 3 时必填
 * @param captchaAnswer （可选）用户输入的验证码；captchaId 存在时必填
 */
public record AuthPasswordLoginRequest(
    @NotBlank(message = "用户名不能为空") String username,
    @NotBlank(message = "密码不能为空") String password,
    String captchaId,
    String captchaAnswer) {

  /** 便捷构造器：仅用户名密码，用于不需要 captcha 的场景（如现有测试、首次登录）。 */
  public AuthPasswordLoginRequest(String username, String password) {
    this(username, password, null, null);
  }
}
