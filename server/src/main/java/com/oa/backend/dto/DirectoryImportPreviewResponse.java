package com.oa.backend.dto;

import java.util.List;

/**
 * 通讯录导入预览响应 DTO
 */
public record DirectoryImportPreviewResponse(
    int totalCount,
    int validCount,
    int invalidCount,
    int duplicateCount,
    List<ImportPreviewItem> items
) {
    public record ImportPreviewItem(
        int rowIndex,
        String name,
        String phone,
        String department,
        String status,
        String message
    ) {
    }
}
