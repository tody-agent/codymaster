---
title: "Troubleshooting"
description: "Xử lý vấn đề thường gặp với Content Factory — config errors, pipeline failures, memory issues."
keywords: ["troubleshooting", "content factory", "debugging"]
sidebar:
  order: 5
---

# Troubleshooting

> **Quick Reference**
> - **Ai**: Tất cả users
> - **Format**: Symptom → Cause → Solution

## Common Issues

### 1. Config File Errors

| Symptom | Cause | Solution |
|---------|-------|---------|
| `FileNotFoundError: config` | Config path sai | Check `CF_CONFIG_PATH` env var |
| `JSONDecodeError` | Invalid JSON syntax | Validate JSON online |
| `KeyError: 'niche'` | Missing required field | Check schema in `config.schema.json` |

### 2. Pipeline Failures

<details>
<summary>Extract mode fails</summary>

**Cause**: Source path không tồn tại hoặc file format không supported.

**Fix**:
```bash
# Verify paths
ls -la $(jq -r '.sources.paths[]' content-factory.config.json)
```

</details>

<details>
<summary>Write mode produces low quality</summary>

**Cause**: Memory system chưa initialized hoặc knowledge base trống.

**Fix**:
```bash
python3 scripts/memory.py --init
python3 scripts/extract.py --config content-factory.config.json
```

</details>

<details>
<summary>Audit always fails</summary>

**Cause**: Audit rules quá strict hoặc brand voice chưa defined.

**Fix**: Check `config.audit` section, adjust thresholds.

</details>

### 3. Memory Issues

<details>
<summary>Memory not improving over time</summary>

**Cause**: Learn mode chưa được chạy, hoặc not enough episodic data.

**Fix**:
```bash
# Run learn mode manually
python3 scripts/scoreboard.py --detect-changes
python3 scripts/memory.py --learn
```

</details>

## Quick Diagnostic

```bash
# Check config
python3 -c "import json; json.load(open('content-factory.config.json'))"

# Check memory status
python3 scripts/scoreboard.py --summary

# Check knowledge base
ls -la knowledge-base/

# Dry run pipeline
CF_DRY_RUN=true python3 scripts/pipeline.py
```
