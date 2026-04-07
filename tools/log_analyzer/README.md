# OA Log Analyzer

Independent Python GUI tool for analyzing OA system structured JSON logs. Designed for deployment personnel only — requires `OA_DEPLOY_KEY` to run.

## Features

- Paste log text directly or drag-and-drop `.log` / `.txt` files onto the input area
- Filter by: `trace_id`, log level (`DEBUG/INFO/WARN/ERROR`), module name, time range
- Output file:line pointers for rapid problem diagnosis (e.g., `PayrollController.java:247 — settle()`)
- Colour-coded output: ERROR = red, WARN = orange
- Summary bar: total entries, error count, unique trace IDs, modules involved

## Prerequisites

- Python 3.10 or later (standard `tkinter` is included)
- `OA_DEPLOY_KEY` environment variable (minimum 16 characters)

## Setup

```bash
# Install optional drag-and-drop support
pip install -r requirements.txt

# Set the deploy key (do NOT commit the actual key)
cp .env.example .env
# Edit .env and set OA_DEPLOY_KEY

# Load .env (Linux/macOS)
export $(cat .env | xargs)

# Load .env (Windows PowerShell)
Get-Content .env | ForEach-Object { $parts = $_ -split '=', 2; [System.Environment]::SetEnvironmentVariable($parts[0], $parts[1]) }
```

## Run

```bash
python analyzer.py
```

The tool refuses to start without `OA_DEPLOY_KEY`.

## Log Format

The OA system emits newline-delimited JSON logs (see `ARCHITECTURE.md §13.2`). Each line:

```json
{
  "timestamp":   "2026-04-07T14:23:01.234Z",
  "level":       "ERROR",
  "trace_id":    "a3f8c2d1-xxxx-xxxx-xxxx",
  "module":      "payroll",
  "operation":   "payroll.cycle.settle",
  "user_id":     "emp-001",
  "role":        "finance",
  "class":       "PayrollController",
  "method":      "settle",
  "file":        "PayrollController.java",
  "line":        247,
  "duration_ms": 312,
  "status":      500,
  "message":     "Settle failed: duplicate slip",
  "error":       "java.sql.BatchUpdateException: ..."
}
```

Plain-text lines are displayed as-is without filtering.

## Security Notes

- `OA_DEPLOY_KEY` is never stored in source code. Obtain it from the deployment engineer.
- Do not share log files externally — they may contain employee IDs and operation details.
- This tool runs entirely locally; no data is sent to any remote server.
