#!/bin/bash
# BOYUAN OA Deployment Rollback Script
# Usage: OA_DEPLOY_DIR=/opt/boyuan-oa ./rollback.sh
# Make executable: chmod +x rollback.sh

set -euo pipefail

# Configuration
DEPLOY_DIR=${OA_DEPLOY_DIR:-/opt/boyuan-oa}
HEALTH_URL=${HEALTH_URL:-http://localhost:8080/actuator/health}
APP_JAR="$DEPLOY_DIR/app.jar"
PREV_JAR="$DEPLOY_DIR/app-previous.jar"
PID_FILE="$DEPLOY_DIR/app.pid"
LOG_FILE="$DEPLOY_DIR/app.log"
VERSION_FILE="$DEPLOY_DIR/VERSION"

echo "[$(date)] Starting rollback..."

# Check if previous version exists
if [[ ! -f "$PREV_JAR" ]]; then
    echo "[$(date)] Error: No previous version to roll back to"
    exit 1
fi

# Stop running process
if [[ -f "$PID_FILE" ]]; then
    CURRENT_PID=$(cat "$PID_FILE" 2>/dev/null || true)
    if [[ -n "$CURRENT_PID" ]] && kill -0 "$CURRENT_PID" 2>/dev/null; then
        echo "[$(date)] Stopping current process (PID: $CURRENT_PID)..."
        kill "$CURRENT_PID" || true
        # Wait for graceful shutdown
        for i in {1..30}; do
            if ! kill -0 "$CURRENT_PID" 2>/dev/null; then
                break
            fi
            sleep 1
        done
        # Force kill if necessary
        if kill -0 "$CURRENT_PID" 2>/dev/null; then
            echo "[$(date)] Force killing process..."
            kill -9 "$CURRENT_PID" || true
        fi
    fi
fi

# Restore previous version
echo "[$(date)] Restoring previous version..."
mv "$PREV_JAR" "$APP_JAR"

# Start rolled back version
echo "[$(date)] Starting rolled back version..."
nohup java -jar -Dspring.profiles.active=prod "$APP_JAR" > "$LOG_FILE" 2>&1 &
ROLLBACK_PID=$!
echo "$ROLLBACK_PID" > "$PID_FILE"
echo "[$(date)] Rollback process started with PID: $ROLLBACK_PID"

# Health check
echo "[$(date)] Performing health check on rolled back version..."
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
    echo "[$(date)] Rollback successful"
    # Update version file to indicate rollback
    echo "rolled-back-$(date +%Y%m%d-%H%M%S)" > "$VERSION_FILE"
else
    echo "[$(date)] CRITICAL: Rollback health check also failed. Manual intervention required."
    exit 2
fi
