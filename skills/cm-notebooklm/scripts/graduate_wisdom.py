#!/usr/bin/env python3
import os
import json
from datetime import datetime
import re

BRAIN_DIR = os.path.expanduser("~/.codymaster")
GRADUATED_FILE = os.path.join(BRAIN_DIR, "graduated_wisdom.md")

def get_existing_ids():
    if not os.path.exists(GRADUATED_FILE):
        return set()
    with open(GRADUATED_FILE, 'r', encoding='utf-8') as f:
        content = f.read()
        # Find all **ID:** patterns
        ids = set(re.findall(r'\*\*ID:\*\*\s+([A-Z0-9_-]+)', content))
        return ids

def append_to_graduated(text):
    os.makedirs(BRAIN_DIR, exist_ok=True)
    with open(GRADUATED_FILE, 'a', encoding='utf-8') as f:
        f.write(text)

def graduate_learnings(existing_ids):
    learnings_path = os.path.join(os.getcwd(), ".cm", "learnings.json")
    if not os.path.exists(learnings_path):
        return 0
    
    count = 0
    try:
        with open(learnings_path, 'r', encoding='utf-8') as f:
            learnings = json.load(f)
            
        for l in learnings:
            lid = str(l.get('id', ''))
            status = l.get('status', 'active')
            reinforce_count = int(l.get('reinforceCount', 0))
            
            if status == "active" and reinforce_count >= 3 and lid and lid not in existing_ids:
                md = f"""
### Learning: {l.get('error', 'Unknown Error')}
**ID:** {lid}
**Date Graduated:** {datetime.now().strftime('%Y-%m-%d')}
**Scope:** {l.get('scope', 'global')}
**Cause:** {l.get('cause', '')}
**Prevention:** {l.get('prevention', '')}
**Reinforced:** {reinforce_count} times

"""
                append_to_graduated(md)
                existing_ids.add(lid)
                count += 1
    except Exception as e:
        print(f"Error processing {learnings_path}: {e}")
    return count

def graduate_decisions(existing_ids):
    decisions_path = os.path.join(os.getcwd(), ".cm", "decisions.json")
    if not os.path.exists(decisions_path):
        return 0
        
    count = 0
    try:
        with open(decisions_path, 'r', encoding='utf-8') as f:
            decisions = json.load(f)
            
        for d in decisions:
            did = str(d.get('id', ''))
            status = d.get('status', 'active')
            
            if status == "active" and did and did not in existing_ids:
                md = f"""
### Architecture Decision: {d.get('decision', 'Unknown')}
**ID:** {did}
**Date Graduated:** {datetime.now().strftime('%Y-%m-%d')}
**Scope:** {d.get('scope', 'global')}
**Rationale:** {d.get('rationale', '')}

"""
                append_to_graduated(md)
                existing_ids.add(did)
                count += 1
    except Exception as e:
        print(f"Error processing {decisions_path}: {e}")
    return count

def main():
    existing_ids = get_existing_ids()
    start_count = len(existing_ids)
    
    l_count = graduate_learnings(existing_ids)
    d_count = graduate_decisions(existing_ids)
    
    if l_count > 0 or d_count > 0:
        print(f"✅ Graduated {l_count} learnings and {d_count} decisions to NotebookLM Brain.")
        print(f"  → Saved to {GRADUATED_FILE}")
    else:
        print("💡 No new highly-reinforced learnings or active decisions to graduate.")

if __name__ == "__main__":
    main()
