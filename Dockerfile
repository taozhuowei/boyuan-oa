# BOYUAN OA - Multi-stage Docker Build
# Stage 1: Build the application
FROM eclipse-temurin:21-jdk-alpine AS builder

WORKDIR /build

# Copy Gradle wrapper and build files
COPY gradlew build.gradle settings.gradle ./
COPY gradle/ ./gradle/

# Copy source code
COPY server/ ./server/

# Build the application (skip tests for faster build)
RUN ./gradlew :server:bootJar -x test --no-daemon

# Stage 2: Runtime image
FROM eclipse-temurin:21-jre-alpine

WORKDIR /app

# Create non-root user for security
RUN addgroup -S oa && adduser -S oa -G oa

# Copy the built JAR from builder stage
COPY --from=builder /build/server/build/libs/*.jar app.jar

# Change ownership to non-root user
RUN chown -R oa:oa /app

# Switch to non-root user
USER oa

# Expose application port
EXPOSE 8080

# Health check endpoint
HEALTHCHECK --interval=30s --timeout=3s --start-period=60s --retries=3 \
    CMD wget -qO- http://localhost:8080/actuator/health || exit 1

# Run the application with production profile
ENTRYPOINT ["java", "-Dspring.profiles.active=prod", "-jar", "app.jar"]
