package com.oa.backend.controller;

import com.oa.backend.entity.AttachmentMeta;
import com.oa.backend.entity.Employee;
import com.oa.backend.mapper.AttachmentMetaMapper;
import com.oa.backend.mapper.EmployeeMapper;
import com.oa.backend.security.SecurityUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Set;

import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.security.MessageDigest;
import java.time.LocalDateTime;
import java.util.HexFormat;
import java.util.Map;
import java.util.UUID;

/**
 * 附件上传/下载控制器
 * 职责：接收 multipart 文件上传，保存至本地文件系统，返回 attachmentId；
 *       按 ID 鉴权下载文件流。
 * 存储路径：${oa.upload-dir}/YYYY-MM-DD/{uuid}{ext}
 */
@Slf4j
@RestController
@RequestMapping("/attachments")
@RequiredArgsConstructor
public class AttachmentController {

    private final AttachmentMetaMapper attachmentMetaMapper;
    private final EmployeeMapper employeeMapper;

    @Value("${oa.upload-dir:./uploads}")
    private String uploadDir;

    private static final Set<String> AUDIT_ROLES = Set.of("ROLE_CEO", "ROLE_FINANCE", "ROLE_HR");
    private static final Set<String> APPROVER_ROLES = Set.of("ROLE_PROJECT_MANAGER", "ROLE_DEPARTMENT_MANAGER");
    private static final Set<String> APPROVER_BUSINESS_TYPES = Set.of("LOG", "INJURY", "EXPENSE", "LEAVE", "OVERTIME");

    /**
     * 上传附件
     * @param file 文件（multipart/form-data）
     * @param businessType 业务类型（LOG / INJURY）
     * @param businessId 业务记录 ID（可选）
     */
    @PostMapping("/upload")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Map<String, Object>> upload(
            @RequestParam("file") MultipartFile file,
            @RequestParam(defaultValue = "GENERAL") String businessType,
            @RequestParam(required = false) Long businessId,
            Authentication auth) throws IOException {

        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "file is empty"));
        }

        // 计算存储路径
        String today = LocalDateTime.now().toLocalDate().toString();
        String ext = getExtension(file.getOriginalFilename());
        String storedName = UUID.randomUUID() + ext;
        Path dir = Paths.get(uploadDir, today);
        Files.createDirectories(dir);
        Path target = dir.resolve(storedName);
        file.transferTo(target);

        // 计算 MD5
        String md5 = calcMd5(Files.readAllBytes(target));

        // 记录元数据
        Long uploaderId = getEmployeeId(auth);
        AttachmentMeta meta = new AttachmentMeta();
        meta.setBusinessType(businessType);
        meta.setBusinessId(businessId);
        meta.setFileName(file.getOriginalFilename());
        meta.setStoragePath(today + "/" + storedName);
        meta.setFileMd5(md5);
        meta.setFileSize(file.getSize());
        meta.setMimeType(file.getContentType());
        meta.setUploadedBy(uploaderId);
        meta.setUploadedAt(LocalDateTime.now());
        attachmentMetaMapper.insert(meta);

        log.info("Attachment uploaded: id={}, path={}", meta.getId(), meta.getStoragePath());
        return ResponseEntity.ok(Map.of(
                "attachmentId", meta.getId(),
                "fileName", file.getOriginalFilename(),
                "storagePath", meta.getStoragePath()
        ));
    }

    /**
     * 下载附件
     * 授权规则：
     *   - 上传者本人可访问
     *   - 审计角色（CEO / FINANCE / HR）可访问任意附件
     *   - 审批角色（PROJECT_MANAGER / DEPARTMENT_MANAGER）可访问审批流相关业务类型的附件
     *   - 其余情况返回 403
     */
    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Resource> download(@PathVariable Long id, Authentication auth) throws MalformedURLException {
        AttachmentMeta meta = attachmentMetaMapper.selectById(id);
        if (meta == null) {
            return ResponseEntity.notFound().build();
        }

        if (!canAccess(meta, auth)) {
            return ResponseEntity.status(403).build();
        }

        Path filePath = Paths.get(uploadDir).resolve(meta.getStoragePath());
        Resource resource = new UrlResource(filePath.toUri());
        if (!resource.exists()) {
            return ResponseEntity.notFound().build();
        }
        String contentType = meta.getMimeType() != null ? meta.getMimeType() : "application/octet-stream";
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(contentType))
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=\"" + meta.getFileName() + "\"")
                .body(resource);
    }

    private boolean canAccess(AttachmentMeta meta, Authentication auth) {
        if (auth == null) return false;

        Long currentEmployeeId = getEmployeeId(auth);
        if (currentEmployeeId != null && currentEmployeeId.equals(meta.getUploadedBy())) {
            return true;
        }

        Set<String> authorities = auth.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .collect(java.util.stream.Collectors.toUnmodifiableSet());

        if (authorities.stream().anyMatch(AUDIT_ROLES::contains)) {
            return true;
        }

        if (authorities.stream().anyMatch(APPROVER_ROLES::contains)
                && meta.getBusinessType() != null
                && APPROVER_BUSINESS_TYPES.contains(meta.getBusinessType())) {
            return true;
        }

        return false;
    }

    // ── helpers ─────────────────────────────────────────────────

    private String getExtension(String filename) {
        if (filename == null || !filename.contains(".")) return "";
        return filename.substring(filename.lastIndexOf("."));
    }

    private String calcMd5(byte[] data) {
        try {
            MessageDigest md = MessageDigest.getInstance("MD5");
            return HexFormat.of().formatHex(md.digest(data));
        } catch (Exception e) {
            return "";
        }
    }

    private Long getEmployeeId(Authentication auth) {
        if (auth == null) return null;
        Employee emp = SecurityUtils.getEmployeeFromUsername(auth.getName(), employeeMapper);
        return emp != null ? emp.getId() : null;
    }
}
