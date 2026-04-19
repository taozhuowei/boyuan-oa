package com.oa.backend.controller;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

/**
 * Access Control Tests - Role-based authorization
 *
 * <p>验证基于角色的访问控制规则，确保： 1. 未认证用户无法访问受保护端点（返回401） 2. 员工角色无法访问财务专属端点（返回403） 3.
 * 财务角色可以访问财务端点（返回2xx或404，但不能是403） 4. 劳工角色可以访问施工日志端点 5. 非劳工角色无法访问劳工专属施工日志端点
 *
 * <p>使用 @SpringBootTest + @AutoConfigureMockMvc 加载完整应用上下文， 包括安全配置、JWT过滤器等，确保测试接近真实运行环境。
 */
@SpringBootTest
@AutoConfigureMockMvc
@DisplayName("Access Control Tests - Role-based authorization")
class AccessControlTest {

  @Autowired private MockMvc mockMvc;

  // ═══════════════════════════════════════════════════════════════════════
  // Test Group 1: Payroll Cycles - FINANCE/CEO only
  // ═══════════════════════════════════════════════════════════════════════

  /** 测试：未认证用户访问工资周期列表应返回401 */
  @Test
  @DisplayName("Unauthenticated request to /api/payroll/cycles returns 401")
  void unauthenticated_payrollCycles_returns401() throws Exception {
    mockMvc.perform(get("/payroll/cycles")).andExpect(status().isUnauthorized());
  }

  /** 测试：EMPLOYEE角色访问工资周期列表应返回403 */
  @Test
  @WithMockUser(roles = "EMPLOYEE")
  @DisplayName("EMPLOYEE role cannot access payroll cycles (403)")
  void employee_payrollCycles_returns403() throws Exception {
    mockMvc.perform(get("/payroll/cycles")).andExpect(status().isForbidden());
  }

  /** 测试：FINANCE角色可以访问工资周期列表（不应返回403） 实际状态可能是200（有数据）或404（无数据），但绝不能是403 */
  @Test
  @WithMockUser(roles = "FINANCE")
  @DisplayName("FINANCE role can access payroll cycles (not 403)")
  void finance_payrollCycles_isAccessible() throws Exception {
    mockMvc
        .perform(get("/payroll/cycles"))
        .andExpect(
            result -> {
              int status = result.getResponse().getStatus();
              if (status == 403) {
                throw new AssertionError("Expected accessible but got 403 Forbidden");
              }
            });
  }

  /** 测试：CEO角色可以访问工资周期列表（不应返回403） */
  @Test
  @WithMockUser(roles = "CEO")
  @DisplayName("CEO role can access payroll cycles (not 403)")
  void ceo_payrollCycles_isAccessible() throws Exception {
    mockMvc
        .perform(get("/payroll/cycles"))
        .andExpect(
            result -> {
              int status = result.getResponse().getStatus();
              if (status == 403) {
                throw new AssertionError("Expected accessible but got 403 Forbidden");
              }
            });
  }

  /** 测试：PROJECT_MANAGER角色访问工资周期列表应返回403 */
  @Test
  @WithMockUser(roles = "PROJECT_MANAGER")
  @DisplayName("PROJECT_MANAGER role cannot access payroll cycles (403)")
  void projectManager_payrollCycles_returns403() throws Exception {
    mockMvc.perform(get("/payroll/cycles")).andExpect(status().isForbidden());
  }

  // ═══════════════════════════════════════════════════════════════════════
  // Test Group 2: Payroll Cycle Creation - FINANCE/CEO only (POST)
  // ═══════════════════════════════════════════════════════════════════════

  /** 测试：EMPLOYEE角色创建工资周期应返回403 */
  @Test
  @WithMockUser(roles = "EMPLOYEE")
  @DisplayName("EMPLOYEE role cannot create payroll cycle (403)")
  void employee_createPayrollCycle_returns403() throws Exception {
    mockMvc
        .perform(
            post("/payroll/cycles")
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    """
                                {
                                    "period": "2026-04"
                                }
                                """))
        .andExpect(status().isForbidden());
  }

  /** 测试：FINANCE角色可以创建工资周期（不应返回403） */
  @Test
  @WithMockUser(roles = "FINANCE")
  @DisplayName("FINANCE role can create payroll cycle (not 403)")
  void finance_createPayrollCycle_isAccessible() throws Exception {
    mockMvc
        .perform(
            post("/payroll/cycles")
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    """
                                {
                                    "period": "2026-04"
                                }
                                """))
        .andExpect(
            result -> {
              int status = result.getResponse().getStatus();
              if (status == 403) {
                throw new AssertionError("Expected accessible but got 403 Forbidden");
              }
            });
  }

  // ═══════════════════════════════════════════════════════════════════════
  // Test Group 3: Work Log Submission - WORKER only
  // ═══════════════════════════════════════════════════════════════════════

  /** 测试：EMPLOYEE角色提交施工日志应返回403 */
  @Test
  @WithMockUser(roles = "EMPLOYEE")
  @DisplayName("EMPLOYEE role cannot submit work log (403)")
  void employee_workLog_returns403() throws Exception {
    mockMvc
        .perform(
            post("/logs")
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    """
                                {
                                    "formData": {
                                        "workDate": "2026-04-09",
                                        "content": "Test work log content"
                                    },
                                    "remark": "Test submission"
                                }
                                """))
        .andExpect(status().isForbidden());
  }

  /** 测试：WORKER角色可以提交施工日志（不应返回403） 注意：可能返回400（数据验证失败）或404（员工不存在），但绝不能是403 */
  @Test
  @WithMockUser(roles = "WORKER")
  @DisplayName("WORKER role can submit work log (not 403)")
  void worker_workLog_isAccessible() throws Exception {
    mockMvc
        .perform(
            post("/logs")
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    """
                                {
                                    "formData": {
                                        "workDate": "2026-04-09",
                                        "content": "Test work log content"
                                    },
                                    "remark": "Test submission"
                                }
                                """))
        .andExpect(
            result -> {
              int status = result.getResponse().getStatus();
              if (status == 403) {
                throw new AssertionError("Expected accessible but got 403 Forbidden");
              }
            });
  }

  /**
   * PROJECT_MANAGER 提交施工日志：设计 §8.3 允许 PM 在未配置工长时自填日志， 故应返回 200/4xx 业务错误而非 403。当前 mock auth 无法识别真实
   * employee → 400 即视为权限通过。
   */
  @Test
  @WithMockUser(roles = "PROJECT_MANAGER")
  @DisplayName("PROJECT_MANAGER role can submit work log (per §8.3 PM 自填)")
  void projectManager_workLog_isAccessible() throws Exception {
    mockMvc
        .perform(
            post("/logs")
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    """
                                {
                                    "formData": {
                                        "workDate": "2026-04-09",
                                        "content": "Test work log content"
                                    },
                                    "remark": "Test submission"
                                }
                                """))
        .andExpect(
            result -> {
              int s = result.getResponse().getStatus();
              if (s == 403) throw new AssertionError("PROJECT_MANAGER 应允许提交施工日志（设计 §8.3），但返回 403");
            });
  }

  // ═══════════════════════════════════════════════════════════════════════
  // Test Group 4: Construction Logs - WORKER only (alternate endpoint)
  // ═══════════════════════════════════════════════════════════════════════

  /** 测试：FINANCE角色访问施工日志提交端点应返回403 */
  @Test
  @WithMockUser(roles = "FINANCE")
  @DisplayName("FINANCE role cannot submit construction log (403)")
  void finance_constructionLog_returns403() throws Exception {
    mockMvc
        .perform(
            post("/logs/construction-logs")
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    """
                                {
                                    "formData": {
                                        "workDate": "2026-04-09",
                                        "workItems": [
                                            {"task": "Concrete work", "hours": 8}
                                        ]
                                    },
                                    "remark": "Test construction log"
                                }
                                """))
        .andExpect(status().isForbidden());
  }

  /** 测试：WORKER角色可以访问施工日志提交端点（不应返回403） */
  @Test
  @WithMockUser(roles = "WORKER")
  @DisplayName("WORKER role can submit construction log (not 403)")
  void worker_constructionLog_isAccessible() throws Exception {
    mockMvc
        .perform(
            post("/logs/construction-logs")
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    """
                                {
                                    "formData": {
                                        "workDate": "2026-04-09",
                                        "workItems": [
                                            {"task": "Concrete work", "hours": 8}
                                        ]
                                    },
                                    "remark": "Test construction log"
                                }
                                """))
        .andExpect(
            result -> {
              int status = result.getResponse().getStatus();
              if (status == 403) {
                throw new AssertionError("Expected accessible but got 403 Forbidden");
              }
            });
  }

  // ═══════════════════════════════════════════════════════════════════════
  // Test Group 5: Injury Report - WORKER/PROJECT_MANAGER/CEO
  // ═══════════════════════════════════════════════════════════════════════

  /** 测试：EMPLOYEE角色提交工伤申报应返回403（仅限WORKER/PROJECT_MANAGER/CEO） */
  @Test
  @WithMockUser(roles = "EMPLOYEE")
  @DisplayName("EMPLOYEE role cannot submit injury report (403)")
  void employee_injuryReport_returns403() throws Exception {
    mockMvc
        .perform(
            post("/logs/injury")
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    """
                                {
                                    "formData": {
                                        "incidentDate": "2026-04-09",
                                        "description": "Test injury incident"
                                    },
                                    "remark": "Test injury report"
                                }
                                """))
        .andExpect(status().isForbidden());
  }

  /** 测试：PROJECT_MANAGER角色可以提交工伤申报（不应返回403） */
  @Test
  @WithMockUser(roles = "PROJECT_MANAGER")
  @DisplayName("PROJECT_MANAGER role can submit injury report (not 403)")
  void projectManager_injuryReport_isAccessible() throws Exception {
    mockMvc
        .perform(
            post("/logs/injury")
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    """
                                {
                                    "formData": {
                                        "incidentDate": "2026-04-09",
                                        "description": "Test injury incident"
                                    },
                                    "remark": "Test injury report"
                                }
                                """))
        .andExpect(
            result -> {
              int status = result.getResponse().getStatus();
              if (status == 403) {
                throw new AssertionError("Expected accessible but got 403 Forbidden");
              }
            });
  }

  // ═══════════════════════════════════════════════════════════════════════
  // Test Group 6: Todo List - PROJECT_MANAGER/CEO only
  // ═══════════════════════════════════════════════════════════════════════

  /** 测试：EMPLOYEE角色访问待审批列表应返回403 */
  @Test
  @WithMockUser(roles = "EMPLOYEE")
  @DisplayName("EMPLOYEE role cannot access todo list (403)")
  void employee_todoList_returns403() throws Exception {
    mockMvc.perform(get("/logs/todo")).andExpect(status().isForbidden());
  }

  /** 测试：WORKER角色访问待审批列表应返回403 */
  @Test
  @WithMockUser(roles = "WORKER")
  @DisplayName("WORKER role cannot access todo list (403)")
  void worker_todoList_returns403() throws Exception {
    mockMvc.perform(get("/logs/todo")).andExpect(status().isForbidden());
  }

  /** 测试：PROJECT_MANAGER角色可以访问待审批列表（不应返回403） */
  @Test
  @WithMockUser(roles = "PROJECT_MANAGER")
  @DisplayName("PROJECT_MANAGER role can access todo list (not 403)")
  void projectManager_todoList_isAccessible() throws Exception {
    mockMvc
        .perform(get("/logs/todo"))
        .andExpect(
            result -> {
              int status = result.getResponse().getStatus();
              if (status == 403) {
                throw new AssertionError("Expected accessible but got 403 Forbidden");
              }
            });
  }

  // ═══════════════════════════════════════════════════════════════════════
  // Test Group 7: CEO Exclusive - Log Recall
  // ═══════════════════════════════════════════════════════════════════════

  /** 测试：FINANCE角色访问CEO专属的日志驳回端点应返回403 */
  @Test
  @WithMockUser(roles = "FINANCE")
  @DisplayName("FINANCE role cannot recall construction log (CEO only, 403)")
  void finance_recallLog_returns403() throws Exception {
    mockMvc
        .perform(
            post("/logs/construction-logs/1/recall")
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    """
                                {
                                    "reason": "Test recall"
                                }
                                """))
        .andExpect(status().isForbidden());
  }

  /** 测试：CEO角色可以访问日志驳回端点（不应返回403） */
  @Test
  @WithMockUser(roles = "CEO")
  @DisplayName("CEO role can recall construction log (not 403)")
  void ceo_recallLog_isAccessible() throws Exception {
    mockMvc
        .perform(
            post("/logs/construction-logs/1/recall")
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    """
                                {
                                    "reason": "Test recall"
                                }
                                """))
        .andExpect(
            result -> {
              int status = result.getResponse().getStatus();
              if (status == 403) {
                throw new AssertionError("Expected accessible but got 403 Forbidden");
              }
            });
  }

  // ═══════════════════════════════════════════════════════════════════════
  // Test Group 8: Payroll Slips - All roles can access (with different scopes)
  // ═══════════════════════════════════════════════════════════════════════

  /** 测试：EMPLOYEE角色可以访问工资条列表（所有认证用户都有权限） */
  @Test
  @WithMockUser(username = "employee.demo", roles = "EMPLOYEE")
  @DisplayName("EMPLOYEE role can access payroll slips (not 403)")
  void employee_payrollSlips_isAccessible() throws Exception {
    mockMvc
        .perform(get("/payroll/slips"))
        .andExpect(
            result -> {
              int status = result.getResponse().getStatus();
              if (status == 403) {
                throw new AssertionError("Expected accessible but got 403 Forbidden");
              }
            });
  }

  /** 测试：WORKER角色可以访问工资条列表 */
  @Test
  @WithMockUser(username = "worker.demo", roles = "WORKER")
  @DisplayName("WORKER role can access payroll slips (not 403)")
  void worker_payrollSlips_isAccessible() throws Exception {
    mockMvc
        .perform(get("/payroll/slips"))
        .andExpect(
            result -> {
              int status = result.getResponse().getStatus();
              if (status == 403) {
                throw new AssertionError("Expected accessible but got 403 Forbidden");
              }
            });
  }
}
