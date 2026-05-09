# NotebookLM Workflows

All workflows use `brain-sync.sh`. Set shortcut:

```bash
SCRIPT=~/.gemini/antigravity/skills/cm-notebooklm/scripts/brain-sync.sh
```

## 1. Bootstrap (First Time)

```bash
uv tool install notebooklm-mcp-cli    # Install CLI
bash $SCRIPT init                      # Login → create → compile → upload
```

## 2. Add Lesson Learned

```bash
bash $SCRIPT lesson "Never hardcode secrets"
# Edit ~/.codymaster/lessons.md (fill in details)
bash $SCRIPT sync                      # Compile + upload
```

## 3. Add Coding Experience

```bash
bash $SCRIPT experience "Parallel tool calls race condition"
# Edit ~/.codymaster/experiences.md (fill in details)
bash $SCRIPT sync
```

## 4. Sync After Changes

```bash
bash $SCRIPT sync    # Compile → hash check → upload if changed → confirm
```

## 5. Cross-Machine Setup

```bash
uv tool install notebooklm-mcp-cli
nlm login
nlm alias set codymaster $(nlm notebook list --quiet | head -1)
```

## 6. Query & Generate

```bash
nlm notebook query codymaster "Which skill handles deployment?"
nlm audio create codymaster --format deep_dive --confirm
nlm flashcards create codymaster --difficulty medium --confirm
```

## 7. Project Notebook

```bash
nlm notebook create "Project: MyApp"
nlm alias set myapp <id>
nlm source add myapp --text "$(cat docs/architecture.md)" --title "Architecture"
```
