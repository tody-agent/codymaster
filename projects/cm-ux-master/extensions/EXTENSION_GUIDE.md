# Extension Guide — Content Factory

## Hook System

Hooks let you inject custom logic at any phase boundary in the pipeline.

### Available Hook Points

| Hook | Fires when |
|------|-----------|
| `pre_extract` | Before source extraction begins |
| `post_extract` | After knowledge-base is generated |
| `pre_plan` | Before topic planning |
| `post_plan` | After topic queue is created |
| `pre_write` | Before AI content generation |
| `post_write` | After articles are written |
| `pre_audit` | Before content audit |
| `post_audit` | After audit/fix completes |
| `pre_publish` | Before build + deploy |
| `post_publish` | After content is published |

### Creating a Hook

1. Create a Python script anywhere in your project
2. Register it in `content-factory.config.json`
3. Your script receives the config file path as `sys.argv[1]`

```python
#!/usr/bin/env python3
"""Example: Auto-translate articles after writing."""
import json, sys
from pathlib import Path

config_path = sys.argv[1]
with open(config_path) as f:
    config = json.load(f)

project_root = Path(config_path).parent
content_dir = project_root / config["output"]["content_dir"]

for article in content_dir.glob("*.md"):
    print(f"  Processing: {article.name}")
    # ... your logic here

print("✅ Hook complete")
```

Register in config:
```json
{
  "extensions": {
    "hooks": {
      "post_write": ["scripts/my_translate_hook.py"]
    }
  }
}
```

## OpenClaw Integration (Future)

When OpenClaw API becomes available:

1. Set `extensions.openclaw.enabled: true` in config
2. Set `extensions.openclaw.endpoint` to API URL  
3. Set env var `OPENCLAW_API_KEY`
4. The adapter in `openclaw_adapter.py` handles communication

### Planned Features

- **Multi-agent review**: Content reviewed by specialized AI agents
- **Knowledge sharing**: Cross-project knowledge base federation
- **Distributed pipeline**: Scale content generation across agent network
