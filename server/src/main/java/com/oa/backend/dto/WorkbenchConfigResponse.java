package com.oa.backend.dto;

import java.util.List;

/**
 * 工作台配置响应 DTO
 */
public record WorkbenchConfigResponse(
    List<MenuItem> menus,
    List<QuickAction> quickActions,
    DashboardWidgets widgets
) {
    public record MenuItem(
        String code,
        String name,
        String icon,
        String path,
        Boolean visible,
        List<MenuItem> children
    ) {
    }

    public record QuickAction(
        String code,
        String name,
        String icon,
        String action,
        Boolean enabled
    ) {
    }

    public record DashboardWidgets(
        Boolean showTodo,
        Boolean showProgress,
        Boolean showNotification,
        Boolean showCalendar
    ) {
    }
}
