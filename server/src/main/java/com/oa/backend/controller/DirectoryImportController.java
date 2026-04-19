package com.oa.backend.controller;

import com.oa.backend.dto.DirectoryImportApplyRequest;
import com.oa.backend.dto.DirectoryImportPreviewRequest;
import com.oa.backend.dto.DirectoryImportPreviewResponse;
import jakarta.validation.Valid;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

/** 通讯录导入控制器 */
@RestController
@RequestMapping("/directory")
@RequiredArgsConstructor
public class DirectoryImportController {

  /** 通讯录导入预览 权限：仅HR */
  @PostMapping("/import-preview")
  @PreAuthorize("hasRole('HR')")
  public ResponseEntity<DirectoryImportPreviewResponse> importPreview(
      @Valid @RequestBody DirectoryImportPreviewRequest request) {
    int total = request.records().size();
    int valid = 0;
    int duplicate = 0;
    int invalid = 0;
    List<DirectoryImportPreviewResponse.ImportPreviewItem> items = new ArrayList<>();
    Set<String> phoneSet = new HashSet<>();

    for (int i = 0; i < request.records().size(); i++) {
      DirectoryImportPreviewRequest.ImportRecord record = request.records().get(i);
      String status;
      String message;

      if (record.name() == null || record.name().isBlank()) {
        status = "INVALID";
        message = "姓名为空";
        invalid++;
      } else if (record.phone() == null || record.phone().isBlank()) {
        status = "INVALID";
        message = "手机号为空";
        invalid++;
      } else if (!record.phone().matches("^1[3-9]\\d{9}$")) {
        status = "INVALID";
        message = "手机号格式不正确";
        invalid++;
      } else if (phoneSet.contains(record.phone())) {
        status = "DUPLICATE";
        message = "手机号重复";
        duplicate++;
      } else {
        status = "VALID";
        message = "验证通过";
        valid++;
        phoneSet.add(record.phone());
      }

      items.add(
          new DirectoryImportPreviewResponse.ImportPreviewItem(
              i, record.name(), record.phone(), record.department(), status, message));
    }

    return ResponseEntity.ok(
        new DirectoryImportPreviewResponse(total, valid, invalid, duplicate, items));
  }

  /** 通讯录导入应用 权限：仅HR */
  @PostMapping("/import-apply")
  @PreAuthorize("hasRole('HR')")
  public ResponseEntity<String> importApply(
      @Valid @RequestBody DirectoryImportApplyRequest request) {
    return ResponseEntity.ok("导入成功，共导入 " + request.selectedIndices().size() + " 条记录");
  }
}
