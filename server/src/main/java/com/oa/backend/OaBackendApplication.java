/**
 * 办公自动化系统后端主应用类
 *
 * <p>设计说明： 作为Spring Boot应用的入口点，负责引导整个应用程序的启动过程。 使用@SpringBootApplication组合注解自动启用组件扫描、自动配置和配置属性支持，
 * 遵循Spring Boot的约定优于配置原则，简化应用初始化和部署流程。
 *
 * <p>职责： 1. 初始化Spring应用上下文 2. 加载所有配置类和组件 3. 启动嵌入式Web服务器
 */
package com.oa.backend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableAsync
@EnableScheduling
public class OaBackendApplication {
  /**
   * 应用程序主入口方法
   *
   * <p>职责：启动Spring Boot应用，初始化整个应用环境
   *
   * <p>设计原因： 1. 使用SpringApplication.run()作为标准启动方式，确保所有自动配置和Bean初始化按顺序执行 2.
   * 将当前类作为配置源传入，使Spring能够扫描同级及子包下的所有组件 3. 接收命令行参数args，支持外部化配置（如指定profile、端口等），增强部署灵活性
   *
   * @param args 命令行参数，可用于运行时配置覆盖
   */
  public static void main(String[] args) {
    SpringApplication.run(OaBackendApplication.class, args);
  }
}
