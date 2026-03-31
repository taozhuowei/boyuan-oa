package com.oa.backend.security;

import com.auth0.jwt.JWT;
import com.auth0.jwt.algorithms.Algorithm;
import com.auth0.jwt.exceptions.JWTVerificationException;
import com.auth0.jwt.interfaces.DecodedJWT;
import com.auth0.jwt.interfaces.JWTVerifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Optional;

/**
 * JWT令牌服务类
 *
 * 设计说明：
 * 负责JWT令牌的生成、签名和验证，是系统认证机制的核心组件。
 * 使用Auth0的java-jwt库实现，该库提供符合RFC 7519标准的JWT实现，
 * 支持HMAC-SHA256算法，确保令牌的完整性和不可篡改性。
 *
 * 核心职责：
 * 1. 生成包含用户信息的JWT令牌
 * 2. 验证令牌的有效性和完整性
 * 3. 解析令牌中的用户声明信息
 *
 * 安全特性：
 * - 使用HMAC-SHA256算法对令牌签名
 * - 支持令牌过期时间配置
 * - 验证发行者身份防止令牌伪造
 */
@Service
public class JwtTokenService {

    /**
     * HMAC-SHA256签名算法实例
     * 使用配置的密钥初始化，用于令牌签名和验证
     */
    private final Algorithm algorithm;

    /**
     * JWT验证器实例
     * 预配置的验证器，包含签名算法和发行者检查
     */
    private final JWTVerifier verifier;

    /**
     * 令牌有效期（毫秒）
     * 从配置文件中读取，支持不同环境的不同配置
     */
    private final long expiration;

    /**
     * 令牌发行者标识
     * 用于验证令牌的来源合法性
     */
    private final String issuer;

    /**
     * 构造函数 - 初始化JWT服务
     *
     * 职责：通过依赖注入获取配置参数，初始化签名算法和验证器
     *
     * 设计原因：
     * 1. 使用@Value注解从application.properties/yml注入配置，实现配置与代码分离，
     *    便于不同环境（开发、测试、生产）使用不同密钥和过期时间
     * 2. 在构造函数中一次性初始化algorithm和verifier，避免每次方法调用时重复创建，提升性能
     * 3. 使用JWT.require().withIssuer().build()构建验证器，确保只接受由本服务签发且发行者匹配的令牌，
     *    防止使用其他系统签发的令牌进行伪造攻击
     * 4. 使用HMAC256算法，在保证安全性的同时兼顾性能，适合服务端统一签发和验证的场景
     *
     * @param secret 用于HMAC签名的密钥，应从配置文件读取且生产环境使用强随机字符串
     * @param expiration 令牌有效期（毫秒），建议生产环境设置为较短时间（如1小时）
     * @param issuer 令牌发行者标识，应与配置中的应用名称一致
     */
    public JwtTokenService(
        @Value("${jwt.secret}") String secret,
        @Value("${jwt.expiration}") long expiration,
        @Value("${jwt.issuer}") String issuer
    ) {
        this.algorithm = Algorithm.HMAC256(secret);
        this.verifier = JWT.require(this.algorithm).withIssuer(issuer).build();
        this.expiration = expiration;
        this.issuer = issuer;
    }

    /**
     * 生成JWT认证令牌
     *
     * 职责：根据用户信息创建并签名JWT令牌，用于客户端后续请求的认证凭证
     *
     * 设计原因：
     * 1. 使用JWT.create()构建器模式，清晰定义令牌的各个声明字段
     * 2. withIssuer设置发行者，配合验证器确保令牌来源可信
     * 3. withSubject存储用户名（主体标识），是RFC 7519标准推荐的主要标识字段
     * 4. withClaim添加自定义声明（role、displayName），扩展令牌携带的信息，
     *    避免频繁查询数据库获取用户基本信息
     * 5. withIssuedAt和withExpiresAt设置时间戳，支持令牌的时效性验证，
     *    过期令牌自动失效，降低令牌被盗用的风险
     * 6. sign使用预初始化的algorithm签名，确保令牌内容未被篡改
     *
     * @param username 用户名，作为令牌主体(subject)，用于标识用户身份
     * @param role 用户角色，用于前端展示和权限控制的辅助信息
     * @param displayName 用户显示名称，用于前端界面展示
     * @return 签名后的JWT字符串，包含头部、载荷和签名三部分，用点号分隔
     */
    public String generateToken(String username, String role, String displayName) {
        Instant now = Instant.now();

        return JWT.create()
            .withIssuer(issuer)
            .withSubject(username)
            .withClaim("role", normalizeRole(role))
            .withClaim("displayName", displayName)
            .withIssuedAt(now)
            .withExpiresAt(now.plusMillis(expiration))
            .sign(algorithm);
    }

    /**
     * 验证JWT令牌
     *
     * 职责：校验令牌签名、过期时间和发行者，返回解析后的令牌对象
     *
     * 设计原因：
     * 1. 返回Optional<DecodedJWT>而非抛出异常，调用方可优雅处理验证失败情况，
     *    避免在过滤器中使用try-catch块，代码更简洁
     * 2. 使用预构建的verifier进行验证，自动执行以下检查：
     *    - 签名验证：确保令牌未被篡改
     *    - 过期检查：验证当前时间是否在过期时间之前
     *    - 发行者匹配：验证令牌中的iss字段与配置一致
     * 3. 捕获JWTVerificationException统一处理所有验证错误（签名错误、过期、格式错误等），
     *    简化错误处理逻辑，同时记录日志可供安全审计
     *
     * @param token 待验证的JWT字符串，通常从HTTP请求的Authorization头中提取
     * @return 验证成功返回包含解码信息的Optional，验证失败返回空Optional
     */
    public Optional<DecodedJWT> verify(String token) {
        try {
            return Optional.of(verifier.verify(token));
        } catch (JWTVerificationException ex) {
            return Optional.empty();
        }
    }

    /**
     * 规范化角色名称
     *
     * 职责：将角色字符串标准化为小写格式，处理空值情况
     *
     * 设计原因：
     * 1. 防御性编程：处理role为null或空字符串的情况，使用默认值"employee"确保系统健壮性
     * 2. 统一格式：将角色转换为小写，避免"ADMIN"和"admin"被视为不同角色，
     *    保证权限比较的一致性
     * 3. 去除首尾空白：防止用户输入时不小心添加空格导致匹配失败
     * 4. 私有方法：作为内部工具方法，不对外暴露，保持API简洁
     *
     * @param role 原始角色字符串，可能为null或包含空白字符
     * @return 规范化后的角色字符串，全小写且去除首尾空格，null/blank时返回"employee"
     */
    private String normalizeRole(String role) {
        if (role == null || role.isBlank()) {
            return "employee";
        }

        return role.trim().toLowerCase();
    }
}