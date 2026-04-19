package com.oa.backend.service;

import com.oa.backend.entity.AttachmentMeta;
import com.oa.backend.entity.Employee;
import com.oa.backend.mapper.AttachmentMetaMapper;
import com.oa.backend.mapper.EmployeeMapper;
import java.time.LocalDateTime;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

/** 附件元数据持久化服务。 职责：保存上传文件的元数据记录，以及解析当前用户身份。 访问控制逻辑由 AttachmentAccessService 负责。 */
@Service
@RequiredArgsConstructor
public class AttachmentService {

  private final AttachmentMetaMapper attachmentMetaMapper;
  private final EmployeeMapper employeeMapper;

  /**
   * 保存附件元数据到数据库。
   *
   * @param businessType 业务类型（LOG / INJURY / EXPENSE / LEAVE / OVERTIME / GENERAL）
   * @param businessId 业务记录 ID（可选）
   * @param fileName 清洗后的原始文件名
   * @param storagePath 相对于上传根目录的存储路径（YYYY-MM-DD/{uuid}{ext}）
   * @param fileMd5 文件 MD5 校验值
   * @param fileSize 文件字节数
   * @param mimeType MIME 类型
   * @param uploadedBy 上传人员工 ID
   * @return 已持久化的 AttachmentMeta（含自增 id）
   */
  public AttachmentMeta saveAttachmentMeta(
      String businessType,
      Long businessId,
      String fileName,
      String storagePath,
      String fileMd5,
      long fileSize,
      String mimeType,
      Long uploadedBy) {
    AttachmentMeta meta = new AttachmentMeta();
    meta.setBusinessType(businessType);
    meta.setBusinessId(businessId);
    meta.setFileName(fileName);
    meta.setStoragePath(storagePath);
    meta.setFileMd5(fileMd5);
    meta.setFileSize(fileSize);
    meta.setMimeType(mimeType);
    meta.setUploadedBy(uploadedBy);
    meta.setUploadedAt(LocalDateTime.now());
    attachmentMetaMapper.insert(meta);
    return meta;
  }

  /** 根据 ID 查询附件元数据；未找到返回 null */
  public AttachmentMeta findById(Long id) {
    return attachmentMetaMapper.selectById(id);
  }

  /** 根据用户名（employee_no）解析员工 ID；供 controller 使用，避免直接注入 EmployeeMapper */
  public Long resolveEmployeeIdByUsername(String username) {
    if (username == null) return null;
    Employee emp =
        employeeMapper.selectOne(
            new com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper<Employee>()
                .eq(Employee::getEmployeeNo, username)
                .eq(Employee::getDeleted, 0));
    return emp != null ? emp.getId() : null;
  }
}
