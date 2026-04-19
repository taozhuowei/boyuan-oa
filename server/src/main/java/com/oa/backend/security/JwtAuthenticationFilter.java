package com.oa.backend.security;

import com.oa.backend.service.AccessManagementService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

/**
 * JWT认证过滤器
 *
 * <p>该过滤器拦截所有HTTP请求，从请求头中提取JWT令牌并验证其有效性。 如果令牌有效，则在Spring Security上下文中设置认证信息，使后续处理器能够识别当前用户身份和权限。
 * 继承自OncePerRequestFilter，确保每个请求只被过滤一次。
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

  /** JWT令牌服务，用于验证令牌和提取声明信息 */
  private final JwtTokenService jwtTokenService;

  /** 角色 → 权限点映射来源（设计 §2.2 步骤 5 — 自定义角色权限矩阵动态生效） */
  private final AccessManagementService accessManagementService;

  /**
   * 执行内部过滤逻辑
   *
   * <p>该方法处理每个请求： 1. 从请求头中获取Authorization字段 2. 检查是否为Bearer类型的令牌 3. 使用JwtTokenService验证令牌 4.
   * 如果验证通过且当前上下文未认证，则创建认证令牌并设置到SecurityContext 5. 无论认证是否成功，都继续执行过滤器链
   *
   * @param request HTTP请求对象，用于获取Authorization头
   * @param response HTTP响应对象
   * @param filterChain 过滤器链，用于将请求传递给下一个过滤器
   * @throws ServletException 如果过滤过程中发生Servlet异常
   * @throws IOException 如果发生I/O异常
   */
  @Override
  protected void doFilterInternal(
      HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
      throws ServletException, IOException {
    // 从请求头中获取Authorization字段
    String authorization = request.getHeader("Authorization");

    // 检查Authorization头是否存在且以"Bearer "开头
    if (authorization != null && authorization.startsWith("Bearer ")) {
      // 提取Bearer前缀后的令牌字符串
      String token = authorization.substring(7);

      // 验证令牌，如果有效则处理认证信息
      jwtTokenService
          .verify(token)
          .ifPresent(
              decodedJWT -> {
                // 仅在当前上下文未设置认证时才进行设置（避免重复认证）
                if (SecurityContextHolder.getContext().getAuthentication() == null) {
                  // 从JWT中提取用户名（subject）
                  String username = decodedJWT.getSubject();
                  // 从JWT中提取角色声明
                  String role = decodedJWT.getClaim("role").asString();
                  // 构建Spring Security权限字符串，默认为EMPLOYEE角色
                  String resolvedRole =
                      role == null || role.isBlank() ? "EMPLOYEE" : role.toLowerCase();
                  String roleAuthority = "ROLE_" + resolvedRole.toUpperCase();

                  // 权限点（PERM_*）：来自角色权限矩阵，用于细粒度 @PreAuthorize
                  List<org.springframework.security.core.GrantedAuthority> authorities =
                      new ArrayList<>();
                  authorities.add(new SimpleGrantedAuthority(roleAuthority));
                  try {
                    for (String p :
                        accessManagementService.getPermissionsByRoleCode(resolvedRole)) {
                      if (p != null && !p.isBlank()) {
                        authorities.add(new SimpleGrantedAuthority("PERM_" + p.toUpperCase()));
                      }
                    }
                  } catch (Exception e) {
                    // 保留原因：角色不存在或权限未配置时，仅使用 ROLE_* 权限，不中断请求
                    log.warn(
                        "JwtAuthFilter: failed to load permissions for role={}, falling back to role-only authority",
                        resolvedRole,
                        e);
                  }

                  UsernamePasswordAuthenticationToken authentication =
                      new UsernamePasswordAuthenticationToken(username, token, authorities);

                  SecurityContextHolder.getContext().setAuthentication(authentication);
                }
              });
    }

    // 继续执行过滤器链，无论认证是否成功都要放行请求
    filterChain.doFilter(request, response);
  }
}
