package com.oa.backend.dto;

import jakarta.validation.constraints.NotEmpty;
import java.util.List;

/**
 * 通讯录导入预览请求 DTO
 */
public record DirectoryImportPreviewRequest(
    @NotEmpty(message = "导入数据不能为空")
    List<ImportRecord> records
) {
    public record ImportRecord(
        String name,
        String phone,
        String department,
        String position,
        String email
    ) {
    }
}
