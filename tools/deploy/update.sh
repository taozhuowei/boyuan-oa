#!/bin/bash
# BOYUAN OA Deployment Update Script
# Usage: OA_DEPLOY_DIR=/opt/boyuan-oa ./update.sh
# Make executable: chmod +x update.sh

set -euo pipefail

# Configuration
DEPLOY_DIR=${OA_DEPLOY_DIR:-/opt/boyuan-oa}
HEALTH_URL=${HEALTH_URL:-http://localhost:8080/actuator/health}
APP_JAR="$DEPLOY_DIR/app.jar"
PREV_JAR="$DEPLOY_DIR/app-previous.jar"
NEW_JAR="$DEPLOY_DIR/app-new.jar"
PID_FILE="$DEPLOY_DIR/app.pid"
LOG_FILE="$DEPLOY_DIR/app.log"
VERSION_FILE="$DEPLOY_DIR/VERSION"
VERSION_NEW_FILE="$DEPLOY_DIR/VERSION.new"

# Get new version
NEW_VERSION=$(cat "$VERSION_NEW_FILE" 2>/dev/null || echo 'unknown')

echo "[$(date)] Starting deployment of version: $NEW_VERSION"

# Check if new jar exists
if [[ ! -f "$NEW_JAR" ]]; then
    echo "Error: New jar file not found at $NEW_JAR"
    exit 1
fi

# Backup current version if it exists
if [[ -f "$APP_JAR" ]]; then
    echo "[$(date)] Backing up current version..."
    cp "$APP_JAR" "$PREV_JAR"
fi

# Deploy new version
echo "[$(date)] Deploying new version..."
mv "$NEW_JAR" "$APP_JAR"

# Stop existing process if running
if [[ -f "$PID_FILE" ]]; then
    OLD_PID=$(cat "$PID_FILE" 2>/dev/null || true)
    if [[ -n "$OLD_PID" ]] && kill -0 "$OLD_PID" 2>/dev/null; then
        echo "[$(date)] Stopping existing process (PID: $OLD_PID)..."
        kill "$OLD_PID" || true
        # Wait for process to stop
        for i in {1..30}; do
            if ! kill -0 "$OLD_PID" 2>/dev/null; then
                break
            fi
            sleep 1
        done
        # Force kill if still running
        if kill -0 "$OLD_PID" 2>/dev/null; then
            echo "[$(date)] Force killing process..."
            kill -9 "$OLD_PID" || true
        fi
    fi
fi

# Start new process
echo "[$(date)] Starting new process..."
nohup java -jar -Dspring.profiles.active=prod "$APP_JAR" > "$LOG_FILE" 2>&1 &
NEW_PID=$!
echo "$NEW_PID" > "$PID_FILE"
echo "[$(date)] Process started with PID: $NEW_PID"

# Health check
echo "[$(date)] Performing health check..."
HEALTH_CHECK_PASSED=false
for i in {1..30}; do
    sleep 2
    if curl -sf "$HEALTH_URL" > /dev/null 2>&1; then
        HEALTH_CHECK_PASSED=true
        break
    fi
    echo "[$(date)] Health check attempt $i/30 failed, retrying..."
done

if [[ "$HEALTH_CHECK_PASSED" == true ]]; then
    echo "[$(date)] Health check passed!"
    echo "$NEW_VERSION" > "$VERSION_FILE"
    rm -f "$VERSION_NEW_FILE"
    echo "[$(date)] Deploy success (version: $NEW_VERSION)"
else
    echo "[$(date)] Health check failed after 30 attempts, rolling back..."
    # shellcheck source=/dev/null
    source "$(dirname "$0")/rollback.sh" || true
    exit 1
fi
