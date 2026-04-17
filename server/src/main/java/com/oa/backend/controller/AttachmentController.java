package com.oa.backend.controller;

import com.oa.backend.entity.AttachmentMeta;
import com.oa.backend.entity.Employee;
import com.oa.backend.mapper.AttachmentMetaMapper;
import com.oa.backend.mapper.EmployeeMapper;
import com.oa.backend.security.SecurityUtils;
import com.oa.backend.service.AttachmentAccessService;
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
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.MalformedURLException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.security.MessageDigest;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.HexFormat;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

/**
 * 附件上传/下载控制器
 * 职责：接收 multipart 文件上传，保存至本地文件系统，返回 attachmentId；
 *       按 ID 鉴权下载文件流。
 * 存储路径：${oa.upload-dir}/YYYY-MM-DD/{uuid}{ext}
 *
 * 访问控制（下载）委托给 AttachmentAccessService（见任务 A-AUDIT-FIX-03）
 * 上传类型校验：MIME 白名单 + 扩展名白名单 + 前 8 字节 magic bytes 基本一致性校验
 */
@Slf4j
@RestController
@RequestMapping("/attachments")
@RequiredArgsConstructor
public class AttachmentController {

    private final AttachmentMetaMapper attachmentMetaMapper;
    private final EmployeeMapper employeeMapper;
    private final AttachmentAccessService attachmentAccessService;

    @Value("${oa.upload-dir:./uploads}")
    private String uploadDir;

    /** 允许的 MIME 类型白名单 */
    private static final Set<String> ALLOWED_MIME_TYPES = Set.of(
            "application/pdf",
            "image/jpeg",
            "image/png",
            "image/gif",
            "image/webp",
            "application/msword",
            "application/vnd.ms-excel",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );

    /** 允许的文件扩展名白名单（小写，不含点） */
    private static final Set<String> ALLOWED_EXTENSIONS = Set.of(
            "pdf", "jpg", "jpeg", "png", "gif", "webp",
            "doc", "docx", "xls", "xlsx"
    );

    /**
     * 上传附件
     * @param file 文件（multipart/form-data）
     * @param businessType 业务类型（LOG / INJURY / EXPENSE / LEAVE / OVERTIME / GENERAL）
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

        // MIME 白名单校验
        String clientMime = file.getContentType();
        if (clientMime == null || !ALLOWED_MIME_TYPES.contains(clientMime.toLowerCase(Locale.ROOT))) {
            return ResponseEntity.status(415)
                    .body(Map.of("error", "unsupported mime type: " + clientMime));
        }

        // 扩展名白名单校验
        String extWithDot = getExtension(file.getOriginalFilename());
        String extNoDot = extWithDot.isEmpty() ? "" : extWithDot.substring(1).toLowerCase(Locale.ROOT);
        if (!ALLOWED_EXTENSIONS.contains(extNoDot)) {
            return ResponseEntity.status(415)
                    .body(Map.of("error", "unsupported file extension: " + extWithDot));
        }

        // Magic bytes 基本一致性校验（仅检测前 8 字节的已知签名，无签名的类型跳过）
        if (!isMagicBytesConsistent(file, extNoDot)) {
            return ResponseEntity.status(415)
                    .body(Map.of("error", "file content does not match declared type"));
        }

        // 计算存储路径
        String today = LocalDateTime.now().toLocalDate().toString();
        String storedName = UUID.randomUUID() + extWithDot;
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
        meta.setFileName(sanitizeFileName(file.getOriginalFilename()));
        meta.setStoragePath(today + "/" + storedName);
        meta.setFileMd5(md5);
        meta.setFileSize(file.getSize());
        meta.setMimeType(clientMime);
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
     * 授权规则委托给 AttachmentAccessService：
     *   - 上传者本人、审计角色（CEO/FINANCE/HR）直接放行
     *   - PM 仅限本人负责项目关联的附件
     *   - 部门经理仅限本部门成员提交的附件
     *   - 其它情况返回 403
     */
    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Resource> download(@PathVariable Long id, Authentication auth) throws MalformedURLException {
        AttachmentMeta meta = attachmentMetaMapper.selectById(id);
        if (meta == null) {
            return ResponseEntity.notFound().build();
        }

        Long currentEmployeeId = getEmployeeId(auth);
        if (!attachmentAccessService.canAccess(meta, auth, currentEmployeeId)) {
            return ResponseEntity.status(403).build();
        }

        Path filePath = Paths.get(uploadDir).resolve(meta.getStoragePath());
        Resource resource = new UrlResource(filePath.toUri());
        if (!resource.exists()) {
            return ResponseEntity.notFound().build();
        }
        String contentType = meta.getMimeType() != null ? meta.getMimeType() : "application/octet-stream";
        // RFC 5987 编码：filename 作为 ASCII 兜底，filename* 携带 UTF-8 原文件名
        // 防 Content-Disposition 头注入（引号/CRLF）+ 修正中文乱码
        String encodedFileName = URLEncoder.encode(meta.getFileName(), StandardCharsets.UTF_8).replace("+", "%20");
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(contentType))
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=\"file\"; filename*=UTF-8''" + encodedFileName)
                .body(resource);
    }

    // ── helpers ─────────────────────────────────────────────────

    private String getExtension(String filename) {
        if (filename == null || !filename.contains(".")) return "";
        return filename.substring(filename.lastIndexOf("."));
    }

    /**
     * 清洗原始文件名：去除 CRLF/反斜杠/斜杠等控制或路径字符，截断到 200 字符以避免 DB 列溢出。
     * 截断时保留扩展名。
     */
    private String sanitizeFileName(String raw) {
        if (raw == null || raw.isEmpty()) return "unnamed";
        String cleaned = raw.replaceAll("[\\r\\n\\\\/]", "_");
        if (cleaned.length() > 200) {
            String ext = getExtension(cleaned);
            int keep = 200 - ext.length();
            if (keep < 0) keep = 0;
            cleaned = cleaned.substring(0, keep) + ext;
        }
        return cleaned;
    }

    private String calcMd5(byte[] data) {
        try {
            MessageDigest md = MessageDigest.getInstance("MD5");
            return HexFormat.of().formatHex(md.digest(data));
        } catch (java.security.NoSuchAlgorithmException e) {
            // 保留原因：MD5 为 JDK 标准算法，理论上不应缺失；失败兜底为空 md5，不影响上传主流程
            log.warn("Attachment: MD5 algorithm not available on this JVM, skip md5 calculation", e);
            return "";
        }
    }

    private Long getEmployeeId(Authentication auth) {
        if (auth == null) return null;
        Employee emp = SecurityUtils.getEmployeeFromUsername(auth.getName(), employeeMapper);
        return emp != null ? emp.getId() : null;
    }

    /**
     * 前 8 字节 magic bytes 对照扩展名
     * PDF: 25 50 44 46 (%PDF)
     * PNG: 89 50 4E 47 0D 0A 1A 0A
     * JPEG: FF D8 FF
     * GIF: 47 49 46 38 (GIF8)
     * WEBP: 52 49 46 46 ... 57 45 42 50 (RIFF....WEBP)
     * ZIP-based (xlsx/docx): 50 4B 03 04
     * OLE2 (doc/xls): D0 CF 11 E0 A1 B1 1A E1
     * 不认识的扩展名直接放行（已经过前面白名单过滤）
     */
    private boolean isMagicBytesConsistent(MultipartFile file, String extNoDot) {
        // 不依赖 getInputStream 每次返回新流的实现细节，改用 getBytes()（上传上限 10MB 可接受）
        byte[] head;
        try {
            byte[] allBytes = file.getBytes();
            int n = Math.min(12, allBytes.length);
            if (n < 4) return false;
            head = Arrays.copyOfRange(allBytes, 0, n);
        } catch (IOException e) {
            return false;
        }
        return switch (extNoDot) {
            case "pdf" -> startsWith(head, (byte) 0x25, (byte) 0x50, (byte) 0x44, (byte) 0x46);
            case "png" -> startsWith(head, (byte) 0x89, (byte) 0x50, (byte) 0x4E, (byte) 0x47);
            case "jpg", "jpeg" -> startsWith(head, (byte) 0xFF, (byte) 0xD8, (byte) 0xFF);
            case "gif" -> startsWith(head, (byte) 0x47, (byte) 0x49, (byte) 0x46, (byte) 0x38);
            case "webp" -> startsWith(head, (byte) 0x52, (byte) 0x49, (byte) 0x46, (byte) 0x46)
                    && head.length >= 12
                    && head[8] == (byte) 0x57 && head[9] == (byte) 0x45
                    && head[10] == (byte) 0x42 && head[11] == (byte) 0x50;
            case "xlsx", "docx" -> startsWith(head, (byte) 0x50, (byte) 0x4B, (byte) 0x03, (byte) 0x04);
            case "doc", "xls" -> startsWith(head, (byte) 0xD0, (byte) 0xCF, (byte) 0x11, (byte) 0xE0);
            default -> true;
        };
    }

    private boolean startsWith(byte[] data, byte... expected) {
        if (data.length < expected.length) return false;
        for (int i = 0; i < expected.length; i++) {
            if (data[i] != expected[i]) return false;
        }
        return true;
    }
}
