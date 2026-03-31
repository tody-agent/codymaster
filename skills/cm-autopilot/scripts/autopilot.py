#!/usr/bin/env python3
"""
AutoPilot CLI — Conversational Interface for Cody Master Skills

This is a Claude Code-style interactive CLI. It talks to the user,
understands their goals, creates a plan, and then parallelizes
tasks into the Agent Dispatcher (queue) while launching the Visual
Dashboard for easy tracking.
"""

import sys
import time
import os
import subprocess
import threading
from pathlib import Path

# Add cm-content-factory to sys.path to reuse the dispatcher and state manager
SKILLS_DIR = Path(__file__).resolve().parent.parent.parent
CF_SCRIPTS = SKILLS_DIR / "cm-content-factory" / "scripts"
sys.path.append(str(CF_SCRIPTS))

try:
    from agent_dispatcher import AgentDispatcher
    from state_manager import StateManager
    from rich.console import Console
    from rich.markdown import Markdown
    from rich.panel import Panel
    from rich.prompt import Prompt
    from rich.progress import Progress, SpinnerColumn, TextColumn
except ImportError:
    print("Please install requirements: pip install rich prompt_toolkit")
    sys.exit(1)

console = Console()
project_root = Path(os.getcwd()).resolve()

dispatcher = AgentDispatcher(str(project_root))
state_mgr = StateManager(str(project_root))

DASHBOARD_PROCESS = None

def start_dashboard():
    """Starts the cm-content-factory dashboard server in the background."""
    global DASHBOARD_PROCESS
    dashboard_script = CF_SCRIPTS / "dashboard_server.py"
    if dashboard_script.exists():
        DASHBOARD_PROCESS = subprocess.Popen(
            [sys.executable, str(dashboard_script), "--port", "5050", "--no-open"],
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL
        )
        return True
    return False

def show_welcome():
    console.print(Panel.fit(
        "[bold cyan]🚀 Welcome to Cody Master AutoPilot[/bold cyan]\n"
        "[dim]Your conversational AI orchestrator.[/dim]\n\n"
        "Tell me what you want to achieve, and I will plan, split,\n"
        "and execute parallel tasks for you. No technical skills required.",
        title="AutoPilot v1.0", border_style="cyan"
    ))

def mock_llm_task_parser(prompt: str) -> list:
    """
    Mock parser that simulates an LLM breaking down a user request 
    into parallel tasks based on keywords.
    """
    tasks = []
    lower_prompt = prompt.lower()
    
    if "dịch" in lower_prompt or "translate" in lower_prompt:
        # Example: Dịch 5 bài báo
        count = 5
        for w in lower_prompt.split():
            if w.isdigit():
                count = int(w)
                break
        for i in range(1, count + 1):
            tasks.append({
                "id": f"translate-{int(time.time()*100)}-{i}",
                "type": "translate",
                "meta": {"file": f"article_{i}.txt", "target_lang": "en"}
            })
    elif "research" in lower_prompt or "tìm hiểu" in lower_prompt:
        tasks.append({"id": f"res-1", "type": "research", "meta": {"topic": "Market Trends"}})
        tasks.append({"id": f"res-2", "type": "research", "meta": {"topic": "Competitors"}})
        tasks.append({"id": f"res-3", "type": "research", "meta": {"topic": "Keywords"}})
    else:
        # Generic fallback
        tasks.append({"id": f"task-1", "type": "general", "meta": {"instruction": prompt}})
        tasks.append({"id": f"task-2", "type": "general", "meta": {"instruction": "Review output"}})
        
    return tasks

def background_worker(worker_id: str):
    """A simple worker loop simulating parallel execution of tasks."""
    state_mgr.register_agent(worker_id, "autopilot_worker")
    while True:
        task = dispatcher.claim_next(worker_id)
        if not task:
            time.sleep(2)
            continue
        
        # Log active phase
        phase_map = {"translate": "write", "research": "extract", "general": "plan"}
        phase = phase_map.get(task["type"], "write")
        state_mgr.update_phase(phase, "running", progress=0.1)
        state_mgr.add_task(task["id"], "running", task["meta"])
        
        # Simulate work
        dispatcher.heartbeat(worker_id, task["id"])
        time.sleep(3) # Heavy work
        
        state_mgr.add_task(task["id"], "done", task["meta"])
        dispatcher.complete(task["id"], worker_id, {"result": "success"})
        state_mgr.log_event("info", f"[{worker_id}] Completed task: {task['id']}")
        
        # Check if phase done
        q = dispatcher.get_queue()
        if q["queued"] == 0 and q["claimed"] == 0:
            state_mgr.update_phase(phase, "done", progress=1.0)

def main_loop():
    # Reset queue and state for fresh start
    dispatcher.reset()
    state_mgr.reset()
    
    # Start dashboard
    if start_dashboard():
        state_mgr.log_event("info", "Dashboard Server started on port 5050")
    
    # Start background workers (simulating multiple parallel agents)
    for i in range(3):
        t = threading.Thread(target=background_worker, args=(f"worker-{i+1}",), daemon=True)
        t.start()
        
    try:
        while True:
            user_input = Prompt.ask("\n[bold green]You[/bold green]")
            if user_input.lower() in ("exit", "quit", "q"):
                break
            
            if not user_input.strip():
                continue
                
            with Progress(
                SpinnerColumn(), 
                TextColumn("[progress.description]{task.description}"), 
                transient=True
            ) as progress:
                progress.add_task("Thinking and Planning...", total=None)
                time.sleep(1.5) # Simulate LLM thinking
                tasks = mock_llm_task_parser(user_input)
                
            console.print(f"[bold blue]AutoPilot:[/bold blue] I've analyzed your request and created [bold]{len(tasks)}[/bold] parallel tasks.")
            
            # Queue them
            dispatcher.enqueue_batch(tasks)
            for t in tasks:
                state_mgr.add_task(t["id"], "queued", t["meta"])
                
            console.print("[dim]Tasks have been dispatched to the worker queue.[/dim]")
            console.print(f"👉 [bold magenta]Watch live progress at: http://localhost:5050[/bold magenta]")
            
            # Simple live status wait
            with Progress() as pb:
                task_pb = pb.add_task("Executing Pipeline...", total=len(tasks))
                while True:
                    q = dispatcher.get_queue()
                    completed = q["done"] + q["failed"]
                    pb.update(task_pb, completed=completed)
                    
                    if completed >= len(tasks):
                        break
                    time.sleep(1)
                    
            console.print("\n[bold green]✅ All tasks completed successfully![/bold green]")
            
    except KeyboardInterrupt:
        console.print("\n[dim]Shutting down...[/dim]")
        
    finally:
        if DASHBOARD_PROCESS:
            DASHBOARD_PROCESS.terminate()

if __name__ == "__main__":
    show_welcome()
    main_loop()
