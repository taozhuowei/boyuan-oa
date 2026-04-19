package com.oa.backend.filter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.UUID;
import org.slf4j.MDC;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

/**
 * TraceIdFilter — assigns a unique trace ID to every HTTP request.
 *
 * <p>Generates a UUID trace_id per request, stores it in SLF4J MDC so that all log statements
 * within the request automatically include the trace ID, and exposes it via the X-Trace-Id response
 * header for client-side correlation.
 *
 * <p>Runs at highest precedence so all downstream components (security, controllers) can reference
 * the trace ID from MDC.
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
public class TraceIdFilter extends OncePerRequestFilter {

  private static final String TRACE_ID_KEY = "trace_id";
  private static final String TRACE_ID_HEADER = "X-Trace-Id";

  @Override
  protected void doFilterInternal(
      HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
      throws ServletException, IOException {
    // Reuse client-supplied trace ID if present (enables distributed tracing);
    // otherwise generate a new one.
    String incoming = request.getHeader(TRACE_ID_HEADER);
    String traceId =
        (incoming != null && !incoming.isBlank()) ? incoming : UUID.randomUUID().toString();

    MDC.put(TRACE_ID_KEY, traceId);
    response.setHeader(TRACE_ID_HEADER, traceId);
    try {
      filterChain.doFilter(request, response);
    } finally {
      // Always clear MDC to prevent thread-pool leakage
      MDC.remove(TRACE_ID_KEY);
    }
  }
}
