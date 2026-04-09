/**
 * Spring Security安全配置类
 *
 * 设计说明：
 * 作为安全模块的核心配置类，集中管理整个应用的安全策略。
 * 采用Java Config方式替代XML配置，类型安全且易于版本控制。
 * 使用@EnableWebSecurity启用Spring Security的Web安全支持。
 *
 * 核心职责：
 * 1. 配置密码加密器，保障用户凭证安全存储
 * 2. 配置跨域资源共享(CORS)，支持前端跨域访问
 * 3. 配置安全过滤器链，定义认证授权规则
 *
 * 安全策略：
 * - 基于JWT的无状态认证机制
 * - 禁用CSRF（因使用Token而非Cookie认证）
 * - 细粒度的URL访问控制
 */
package com.oa.backend.config;

import com.oa.backend.security.JwtAuthenticationFilter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.http.HttpStatus;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.HttpStatusEntryPoint;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import jakarta.servlet.DispatcherType;
import java.util.Arrays;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity(prePostEnabled = true)
public class SecurityConfig {

    /**
     * 密码编码器Bean
     *
     * 职责：提供安全的密码哈希加密服务，用于用户注册和登录时的密码验证
     *
     * 设计原因：
     * 1. 选用BCryptPasswordEncoder是因为它使用BCrypt强哈希算法，自带salt，可有效抵御彩虹表攻击
     * 2. 工作因子默认为10，在安全性和性能间取得平衡（可根据硬件条件调整）
     * 3. 配置为Spring Bean便于在整个应用中统一注入使用，确保密码处理策略一致性
     *
     * @return BCryptPasswordEncoder实例，提供encode()和matches()方法
     */
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    /**
     * 跨域资源配置Bean
     *
     * 职责：配置CORS（跨域资源共享）策略，允许前端应用从不同的域名/端口访问后端API
     *
     * 设计原因：
     * 1. 前后端分离架构下，前端和后端运行在不同端口，必须通过CORS实现安全跨域
     * 2. 明确指定允许的源（localhost:4173/4174）而非使用通配符，遵循最小权限原则，防止未授权访问
     * 3. 允许携带凭证（cookies、authorization headers），支持需要身份验证的请求
     * 4. 显式列出允许的HTTP方法，限制不必要的请求类型，降低攻击面
     * 5. 使用UrlBasedCorsConfigurationSource统一应用到所有路径("/**")，确保策略一致性
     *
     * @return CORS配置源，供Spring Security过滤器链使用
     */
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(Arrays.asList(
            "http://localhost:3000", "http://127.0.0.1:3000",  // Nuxt H5 dev
            "http://localhost:4173", "http://127.0.0.1:4173",  // Vite preview
            "http://localhost:4174", "http://127.0.0.1:4174"   // Vite preview alt
        ));
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(Arrays.asList("*"));
        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    /**
     * 安全过滤器链配置Bean
     *
     * 职责：构建和配置Spring Security的过滤器链，定义所有HTTP请求的安全处理规则
     *
     * 设计原因：
     * 1. 采用无状态会话策略（STATELESS）：因使用JWT进行认证，服务端无需存储会话状态，
     *    支持水平扩展和微服务架构，避免分布式环境下的会话同步问题
     * 2. 禁用CSRF防护：JWT存储在客户端（如localStorage）而非Cookie中，天然免疫CSRF攻击，
     *    禁用可避免不必要的校验开销
     * 3. URL分层授权：
     *    - /auth/** 开放：允许未认证用户访问登录、注册等认证端点
     *    - /actuator/** 和 /health 开放：支持监控和健康检查，便于运维和容器编排
     *    - 其他所有请求需认证：保护业务接口，确保只有合法用户可访问
     * 4. JWT过滤器前置：将JwtAuthenticationFilter添加到UsernamePasswordAuthenticationFilter之前，
     *    确保每个请求先进行Token校验，再进入后续的认证流程
     *
     * @param http Spring Security配置构建器，用于链式配置安全选项
     * @param jwtAuthenticationFilter JWT认证过滤器，用于解析和验证Token
     * @return 构建完成的安全过滤器链
     * @throws Exception 配置过程中可能抛出的异常
     */
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http, JwtAuthenticationFilter jwtAuthenticationFilter) throws Exception {
        http
            .securityMatcher(request -> request.getDispatcherType() != DispatcherType.ERROR)
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .csrf(csrf -> csrf.disable())
            .sessionManagement(session ->
                session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/auth/**", "/actuator/**", "/health", "/setup/status", "/h2-console/**", "/test/**").permitAll()
                .requestMatchers("/setup/init", "/setup/reset-ceo-password").permitAll()
                .requestMatchers("/dev/**").permitAll()
                .anyRequest().authenticated()
            )
            .exceptionHandling(ex -> ex
                .authenticationEntryPoint(new HttpStatusEntryPoint(HttpStatus.UNAUTHORIZED))
            )
            .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}
