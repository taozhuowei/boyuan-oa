package com.oa.backend.filter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.ArrayDeque;
import java.util.Deque;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.http.MediaType;
import org.springframework.web.filter.OncePerRequestFilter;

/**
 * D-F-20: 全局通用限流 Filter（滑动窗口）。
 *
 * <p>规则：每个 IP 在 60 秒滑动窗口内最多发送 maxRequestsPerWindow 次请求，超出返回 429。 登录接口的阶梯限速（D-F-19）在 AuthController
 * 中独立处理，本 Filter 不重复计算。
 *
 * <p>限速计数存内存（ConcurrentHashMap<IP, Deque<timestampMs>>），重启清零可接受。 不影响 /h2-console 和 /api/v3/api-docs
 * 路径。
 */
public class GlobalRateLimitFilter extends OncePerRequestFilter {

  /** 滑动窗口时长（毫秒）。 */
  private static final long WINDOW_MS = 60_000L;

  /** 单 IP 每窗口最大请求数（可通过构造函数注入，支持测试环境配置更高限制）。 */
  private final int maxRequestsPerWindow;

  /** 不受限的路径前缀（context-path 已由 Spring 剥离，此处是 servlet path）。 */
  private static final String[] EXCLUDED_PREFIXES = {"/h2-console", "/v3/api-docs"};

  /** IP -> 请求时间戳队列（毫秒）。 */
  private final ConcurrentHashMap<String, Deque<Long>> requestTimestamps =
      new ConcurrentHashMap<>();

  /** 默认限制：每 IP 每分钟 300 次请求。 */
  public GlobalRateLimitFilter() {
    this(300);
  }

  /** 允许注入自定义限制（用于测试环境）。 */
  public GlobalRateLimitFilter(int maxRequestsPerWindow) {
    this.maxRequestsPerWindow = maxRequestsPerWindow;
  }

  @Override
  protected boolean shouldNotFilter(HttpServletRequest request) {
    String path = request.getServletPath();
    for (String prefix : EXCLUDED_PREFIXES) {
      if (path.startsWith(prefix)) {
        return true;
      }
    }
    return false;
  }

  @Override
  protected void doFilterInternal(
      HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
      throws ServletException, IOException {

    String ip = request.getRemoteAddr();
    long now = System.currentTimeMillis();

    Deque<Long> timestamps = requestTimestamps.computeIfAbsent(ip, k -> new ArrayDeque<>());

    boolean allowed;
    synchronized (timestamps) {
      // 移除窗口外的旧时间戳
      long cutoff = now - WINDOW_MS;
      while (!timestamps.isEmpty() && timestamps.peekFirst() <= cutoff) {
        timestamps.pollFirst();
      }
      // 若队列已空，驱逐该 IP 的 map 条目，防止无界内存增长
      if (timestamps.isEmpty()) {
        requestTimestamps.remove(ip, timestamps);
      }
      allowed = timestamps.size() < maxRequestsPerWindow;
      if (allowed) {
        timestamps.addLast(now);
      }
    }

    if (!allowed) {
      response.setStatus(429);
      response.setContentType(MediaType.APPLICATION_JSON_VALUE);
      response.setCharacterEncoding("UTF-8");
      response.getWriter().write("{\"code\":429,\"message\":\"访问过于频繁，请稍后再试\"}");
      return;
    }

    filterChain.doFilter(request, response);
  }
}
