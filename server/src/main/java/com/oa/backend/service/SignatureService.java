package com.oa.backend.service;

import com.oa.backend.entity.*;
import com.oa.backend.mapper.*;
import java.awt.Color;
import java.io.ByteArrayInputStream;
import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Base64;
import java.util.List;
import javax.crypto.Cipher;
import javax.crypto.spec.IvParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.common.PDRectangle;
import org.apache.pdfbox.pdmodel.font.PDType0Font;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import org.apache.pdfbox.pdmodel.font.Standard14Fonts;
import org.apache.pdfbox.pdmodel.graphics.image.PDImageXObject;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 电子签名服务，处理员工签名绑定、验证、工资条确认及存证 PDF 生成。
 *
 * <p>核心功能：
 *
 * <ul>
 *   <li>签名绑定：AES-256 加密存储签名图片，bcrypt 存储 PIN
 *   <li>PIN 验证：bcrypt 比对
 *   <li>工资条确认：验证 PIN → 更新状态 → 生成存证链记录
 *   <li>PDF 生成：使用 PDFBox 生成带签名的存证 PDF
 * </ul>
 *
 * @author OA Backend Team
 * @since 1.0.0
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class SignatureService {

  private static final String AES_ALGORITHM = "AES";
  // CBC mode with random IV; IV (16 bytes) is prepended to the ciphertext before Base64 encoding
  private static final String AES_TRANSFORMATION = "AES/CBC/PKCS5Padding";
  private static final int AES_IV_LENGTH = 16;
  private static final String SHA_256 = "SHA-256";
  private static final DateTimeFormatter DATE_FORMATTER =
      DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
  private static final String COMPANY_NAME = "Boyuan OA";

  private final EmployeeSignatureMapper signatureMapper;
  private final EvidenceChainMapper evidenceChainMapper;
  private final PayrollSlipMapper slipMapper;
  private final PayrollSlipItemMapper slipItemMapper;
  private final PayrollItemDefMapper itemDefMapper;
  private final EmployeeMapper employeeMapper;
  private final SalaryConfirmationAgreementMapper agreementMapper;
  private final BCryptPasswordEncoder passwordEncoder;

  @Value("${app.signature.aes-key}")
  private String aesKey;

  @Value("${oa.upload-dir:./uploads}")
  private String uploadDir;

  /**
   * 绑定员工电子签名。
   *
   * <p>操作：
   *
   * <ol>
   *   <li>AES-256 加密签名图片，存储加密后的字符串
   *   <li>SHA-256 计算签名内容哈希
   *   <li>bcrypt 加密 PIN 码
   *   <li>设置绑定时间
   * </ol>
   *
   * @param employeeId 员工 ID
   * @param base64Image Base64 编码的签名图片
   * @param pin 4-6 位数字 PIN 码
   * @throws IllegalArgumentException 如果参数无效或加密失败
   */
  @Transactional
  public void bindSignature(Long employeeId, String base64Image, String pin) {
    if (employeeId == null
        || base64Image == null
        || base64Image.isBlank()
        || pin == null
        || pin.isBlank()) {
      throw new IllegalArgumentException("员工 ID、签名图片和 PIN 码不能为空");
    }

    try {
      // AES-256 加密签名图片
      String encryptedImage = encryptAes(base64Image);

      // SHA-256 计算签名内容哈希
      String signatureHash = sha256(base64Image);

      // bcrypt 加密 PIN
      String pinHash = passwordEncoder.encode(pin);

      // 查找或创建签名记录
      EmployeeSignature signature = signatureMapper.findByEmployeeId(employeeId);
      if (signature == null) {
        signature = new EmployeeSignature();
        signature.setEmployeeId(employeeId);
      }

      signature.setSignatureImageEncrypted(encryptedImage);
      signature.setSignatureHash(signatureHash);
      signature.setPinHash(pinHash);
      signature.setBoundAt(LocalDateTime.now());

      if (signature.getId() == null) {
        signatureMapper.insert(signature);
      } else {
        signatureMapper.updateById(signature);
      }

      log.info("员工 [{}] 成功绑定电子签名", employeeId);

    } catch (Exception e) {
      log.error("绑定签名失败: employeeId={}", employeeId, e);
      throw new IllegalArgumentException("签名绑定失败: " + e.getMessage(), e);
    }
  }

  /**
   * 验证员工 PIN 码。
   *
   * @param employeeId 员工 ID
   * @param rawPin 原始 PIN 码
   * @return true 如果 PIN 码匹配，false 如果不匹配或员工未绑定签名
   */
  public boolean verifyPin(Long employeeId, String rawPin) {
    if (employeeId == null || rawPin == null || rawPin.isBlank()) {
      return false;
    }

    EmployeeSignature signature = signatureMapper.findByEmployeeId(employeeId);
    if (signature == null || signature.getPinHash() == null) {
      return false;
    }

    return passwordEncoder.matches(rawPin, signature.getPinHash());
  }

  /**
   * 检查员工是否已绑定签名。
   *
   * @param employeeId 员工 ID
   * @return true 如果员工已绑定签名且设置了 PIN
   */
  public boolean isBound(Long employeeId) {
    if (employeeId == null) {
      return false;
    }

    EmployeeSignature signature = signatureMapper.findByEmployeeId(employeeId);
    return signature != null && signature.getPinHash() != null && !signature.getPinHash().isBlank();
  }

  /**
   * 确认工资条。
   *
   * <p>流程：
   *
   * <ol>
   *   <li>验证 PIN 码
   *   <li>加载工资条（必须是 PUBLISHED 状态）
   *   <li>获取当前生效的确认协议版本
   *   <li>计算内容哈希（SHA-256）
   *   <li>更新工资条状态为 CONFIRMED
   *   <li>写入存证链记录
   * </ol>
   *
   * @param employeeId 员工 ID
   * @param slipId 工资条 ID
   * @param rawPin 原始 PIN 码
   * @return 存证链记录 ID
   * @throws IllegalArgumentException 如果验证失败或状态不正确
   * @throws IllegalStateException 如果工资条状态不允许确认
   */
  @Transactional
  public Long confirmPayrollSlip(Long employeeId, Long slipId, String rawPin) {
    // 1. 验证 PIN
    if (!verifyPin(employeeId, rawPin)) {
      throw new IllegalArgumentException("PIN 码错误或员工未绑定签名");
    }

    // 2. 加载工资条
    PayrollSlip slip = slipMapper.selectById(slipId);
    if (slip == null || slip.getDeleted() == 1) {
      throw new IllegalArgumentException("工资条不存在");
    }

    // 验证所有权
    if (!slip.getEmployeeId().equals(employeeId)) {
      throw new IllegalArgumentException("无权操作此工资条");
    }

    // 必须是 PUBLISHED 状态
    if (!"PUBLISHED".equals(slip.getStatus())) {
      throw new IllegalStateException("工资条状态为 [" + slip.getStatus() + "], 仅 PUBLISHED 状态可确认");
    }

    // 3. 获取当前生效的协议版本
    SalaryConfirmationAgreement agreement = agreementMapper.findActive();
    String agreementVersion = (agreement != null) ? agreement.getVersion() : "v1.0";

    // 4. 生成确认时间戳
    LocalDateTime confirmedAt = LocalDateTime.now();

    // 5. 计算内容哈希 (SHA-256 of employeeId + slipId + confirmedAt)
    String contentHash = computeContentHash(employeeId, slipId, confirmedAt);

    // 6. 更新工资条状态
    slip.setStatus("CONFIRMED");
    slip.setUpdatedAt(confirmedAt);
    slipMapper.updateById(slip);

    // 7. 写入存证链记录
    EvidenceChain evidence = new EvidenceChain();
    evidence.setSlipId(slipId);
    evidence.setEmployeeId(employeeId);
    evidence.setContentHash(contentHash);
    evidence.setConfirmedAt(confirmedAt);
    evidence.setAgreementVersion(agreementVersion);
    evidence.setCreatedAt(LocalDateTime.now());

    evidenceChainMapper.insert(evidence);

    log.info("员工 [{}] 确认工资条 [{}], 存证链 ID: {}", employeeId, slipId, evidence.getId());

    return evidence.getId();
  }

  /**
   * 生成工资条存证 PDF。
   *
   * <p>PDF 内容包括：
   *
   * <ul>
   *   <li>页眉：公司名称
   *   <li>员工姓名、工资期间
   *   <li>工资项目明细表（名称、金额）
   *   <li>实发金额合计
   *   <li>分隔线
   *   <li>确认声明文本
   *   <li>签名图片（AES 解密后嵌入）
   *   <li>时间戳水印
   * </ul>
   *
   * @param slipId 工资条 ID
   * @return 生成的 PDF 文件路径
   * @throws IllegalArgumentException 如果工资条或签名不存在
   * @throws IllegalStateException 如果 PDF 生成失败
   */
  @Transactional(readOnly = true)
  public String generateEvidencePdf(Long slipId) {
    // 加载工资条
    PayrollSlip slip = slipMapper.selectById(slipId);
    if (slip == null || slip.getDeleted() == 1) {
      throw new IllegalArgumentException("工资条不存在");
    }

    // 加载员工
    Employee employee = employeeMapper.selectById(slip.getEmployeeId());
    if (employee == null) {
      throw new IllegalArgumentException("员工不存在");
    }

    // 加载签名
    EmployeeSignature signature = signatureMapper.findByEmployeeId(slip.getEmployeeId());
    if (signature == null || signature.getSignatureImageEncrypted() == null) {
      throw new IllegalArgumentException("员工未绑定签名");
    }

    // 加载存证记录
    EvidenceChain evidence = evidenceChainMapper.findBySlipId(slipId);
    if (evidence == null) {
      throw new IllegalArgumentException("工资条尚未确认，无存证记录");
    }

    // 加载工资条项目
    List<PayrollSlipItem> items = slipItemMapper.findBySlipId(slipId);

    // 构建 PDF
    String pdfPath = buildPdf(slip, employee, signature, evidence, items);

    // 更新存证记录的 PDF 路径
    evidence.setPdfPath(pdfPath);
    evidenceChainMapper.updateById(evidence);

    log.info("生成工资条 [{}] 存证 PDF: {}", slipId, pdfPath);

    return pdfPath;
  }

  /** 使用 PDFBox 构建存证 PDF。 */
  private String buildPdf(
      PayrollSlip slip,
      Employee employee,
      EmployeeSignature signature,
      EvidenceChain evidence,
      List<PayrollSlipItem> items) {

    String pdfFileName = slip.getId() + ".pdf";
    Path pdfDir = Paths.get(uploadDir, "evidence");
    Path pdfPath = pdfDir.resolve(pdfFileName);

    try {
      // 确保目录存在
      Files.createDirectories(pdfDir);

      try (PDDocument document = new PDDocument()) {
        PDPage page = new PDPage(PDRectangle.A4);
        document.addPage(page);

        // 使用支持中文的字体（尝试使用系统字体，否则回退到标准字体）
        PDType0Font font = loadChineseFont(document);

        try (PDPageContentStream contentStream = new PDPageContentStream(document, page)) {
          float yPosition = 750;
          float margin = 50;
          float pageWidth = page.getMediaBox().getWidth();

          // 1. 页眉 - 公司名称
          contentStream.setFont(
              font != null ? font : new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD), 18);
          contentStream.beginText();
          contentStream.newLineAtOffset((pageWidth - 100) / 2, yPosition);
          contentStream.showText(COMPANY_NAME);
          contentStream.endText();
          yPosition -= 40;

          // 2. 标题
          contentStream.setFont(
              font != null ? font : new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD), 14);
          contentStream.beginText();
          contentStream.newLineAtOffset(margin, yPosition);
          contentStream.showText("Salary Confirmation Evidence");
          contentStream.endText();
          yPosition -= 30;

          // 3. 员工信息
          contentStream.setFont(
              font != null ? font : new PDType1Font(Standard14Fonts.FontName.HELVETICA), 11);
          String employeeName = employee.getName() != null ? employee.getName() : "N/A";
          String period = formatPeriod(slip);

          contentStream.beginText();
          contentStream.newLineAtOffset(margin, yPosition);
          contentStream.showText("Employee: " + employeeName);
          contentStream.endText();
          yPosition -= 20;

          contentStream.beginText();
          contentStream.newLineAtOffset(margin, yPosition);
          contentStream.showText("Period: " + period);
          contentStream.endText();
          yPosition -= 30;

          // 4. 工资项目表头
          contentStream.setFont(
              font != null ? font : new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD), 11);
          drawTableRow(contentStream, margin, yPosition, pageWidth - 2 * margin, "Item", "Amount");
          yPosition -= 20;

          // 分隔线
          contentStream.setLineWidth(0.5f);
          contentStream.moveTo(margin, yPosition + 5);
          contentStream.lineTo(pageWidth - margin, yPosition + 5);
          contentStream.stroke();

          // 5. 工资项目明细
          contentStream.setFont(
              font != null ? font : new PDType1Font(Standard14Fonts.FontName.HELVETICA), 10);
          BigDecimal total = BigDecimal.ZERO;

          for (PayrollSlipItem item : items) {
            PayrollItemDef def = itemDefMapper.selectById(item.getItemDefId());
            String itemName = (def != null) ? def.getName() : "Unknown";
            String amount = formatAmount(item.getAmount());

            yPosition -= 18;
            drawTableRow(
                contentStream, margin, yPosition, pageWidth - 2 * margin, itemName, amount);

            if (item.getAmount() != null) {
              total = total.add(item.getAmount());
            }
          }

          yPosition -= 10;
          // 分隔线
          contentStream.moveTo(margin, yPosition);
          contentStream.lineTo(pageWidth - margin, yPosition);
          contentStream.stroke();

          // 6. 合计
          yPosition -= 20;
          contentStream.setFont(
              font != null ? font : new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD), 11);
          drawTableRow(
              contentStream,
              margin,
              yPosition,
              pageWidth - 2 * margin,
              "Total:",
              formatAmount(total));

          yPosition -= 40;

          // 7. 分隔线
          contentStream.moveTo(margin, yPosition);
          contentStream.lineTo(pageWidth - margin, yPosition);
          contentStream.stroke();
          yPosition -= 30;

          // 8. 确认声明
          contentStream.setFont(
              font != null ? font : new PDType1Font(Standard14Fonts.FontName.HELVETICA), 10);
          String statement =
              "I hereby confirm that I have reviewed the above payroll information "
                  + "and agree that it is accurate and complete.";

          List<String> wrappedStatement = wrapText(statement, 70);
          for (String line : wrappedStatement) {
            contentStream.beginText();
            contentStream.newLineAtOffset(margin, yPosition);
            contentStream.showText(line);
            contentStream.endText();
            yPosition -= 15;
          }

          yPosition -= 20;

          // 9. 签名图片
          try {
            String decryptedImage = decryptAes(signature.getSignatureImageEncrypted());
            PDImageXObject image = loadImageFromBase64(document, decryptedImage);
            if (image != null) {
              float imageWidth = 150;
              float imageHeight = imageWidth * image.getHeight() / image.getWidth();
              contentStream.drawImage(
                  image, margin, yPosition - imageHeight, imageWidth, imageHeight);
              yPosition -= (imageHeight + 20);
            }
          } catch (Exception e) {
            log.warn("无法加载签名图片: slipId={}", slip.getId(), e);
            contentStream.beginText();
            contentStream.newLineAtOffset(margin, yPosition);
            contentStream.showText("[Signature Image]");
            contentStream.endText();
            yPosition -= 20;
          }

          // 10. 确认时间
          contentStream.setFont(
              font != null ? font : new PDType1Font(Standard14Fonts.FontName.HELVETICA), 10);
          contentStream.beginText();
          contentStream.newLineAtOffset(margin, yPosition);
          String confirmedTime =
              evidence.getConfirmedAt() != null
                  ? evidence.getConfirmedAt().format(DATE_FORMATTER)
                  : "N/A";
          contentStream.showText("Confirmed at: " + confirmedTime);
          contentStream.endText();

          // 11. 时间戳水印（右下角）
          contentStream.setNonStrokingColor(Color.GRAY);
          contentStream.setFont(
              font != null ? font : new PDType1Font(Standard14Fonts.FontName.HELVETICA), 8);
          contentStream.beginText();
          contentStream.newLineAtOffset(pageWidth - margin - 150, 30);
          contentStream.showText("Evidence ID: " + evidence.getId());
          contentStream.endText();
          contentStream.setNonStrokingColor(Color.BLACK);
        }

        // 保存 PDF
        document.save(pdfPath.toFile());
      }

      return pdfPath.toString();

    } catch (IOException e) {
      log.error("生成 PDF 失败: slipId={}", slip.getId(), e);
      throw new IllegalStateException("PDF 生成失败: " + e.getMessage(), e);
    }
  }

  /** 加载支持中文的字体。 */
  private PDType0Font loadChineseFont(PDDocument document) {
    // 尝试加载系统字体
    String[] fontPaths = {
      "C:/Windows/Fonts/simhei.ttf",
      "C:/Windows/Fonts/simsun.ttc",
      "/usr/share/fonts/truetype/wqy/wqy-zenhei.ttc",
      "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
      "/System/Library/Fonts/PingFang.ttc",
      "/System/Library/Fonts/STHeiti Light.ttc"
    };

    for (String fontPath : fontPaths) {
      try {
        File fontFile = new File(fontPath);
        if (fontFile.exists()) {
          return PDType0Font.load(document, fontFile);
        }
      } catch (IOException e) {
        // 继续尝试下一个字体
      }
    }

    return null;
  }

  /** 从 Base64 加载图片。 */
  private PDImageXObject loadImageFromBase64(PDDocument document, String base64Image)
      throws IOException {
    try {
      // 移除 data:image/xxx;base64, 前缀
      String base64Data = base64Image;
      if (base64Image.contains(",")) {
        base64Data = base64Image.substring(base64Image.indexOf(",") + 1);
      }

      byte[] imageBytes = Base64.getDecoder().decode(base64Data);
      try (InputStream is = new ByteArrayInputStream(imageBytes)) {
        return PDImageXObject.createFromByteArray(document, imageBytes, "signature");
      }
    } catch (Exception e) {
      log.warn("加载图片失败", e);
      return null;
    }
  }

  /** 绘制表格行。 */
  private void drawTableRow(
      PDPageContentStream contentStream,
      float x,
      float y,
      float width,
      String leftText,
      String rightText)
      throws IOException {
    contentStream.beginText();
    contentStream.newLineAtOffset(x, y);
    contentStream.showText(leftText);
    contentStream.endText();

    contentStream.beginText();
    contentStream.newLineAtOffset(x + width - 100, y);
    contentStream.showText(rightText);
    contentStream.endText();
  }

  /** 自动换行文本。 */
  private List<String> wrapText(String text, int maxLength) {
    java.util.List<String> lines = new java.util.ArrayList<>();
    StringBuilder currentLine = new StringBuilder();

    for (String word : text.split(" ")) {
      if (currentLine.length() + word.length() + 1 > maxLength) {
        lines.add(currentLine.toString());
        currentLine = new StringBuilder(word);
      } else {
        if (currentLine.length() > 0) {
          currentLine.append(" ");
        }
        currentLine.append(word);
      }
    }

    if (currentLine.length() > 0) {
      lines.add(currentLine.toString());
    }

    return lines;
  }

  /** 格式化期间。 */
  private String formatPeriod(PayrollSlip slip) {
    // 从 cycle_id 查找周期
    // 简化处理：返回周期信息
    return "Cycle ID: " + slip.getCycleId();
  }

  /** 格式化金额。 */
  private String formatAmount(BigDecimal amount) {
    if (amount == null) {
      return "0.00";
    }
    return String.format("%.2f", amount);
  }

  /** 计算内容哈希（SHA-256 of employeeId + slipId + confirmedAt）。 */
  private String computeContentHash(Long employeeId, Long slipId, LocalDateTime confirmedAt) {
    String data = employeeId + ":" + slipId + ":" + confirmedAt.toString();
    return sha256(data);
  }

  /** AES-256/CBC 加密。 随机生成 16 字节 IV，将 IV 拼接在密文前一起 Base64 编码输出。 */
  private String encryptAes(String plainText) throws Exception {
    byte[] iv = new byte[AES_IV_LENGTH];
    new SecureRandom().nextBytes(iv);
    SecretKeySpec keySpec = new SecretKeySpec(getAesKeyBytes(), AES_ALGORITHM);
    Cipher cipher = Cipher.getInstance(AES_TRANSFORMATION);
    cipher.init(Cipher.ENCRYPT_MODE, keySpec, new IvParameterSpec(iv));
    byte[] encrypted = cipher.doFinal(plainText.getBytes(StandardCharsets.UTF_8));
    // Prepend IV to ciphertext so decryptAes can extract it
    byte[] ivAndCipher = new byte[AES_IV_LENGTH + encrypted.length];
    System.arraycopy(iv, 0, ivAndCipher, 0, AES_IV_LENGTH);
    System.arraycopy(encrypted, 0, ivAndCipher, AES_IV_LENGTH, encrypted.length);
    return Base64.getEncoder().encodeToString(ivAndCipher);
  }

  /** AES-256/CBC 解密。 从 Base64 解码后提取前 16 字节作为 IV，剩余字节为密文。 */
  private String decryptAes(String encryptedText) throws Exception {
    byte[] ivAndCipher = Base64.getDecoder().decode(encryptedText);
    byte[] iv = new byte[AES_IV_LENGTH];
    byte[] cipherBytes = new byte[ivAndCipher.length - AES_IV_LENGTH];
    System.arraycopy(ivAndCipher, 0, iv, 0, AES_IV_LENGTH);
    System.arraycopy(ivAndCipher, AES_IV_LENGTH, cipherBytes, 0, cipherBytes.length);
    SecretKeySpec keySpec = new SecretKeySpec(getAesKeyBytes(), AES_ALGORITHM);
    Cipher cipher = Cipher.getInstance(AES_TRANSFORMATION);
    cipher.init(Cipher.DECRYPT_MODE, keySpec, new IvParameterSpec(iv));
    byte[] decrypted = cipher.doFinal(cipherBytes);
    return new String(decrypted, StandardCharsets.UTF_8);
  }

  /** 获取 AES 密钥字节数组。 */
  private byte[] getAesKeyBytes() {
    if (aesKey == null || aesKey.length() < 16) {
      throw new IllegalStateException("AES 密钥未配置或长度不足（至少16字符）");
    }
    // 使用密钥前32字节，或填充/截断至32字节（AES-256）
    byte[] keyBytes = new byte[32];
    byte[] provided = aesKey.getBytes(StandardCharsets.UTF_8);
    int length = Math.min(provided.length, 32);
    System.arraycopy(provided, 0, keyBytes, 0, length);
    return keyBytes;
  }

  /** SHA-256 哈希。 */
  private String sha256(String input) {
    try {
      MessageDigest digest = MessageDigest.getInstance(SHA_256);
      byte[] hash = digest.digest(input.getBytes(StandardCharsets.UTF_8));
      StringBuilder hexString = new StringBuilder();
      for (byte b : hash) {
        String hex = Integer.toHexString(0xff & b);
        if (hex.length() == 1) {
          hexString.append('0');
        }
        hexString.append(hex);
      }
      return hexString.toString();
    } catch (Exception e) {
      throw new RuntimeException("SHA-256 计算失败", e);
    }
  }
}
