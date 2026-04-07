"""
OA Log Analyzer
Purpose: Parse structured JSON log files from OA system, filter by trace_id/time/level/module,
         output file:line pointers for rapid problem diagnosis.
Auth:    Reads OA_DEPLOY_KEY from environment. Refuses to run without it.
Usage:   Run directly (python analyzer.py) for GUI mode, or import as module.
"""

import json
import os
import re
import tkinter as tk
from tkinter import ttk, messagebox, scrolledtext, filedialog
from datetime import datetime
from typing import Optional

# ─────────────────────────────────────────
# Auth: require OA_DEPLOY_KEY env variable
# ─────────────────────────────────────────
_DEPLOY_KEY = os.environ.get("OA_DEPLOY_KEY", "")

# Support tkinterdnd2 for drag-and-drop; fall back gracefully if not installed
try:
    from tkinterdnd2 import TkinterDnD, DND_FILES
    _DND_AVAILABLE = True
except ImportError:
    _DND_AVAILABLE = False


def _verify_key(key: str) -> bool:
    """Check OA_DEPLOY_KEY. Must be non-empty and at least 16 chars."""
    return bool(key) and len(key) >= 16


# ─────────────────────────────────────────
# Core parsing logic (no UI dependency)
# ─────────────────────────────────────────

def parse_log_text(raw_text: str) -> list[dict]:
    """
    Parse newline-delimited JSON log text.
    Returns list of parsed log entries (skips non-JSON lines silently).
    """
    entries = []
    for line in raw_text.splitlines():
        line = line.strip()
        if not line:
            continue
        try:
            obj = json.loads(line)
            # Normalize: ensure all expected fields exist with defaults
            obj.setdefault("timestamp", "")
            obj.setdefault("level", "INFO")
            obj.setdefault("trace_id", "")
            obj.setdefault("module", "")
            obj.setdefault("operation", "")
            obj.setdefault("user_id", "")
            obj.setdefault("role", "")
            obj.setdefault("class", "")
            obj.setdefault("method", "")
            obj.setdefault("file", "")
            obj.setdefault("line", 0)
            obj.setdefault("duration_ms", None)
            obj.setdefault("status", None)
            obj.setdefault("message", "")
            obj.setdefault("error", None)
            entries.append(obj)
        except json.JSONDecodeError:
            # Plain-text log line: wrap it
            entries.append({"_raw": line, "level": "RAW", "timestamp": "", "trace_id": "",
                            "module": "", "file": "", "line": 0, "message": line, "error": None})
    return entries


def filter_entries(
    entries: list[dict],
    trace_id: str = "",
    level: str = "",
    module: str = "",
    time_from: str = "",
    time_to: str = "",
) -> list[dict]:
    """Filter log entries by optional criteria."""
    result = []
    for e in entries:
        if trace_id and trace_id.lower() not in e.get("trace_id", "").lower():
            continue
        if level and e.get("level", "") != level.upper():
            continue
        if module and module.lower() not in e.get("module", "").lower():
            continue
        ts = e.get("timestamp", "")
        if time_from and ts and ts < time_from:
            continue
        if time_to and ts and ts > time_to:
            continue
        result.append(e)
    return result


def format_entry(e: dict) -> str:
    """Format a single log entry as a readable line."""
    if e.get("level") == "RAW":
        return f"  [RAW] {e.get('message', '')}"

    ts = e.get("timestamp", "")[:23].replace("T", " ")  # trim to milliseconds
    level = e.get("level", "INFO")
    module = e.get("module", "-")
    file_ref = e.get("file", "")
    line_num = e.get("line", 0)
    method = e.get("method", "")
    duration = e.get("duration_ms")
    status = e.get("status")
    msg = e.get("message", "")
    error = e.get("error")

    # Build location pointer: Module.java:line — method()
    location = ""
    if file_ref and line_num:
        location = f"{file_ref}:{line_num}"
        if method:
            location += f" — {method}()"
    elif file_ref:
        location = file_ref

    # Suffix: duration, HTTP status
    suffix_parts = []
    if duration is not None:
        suffix_parts.append(f"{duration}ms")
    if status is not None:
        suffix_parts.append(f"HTTP {status}")
    suffix = "  " + " | ".join(suffix_parts) if suffix_parts else ""

    line_out = f"[{ts}] {level:<5} [{module}] {location}{suffix}"
    if msg:
        line_out += f"\n  {msg}"
    if error:
        # Indent error block
        error_lines = str(error).splitlines()
        line_out += "\n  ERROR: " + "\n    ".join(error_lines)
    return line_out


def build_summary(entries: list[dict]) -> str:
    """Build a quick summary: entry count, error count, unique trace_ids."""
    total = len(entries)
    errors = sum(1 for e in entries if e.get("level") in ("ERROR", "WARN"))
    trace_ids = {e.get("trace_id") for e in entries if e.get("trace_id")}
    modules = {e.get("module") for e in entries if e.get("module")}
    return (
        f"Total entries: {total}  |  WARN/ERROR: {errors}  |  "
        f"Trace IDs: {len(trace_ids)}  |  Modules: {', '.join(sorted(modules)) or '-'}"
    )


# ─────────────────────────────────────────
# GUI
# ─────────────────────────────────────────

class LogAnalyzerApp:
    """
    Main GUI window.
    - Paste log text into the left TextArea, or drag-and-drop a .log file
    - Filter by trace_id / level / module / time range
    - Results shown in right TextArea with file:line pointers
    """

    def __init__(self, root: tk.Tk):
        self.root = root
        self.root.title("OA Log Analyzer")
        self.root.geometry("1300x780")
        self.root.resizable(True, True)

        self._all_entries: list[dict] = []
        self._build_ui()

    def _build_ui(self):
        """Build the UI layout."""
        root = self.root

        # ── Top toolbar: filters ──────────────────────────────────────────
        toolbar = tk.Frame(root, pady=6, padx=8)
        toolbar.pack(side=tk.TOP, fill=tk.X)

        tk.Label(toolbar, text="Trace ID:").pack(side=tk.LEFT)
        self._trace_var = tk.StringVar()
        tk.Entry(toolbar, textvariable=self._trace_var, width=36).pack(side=tk.LEFT, padx=(2, 10))

        tk.Label(toolbar, text="Level:").pack(side=tk.LEFT)
        self._level_var = tk.StringVar(value="")
        ttk.Combobox(toolbar, textvariable=self._level_var,
                     values=["", "DEBUG", "INFO", "WARN", "ERROR"], width=8, state="readonly"
                     ).pack(side=tk.LEFT, padx=(2, 10))

        tk.Label(toolbar, text="Module:").pack(side=tk.LEFT)
        self._module_var = tk.StringVar()
        tk.Entry(toolbar, textvariable=self._module_var, width=14).pack(side=tk.LEFT, padx=(2, 10))

        tk.Label(toolbar, text="From (ISO):").pack(side=tk.LEFT)
        self._from_var = tk.StringVar()
        tk.Entry(toolbar, textvariable=self._from_var, width=20).pack(side=tk.LEFT, padx=(2, 6))

        tk.Label(toolbar, text="To:").pack(side=tk.LEFT)
        self._to_var = tk.StringVar()
        tk.Entry(toolbar, textvariable=self._to_var, width=20).pack(side=tk.LEFT, padx=(2, 10))

        tk.Button(toolbar, text="Analyze", command=self._on_analyze, bg="#003466", fg="white",
                  padx=10).pack(side=tk.LEFT, padx=(0, 6))
        tk.Button(toolbar, text="Clear", command=self._on_clear).pack(side=tk.LEFT, padx=(0, 6))
        tk.Button(toolbar, text="Load File...", command=self._on_load_file).pack(side=tk.LEFT)

        # ── Status bar ────────────────────────────────────────────────────
        self._status_var = tk.StringVar(value="Ready. Paste log text or drag a .log file.")
        tk.Label(root, textvariable=self._status_var, anchor="w", relief=tk.SUNKEN,
                 padx=6).pack(side=tk.BOTTOM, fill=tk.X)

        # ── Main split pane ───────────────────────────────────────────────
        pane = tk.PanedWindow(root, orient=tk.HORIZONTAL, sashwidth=6)
        pane.pack(fill=tk.BOTH, expand=True, padx=8, pady=(0, 4))

        # Left: raw log input
        left_frame = tk.LabelFrame(pane, text="Raw Log Input  (paste here, or drag & drop .log file)")
        pane.add(left_frame, width=540)

        self._input_text = scrolledtext.ScrolledText(left_frame, wrap=tk.NONE, font=("Consolas", 9))
        self._input_text.pack(fill=tk.BOTH, expand=True)

        # Right: parsed results
        right_frame = tk.LabelFrame(pane, text="Analysis Results")
        pane.add(right_frame, width=700)

        self._output_text = scrolledtext.ScrolledText(right_frame, wrap=tk.NONE, font=("Consolas", 9),
                                                       state=tk.DISABLED)
        self._output_text.pack(fill=tk.BOTH, expand=True)

        # Colour tags for output
        self._output_text.tag_config("error_line", foreground="red")
        self._output_text.tag_config("warn_line", foreground="orange")
        self._output_text.tag_config("info_line", foreground="black")
        self._output_text.tag_config("summary_line", foreground="navy", font=("Consolas", 9, "bold"))

        # Drag-and-drop support
        if _DND_AVAILABLE:
            self._input_text.drop_target_register(DND_FILES)
            self._input_text.dnd_bind("<<Drop>>", self._on_drop)
            left_frame.config(text="Raw Log Input  (paste here, or drag & drop .log file ✓)")

    # ── Event handlers ────────────────────────────────────────────────────

    def _on_drop(self, event):
        """Handle file drop onto input area."""
        path = event.data.strip().strip("{}")  # tkinterdnd2 wraps paths with braces on Windows
        self._load_file_path(path)

    def _on_load_file(self):
        """Open file dialog to load a log file."""
        path = filedialog.askopenfilename(
            title="Open log file",
            filetypes=[("Log files", "*.log *.txt *.json"), ("All files", "*.*")]
        )
        if path:
            self._load_file_path(path)

    def _load_file_path(self, path: str):
        try:
            with open(path, encoding="utf-8", errors="replace") as f:
                content = f.read()
            self._input_text.delete("1.0", tk.END)
            self._input_text.insert(tk.END, content)
            self._status_var.set(f"Loaded: {path}  ({len(content):,} chars)")
        except Exception as exc:
            messagebox.showerror("Error", f"Failed to load file:\n{exc}")

    def _on_clear(self):
        self._input_text.delete("1.0", tk.END)
        self._set_output("")
        self._all_entries = []
        self._status_var.set("Cleared.")

    def _on_analyze(self):
        raw = self._input_text.get("1.0", tk.END)
        if not raw.strip():
            messagebox.showinfo("No input", "Please paste log text or load a log file first.")
            return

        self._all_entries = parse_log_text(raw)
        filtered = filter_entries(
            self._all_entries,
            trace_id=self._trace_var.get().strip(),
            level=self._level_var.get().strip(),
            module=self._module_var.get().strip(),
            time_from=self._from_var.get().strip(),
            time_to=self._to_var.get().strip(),
        )

        summary = build_summary(filtered)
        lines = [("─" * 80 + "\n", "summary_line"),
                 (summary + "\n", "summary_line"),
                 ("─" * 80 + "\n\n", "summary_line")]

        for e in filtered:
            text = format_entry(e) + "\n\n"
            level = e.get("level", "INFO")
            tag = "error_line" if level == "ERROR" else ("warn_line" if level == "WARN" else "info_line")
            lines.append((text, tag))

        self._set_output_tagged(lines)
        self._status_var.set(f"Parsed {len(self._all_entries)} entries, showing {len(filtered)}. {summary}")

    def _set_output(self, text: str):
        self._output_text.config(state=tk.NORMAL)
        self._output_text.delete("1.0", tk.END)
        self._output_text.insert(tk.END, text)
        self._output_text.config(state=tk.DISABLED)

    def _set_output_tagged(self, tagged_lines: list[tuple[str, str]]):
        self._output_text.config(state=tk.NORMAL)
        self._output_text.delete("1.0", tk.END)
        for text, tag in tagged_lines:
            self._output_text.insert(tk.END, text, tag)
        self._output_text.config(state=tk.DISABLED)


# ─────────────────────────────────────────
# Entry point
# ─────────────────────────────────────────

def main():
    # Auth gate
    if not _verify_key(_DEPLOY_KEY):
        # Show error dialog before any main window
        err_root = tk.Tk()
        err_root.withdraw()
        messagebox.showerror(
            "Authentication Required",
            "OA_DEPLOY_KEY environment variable is not set or too short.\n\n"
            "This tool requires the deployment key to run.\n"
            "Please set the OA_DEPLOY_KEY environment variable and try again."
        )
        err_root.destroy()
        raise SystemExit(1)

    if _DND_AVAILABLE:
        root = TkinterDnD.Tk()
    else:
        root = tk.Tk()

    app = LogAnalyzerApp(root)
    root.mainloop()


if __name__ == "__main__":
    main()
