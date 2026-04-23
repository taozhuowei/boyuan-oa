package com.oa.backend.service;

import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;
import java.awt.Color;
import java.awt.Font;
import java.awt.Graphics2D;
import java.awt.RenderingHints;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.security.SecureRandom;
import java.util.Base64;
import java.util.UUID;
import java.util.concurrent.TimeUnit;
import javax.imageio.ImageIO;
import org.springframework.stereotype.Service;

/**
 * DEF-AUTH-02: 图形验证码服务。
 *
 * <p>场景：登录失败 ≥ 3 次后，下次登录需先通过图形验证码。 有效期 3 分钟，一次性使用。生成不依赖第三方服务（BufferedImage + AWT）。
 *
 * <p>数据来源：SecureRandom 生成 4 位数字；不持久化，重启清零。
 */
@Service
public class CaptchaService {

  private static final int CODE_LENGTH = 4;
  private static final int IMAGE_WIDTH = 120;
  private static final int IMAGE_HEIGHT = 40;
  private static final long TTL_MINUTES = 3;

  private final SecureRandom random = new SecureRandom();

  /** captchaId -> code（小写用于匹配，用户输入不区分大小写） */
  private final Cache<String, String> store =
      Caffeine.newBuilder().expireAfterWrite(TTL_MINUTES, TimeUnit.MINUTES).build();

  /** 生成一个新的验证码 + PNG 图片（base64），返回 captchaId 和 imageBase64。 */
  public Captcha generate() {
    String code = generateCode();
    String captchaId = UUID.randomUUID().toString();
    store.put(captchaId, code);
    String imageBase64 = renderBase64Png(code);
    return new Captcha(captchaId, imageBase64);
  }

  /**
   * 校验验证码。成功后立即失效（一次性），避免重放。
   *
   * @param captchaId GET /auth/captcha 返回的 captchaId
   * @param userAnswer 用户输入
   * @return true 表示通过
   */
  public boolean verify(String captchaId, String userAnswer) {
    if (captchaId == null || userAnswer == null) return false;
    String expected = store.getIfPresent(captchaId);
    if (expected == null) return false;
    store.invalidate(captchaId);
    return expected.equalsIgnoreCase(userAnswer.trim());
  }

  private String generateCode() {
    StringBuilder sb = new StringBuilder(CODE_LENGTH);
    for (int i = 0; i < CODE_LENGTH; i++) sb.append(random.nextInt(10));
    return sb.toString();
  }

  private String renderBase64Png(String code) {
    BufferedImage image = new BufferedImage(IMAGE_WIDTH, IMAGE_HEIGHT, BufferedImage.TYPE_INT_RGB);
    Graphics2D g = image.createGraphics();
    try {
      g.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
      g.setColor(new Color(245, 246, 250));
      g.fillRect(0, 0, IMAGE_WIDTH, IMAGE_HEIGHT);

      // 干扰线
      for (int i = 0; i < 6; i++) {
        g.setColor(new Color(180 + random.nextInt(50), 180 + random.nextInt(50), 220));
        g.drawLine(
            random.nextInt(IMAGE_WIDTH),
            random.nextInt(IMAGE_HEIGHT),
            random.nextInt(IMAGE_WIDTH),
            random.nextInt(IMAGE_HEIGHT));
      }

      g.setFont(new Font("SansSerif", Font.BOLD, 28));
      int charWidth = IMAGE_WIDTH / (CODE_LENGTH + 1);
      for (int i = 0; i < code.length(); i++) {
        g.setColor(new Color(40 + random.nextInt(80), 60 + random.nextInt(80), 140));
        double theta = (random.nextDouble() - 0.5) * 0.5; // -0.25 ~ 0.25 rad
        int x = charWidth * (i + 1) - 10;
        int y = 30;
        g.rotate(theta, x, y);
        g.drawString(String.valueOf(code.charAt(i)), x, y);
        g.rotate(-theta, x, y);
      }

      ByteArrayOutputStream out = new ByteArrayOutputStream();
      ImageIO.write(image, "png", out);
      return Base64.getEncoder().encodeToString(out.toByteArray());
    } catch (IOException e) {
      throw new IllegalStateException("验证码图片生成失败", e);
    } finally {
      g.dispose();
    }
  }

  /** DTO：验证码返回体。 */
  public record Captcha(String captchaId, String imageBase64) {}
}
