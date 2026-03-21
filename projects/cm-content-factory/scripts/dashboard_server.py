#!/usr/bin/env python3
"""
Dashboard Server — HTTP server with SSE for Content Factory dashboard.

Serves the dashboard UI and provides API endpoints for state, logs, and events.
Zero external dependencies — uses Python stdlib only.

Usage:
    python3 scripts/dashboard_server.py                     # Start on port 5050
    python3 scripts/dashboard_server.py --port 8080         # Custom port
    python3 scripts/dashboard_server.py --no-open           # Don't open browser
"""

import json
import os
import sys
import time
import queue
import signal
import argparse
import threading
import webbrowser
from pathlib import Path
from http.server import HTTPServer, SimpleHTTPRequestHandler
from datetime import datetime

SCRIPT_DIR = Path(__file__).resolve().parent
SKILL_DIR = SCRIPT_DIR.parent
DASHBOARD_DIR = SKILL_DIR / "dashboard"
PROJECT_ROOT = Path(os.getcwd()).resolve()
STATE_FILE = PROJECT_ROOT / ".content-factory-state.json"
EVENTS_FILE = PROJECT_ROOT / "logs" / "events.jsonl"
TOKEN_FILE = PROJECT_ROOT / "logs" / "token_usage.json"

# SSE clients queue
sse_clients: list[queue.Queue] = []
sse_lock = threading.Lock()


def broadcast_event(event_type: str, data: dict):
    """Send SSE event to all connected clients."""
    msg = f"event: {event_type}\ndata: {json.dumps(data, ensure_ascii=False)}\n\n"
    with sse_lock:
        dead = []
        for q in sse_clients:
            try:
                q.put_nowait(msg)
            except queue.Full:
                dead.append(q)
        for q in dead:
            sse_clients.remove(q)


class DashboardHandler(SimpleHTTPRequestHandler):
    """Custom handler for dashboard API + static files."""

    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(DASHBOARD_DIR), **kwargs)

    def do_GET(self):
        if self.path == "/api/state":
            self._serve_json_file(STATE_FILE)
        elif self.path == "/api/tokens":
            self._serve_json_file(TOKEN_FILE)
        elif self.path.startswith("/api/logs"):
            self._serve_logs()
        elif self.path == "/api/events":
            self._serve_sse()
        else:
            # Serve static files from dashboard/
            super().do_GET()

    def _serve_json_file(self, filepath: Path):
        """Serve a JSON file."""
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Cache-Control", "no-cache")
        self.end_headers()

        if filepath.exists():
            with open(filepath, "r", encoding="utf-8") as f:
                self.wfile.write(f.read().encode("utf-8"))
        else:
            self.wfile.write(b'{"status":"no_data"}')

    def _serve_logs(self):
        """Serve recent events from JSONL log."""
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Cache-Control", "no-cache")
        self.end_headers()

        events = []
        if EVENTS_FILE.exists():
            try:
                with open(EVENTS_FILE, "r", encoding="utf-8") as f:
                    lines = f.readlines()
                for line in lines[-200:]:
                    line = line.strip()
                    if line:
                        try:
                            events.append(json.loads(line))
                        except json.JSONDecodeError:
                            pass
            except IOError:
                pass

        self.wfile.write(json.dumps(events, ensure_ascii=False).encode("utf-8"))

    def _serve_sse(self):
        """Serve SSE event stream."""
        self.send_response(200)
        self.send_header("Content-Type", "text/event-stream")
        self.send_header("Cache-Control", "no-cache")
        self.send_header("Connection", "keep-alive")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()

        client_queue = queue.Queue(maxsize=100)
        with sse_lock:
            sse_clients.append(client_queue)

        try:
            # Send initial state
            if STATE_FILE.exists():
                with open(STATE_FILE, "r", encoding="utf-8") as f:
                    data = f.read()
                msg = f"event: state\ndata: {data}\n\n"
                self.wfile.write(msg.encode("utf-8"))
                self.wfile.flush()

            while True:
                try:
                    msg = client_queue.get(timeout=15)
                    self.wfile.write(msg.encode("utf-8"))
                    self.wfile.flush()
                except queue.Empty:
                    # Send keepalive
                    self.wfile.write(b":keepalive\n\n")
                    self.wfile.flush()
        except (BrokenPipeError, ConnectionResetError, OSError):
            pass
        finally:
            with sse_lock:
                if client_queue in sse_clients:
                    sse_clients.remove(client_queue)

    def log_message(self, format, *args):
        """Suppress default logging for cleaner output."""
        if "/api/" in str(args[0]):
            return
        super().log_message(format, *args)


class FileWatcher(threading.Thread):
    """Watch state file for changes and broadcast via SSE."""

    def __init__(self, filepath: Path, interval: float = 1.0):
        super().__init__(daemon=True)
        self.filepath = filepath
        self.interval = interval
        self._last_mtime = 0
        self._stop = threading.Event()

    def run(self):
        while not self._stop.is_set():
            try:
                if self.filepath.exists():
                    mtime = self.filepath.stat().st_mtime
                    if mtime > self._last_mtime:
                        self._last_mtime = mtime
                        with open(self.filepath, "r", encoding="utf-8") as f:
                            data = json.load(f)
                        broadcast_event("state", data)
            except (IOError, json.JSONDecodeError):
                pass
            self._stop.wait(self.interval)

    def stop(self):
        self._stop.set()


def main():
    parser = argparse.ArgumentParser(description="Content Factory Dashboard Server")
    parser.add_argument("--port", type=int, default=5050, help="Server port (default: 5050)")
    parser.add_argument("--no-open", action="store_true", help="Don't auto-open browser")
    args = parser.parse_args()

    if not DASHBOARD_DIR.exists():
        print(f"❌ Dashboard not found: {DASHBOARD_DIR}")
        sys.exit(1)

    # Start file watcher for SSE
    watcher = FileWatcher(STATE_FILE)
    watcher.start()

    # Create server
    server = HTTPServer(("0.0.0.0", args.port), DashboardHandler)
    url = f"http://localhost:{args.port}"

    def shutdown(sig, frame):
        print(f"\n🛑 Shutting down dashboard server...")
        watcher.stop()
        server.shutdown()

    signal.signal(signal.SIGINT, shutdown)
    signal.signal(signal.SIGTERM, shutdown)

    print(f"\n{'═' * 50}")
    print(f"  🏭 Content Factory Dashboard")
    print(f"  🌐 {url}")
    print(f"  📂 Project: {PROJECT_ROOT.name}")
    print(f"  Press Ctrl+C to stop")
    print(f"{'═' * 50}\n")

    if not args.no_open:
        threading.Timer(1.0, lambda: webbrowser.open(url)).start()

    server.serve_forever()


if __name__ == "__main__":
    main()
