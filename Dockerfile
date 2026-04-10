# BOYUAN OA - Multi-stage Docker Build
# Stage 1: Build the application
FROM eclipse-temurin:21-jdk-alpine AS builder

WORKDIR /build

# Copy Maven wrapper and source
COPY server/pom.xml ./server/pom.xml
COPY server/.mvn ./server/.mvn
COPY server/mvnw ./server/mvnw
COPY server/src ./server/src

# Build the application (skip tests for faster build)
RUN ./server/mvnw -f server/pom.xml package -DskipTests --no-transfer-progress

# Stage 2: Runtime image
FROM eclipse-temurin:21-jre-alpine

WORKDIR /app

# Create non-root user for security
RUN addgroup -S oa && adduser -S oa -G oa

# Copy the built JAR from builder stage
COPY --from=builder /build/server/target/*.jar app.jar

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
