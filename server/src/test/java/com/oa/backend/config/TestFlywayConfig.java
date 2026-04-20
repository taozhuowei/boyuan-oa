package com.oa.backend.config;

import org.springframework.boot.autoconfigure.flyway.FlywayMigrationStrategy;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Test-only Flyway strategy: clean the schema before every migration run.
 * Placed in src/test/java so it never ships in production JARs.
 * The @Configuration annotation ensures Spring picks it up via component scan
 * under com.oa.backend when @SpringBootTest starts the full application context.
 */
@Configuration
public class TestFlywayConfig {

  @Bean
  public FlywayMigrationStrategy cleanBeforeMigrateStrategy() {
    return flyway -> {
      flyway.clean();
      flyway.migrate();
    };
  }
}
