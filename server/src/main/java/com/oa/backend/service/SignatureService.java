package com.oa.backend.service;

import com.oa.backend.entity.EmployeeSignature;
import com.oa.backend.mapper.EmployeeSignatureMapper;
import java.io.ByteArrayInputStream;
import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.List;
import javax.crypto.Cipher;
import javax.crypto.spec.IvParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.font.PDType0Font;
import org.apache.pdfbox.pdmodel.graphics.image.PDImageXObject;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 电子签名服务，处理员工签名绑定与验证。
 *
 * <p>核心功能：
 *
 * <ul>
 *   <li>签名绑定：AES-256 加密存储签名图片，bcrypt 存储 PIN
 *   <li>PIN 验证：bcrypt 比对
 *   <li>签名状态查询
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

  private final EmployeeSignatureMapper signatureMapper;
  private final BCryptPasswordEncoder passwordEncoder;

  @Value("${app.signature.aes-key}")
  private String aesKey;

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
