package com.oa.backend.dto;

import jakarta.validation.constraints.NotEmpty;
import java.util.List;

/**
 * 通讯录导入应用请求 DTO
 */
public record DirectoryImportApplyRequest(
    @NotEmpty(message = "选中的记录不能为空")
    List<Integer> selectedIndices
) {
}
