# NLM CLI Command Reference (for cm-notebooklm)

Essential commands for knowledge ingestion workflows.

## Authentication

```bash
nlm login                    # Launch Chrome, extract cookies
nlm login --check            # Validate current session
nlm login --profile work     # Named profile for multiple accounts
nlm auth status              # Check if authenticated
nlm auth list                # List all profiles
```

Session lifetime: ~20 minutes. Re-authenticate when commands fail.

## Notebook Management

```bash
nlm notebook list                      # List all notebooks
nlm notebook list --json               # JSON output
nlm notebook list --quiet              # IDs only
nlm notebook create "Title"            # Create → returns ID
nlm notebook get <id>                  # Notebook details
nlm notebook describe <id>             # AI-generated summary
nlm notebook query <id> "question"     # One-shot Q&A
nlm notebook rename <id> "New Title"   # Rename
nlm notebook delete <id> --confirm     # ⚠️ PERMANENT
```

## Source Management

```bash
# Add sources
nlm source add <nb-id> --url "https://..."                    # Web page
nlm source add <nb-id> --url "https://youtube.com/..."        # YouTube
nlm source add <nb-id> --text "content" --title "Title"       # Pasted text
nlm source add <nb-id> --drive <doc-id>                       # Drive doc
nlm source add <nb-id> --drive <doc-id> --type slides         # Explicit type

# View sources
nlm source list <nb-id>                # Table of sources
nlm source list <nb-id> --drive        # Drive sources + freshness
nlm source describe <source-id>        # AI summary
nlm source content <source-id>         # Raw text

# Sync & delete
nlm source stale <nb-id>              # Outdated Drive sources
nlm source sync <nb-id> --confirm     # Sync all stale
nlm source delete <source-id> --confirm
```

## Content Generation

All require `--confirm` or `-y`:

```bash
nlm audio create <id> --confirm                          # Podcast
nlm audio create <id> --format deep_dive --confirm       # Deep dive podcast
nlm report create <id> --confirm                         # Briefing doc
nlm report create <id> --format "Study Guide" --confirm  # Study guide
nlm quiz create <id> --count 10 --difficulty 3 --confirm # Quiz
nlm flashcards create <id> --difficulty medium --confirm  # Flashcards
nlm mindmap create <id> --confirm                        # Mind map
nlm slides create <id> --confirm                         # Slides
nlm studio status <id>                                   # Check generation
```

## Aliases

```bash
nlm alias set myproject <uuid>   # Create alias
nlm alias get myproject          # Resolve to UUID
nlm alias list                   # List all aliases
nlm alias delete myproject       # Remove alias
```

## Research

```bash
nlm research start "query" --notebook-id <id>              # Fast (~30s)
nlm research start "query" --notebook-id <id> --mode deep  # Deep (~5min)
nlm research status <id>                                    # Check progress
nlm research import <id> <task-id>                          # Import sources
```

## Rate Limits

| Operation | Wait time |
|-----------|-----------|
| Source add/delete | 2-3 seconds |
| Content generation | 5 seconds |
| Research | 2 seconds |
| Query | 2 seconds |
