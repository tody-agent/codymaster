---
name: pandasai-analytics
description: Use when analyzing DataFrames with natural language, generating visual reports from backtest/forecast results, exploring data patterns, or building conversational analytics on top of existing pandas data. Especially relevant for demand forecasting, workforce planning, and time-series evaluation projects.
---

# PandasAI Analytics

## Overview

PandasAI lets you **chat with your DataFrames** using natural language. It generates pandas code + matplotlib charts behind the scenes via an LLM. Use it as a supplementary analytics layer — NOT as core logic.

**Core principle:** PandasAI is a report/insight tool, not a computation engine. Always keep it separate from production pipelines.

## When to Use

- Generating visual reports from backtest/evaluation results
- Exploring data patterns interactively ("which SKUs have highest error?")
- Creating AI-narrated analytics summaries
- Building ad-hoc dashboards from forecast output
- Comparing model performance across segments/folds
- Quick data profiling before modeling

**When NOT to use:**
- Production inference pipelines (non-deterministic)
- Core model training logic
- Real-time API responses (LLM latency)
- Security-sensitive data without Docker sandbox

## Quick Setup

```python
import pandasai as pai
from pandasai_litellm.litellm import LiteLLM

# Option 1: Gemini (recommended for cost)
llm = LiteLLM(model="gemini/gemini-2.0-flash", api_key=GEMINI_API_KEY)

# Option 2: OpenRouter 
llm = LiteLLM(
    model="openrouter/google/gemini-2.0-flash-001",
    api_key=OPENROUTER_KEY,
    api_base="https://openrouter.ai/api/v1",
)

# Option 3: OpenAI
llm = LiteLLM(model="gpt-4.1-mini", api_key=OPENAI_KEY)

pai.config.set({"llm": llm})
```

## Use Cases for Forecast & Planner Projects

### 1. Backtest Result Analysis

```python
import json, pandasai as pai

# Load backtest JSON → DataFrame
with open("output/backtest_results.json") as f:
    data = json.load(f)

rows = []
for fold in data["fold_results"]:
    om = fold.get("order_metrics", {})
    rows.append({
        "fold": fold["fold"],
        "train_window": fold["train_window"],
        "wmape": om.get("wmape"),
        "bias": om.get("bias"),
        "fnr": om.get("fnr"),
        "mae": om.get("mae"),
    })

df = pai.DataFrame(rows)

# Natural language queries
df.chat("Which fold has the lowest wMAPE? Show a bar chart comparing all folds")
df.chat("Is there a correlation between training window size and accuracy?")
df.chat("Summarize the bias trend — are we consistently over or under-predicting?")
```

### 2. Model Comparison (LightGBM vs AutoTS)

```python
# Build comparison DataFrame from backtest
comparison = pai.DataFrame([
    {"model": "LightGBM", "wmape": 45.2, "mae": 1.23, "fnr": 12.5, "bias": -0.15},
    {"model": "AutoTS",   "wmape": 168.4, "mae": 2.89, "fnr": 16.1, "bias": 2.5},
])

comparison.chat("Create a grouped bar chart comparing all metrics between the two models")
comparison.chat("Which model is better for this use case and why? Consider all metrics.")
```

### 3. Segment Performance Deep-Dive

```python
segments = pai.DataFrame([
    {"segment": "bau",     "wmape": 48.0, "bias": -0.12, "fnr": 10.0, "volume": 280},
    {"segment": "sale",    "wmape": 35.0, "bias":  0.25, "fnr":  5.0, "volume": 150},
    {"segment": "minor",   "wmape": 55.0, "bias": -0.30, "fnr": 18.0, "volume":  25},
    {"segment": "holiday", "wmape": 62.0, "bias": -0.45, "fnr": 22.0, "volume":  15},
])

segments.chat("Which segment needs the most improvement? Consider volume impact.")
segments.chat("Plot bias by segment. Highlight negative bias segments in red.")
segments.chat("What's the volume-weighted average wMAPE across all segments?")
```

### 4. SKU Type Profiling

```python
# After data_profiler.run_profile() or from backtest sku_type_metrics
sku_df = pai.DataFrame(sku_type_data)

sku_df.chat("What percentage of total volume comes from each SKU type?")
sku_df.chat("Plot a pie chart of SKU type distribution by volume")
sku_df.chat("Which SKU type has the worst MAPE but highest volume? That's our priority.")
```

### 5. Event Impact Analysis

```python
events = pai.DataFrame(event_tier_data)

events.chat("Plot MAPE by event tier. Which events are hardest to forecast?")
events.chat("Calculate the uplift ratio: event-day demand vs BAU average")
events.chat("Create a heatmap of error rate by event tier and day-of-week")
```

### 6. Time-Series Pattern Discovery

```python
# Daily aggregated demand
daily = pai.DataFrame(daily_demand_data)

daily.chat("Plot the demand trend over the last 90 days with a 7-day moving average")
daily.chat("Are there any anomalous spikes? List dates with demand > 3x average")
daily.chat("What's the day-of-week seasonality pattern? Show as boxplot.")
daily.chat("Detect any trend change points in the last 6 months")
```

### 7. Workforce Planning Report

```python
# staffing.py output → DataFrame
staffing = pai.DataFrame(staffing_data)

staffing.chat("Plot predicted headcount by warehouse for next 14 days")
staffing.chat("Which warehouses are understaffed vs overstaffed?")
staffing.chat("Calculate the cost impact of over-prediction vs under-prediction")
```

### 8. Feature Importance Analysis

```python
# From model.get_feature_importance()
importance = pai.DataFrame([
    {"feature": name, "gain": value, "segment": seg}
    for seg, feats in model.get_feature_importance().items()
    for name, value in feats.items()
])

importance.chat("What are the top 10 features by gain for the 'sale' segment?")
importance.chat("Plot feature importance comparison between bau and sale segments")
importance.chat("Which features are important for sale but NOT for bau?")
```

## General Analytics Use Cases

### Data Exploration
```python
df.chat("Show basic statistics for all numeric columns")
df.chat("What's the distribution of quantity? Show histogram with outlier markers")
df.chat("How many missing values per column? Show as percentage bar chart")
```

### Cross-DataFrame Analysis
```python
pai.chat("Join these datasets and find which products have orders but no forecast",
         orders_df, forecast_df)
```

### Chart Customization
```python
df.chat(
    "Plot monthly revenue trend as a line chart. "
    "Use dark theme, add grid lines, format y-axis as currency. "
    "Title: 'Monthly Revenue Trend 2025-2026'"
)
```

## Integration Pattern (Standalone Add-on)

```
┌─────────────────────────────────────────┐
│         Core Pipeline (untouched)        │
│  pipeline.py → model.py → backtester.py │
│              ↓ JSON output               │
├─────────────────────────────────────────┤
│       Analytics Add-on (separate)        │
│  pandasai_config.py → report_generator   │
│              ↓ HTML report               │
└─────────────────────────────────────────┘
```

**Key rules:**
1. **Never import PandasAI in core modules** — keep it in `src/analytics/`
2. **Read-only** — analytics module only reads existing output files
3. **Graceful degradation** — works without API key (static charts only)
4. **CLI entry point** — `scripts/run_analytics_report.py`

## Existing Implementation

An example of this integration can look like this:

| File | Purpose |
|------|---------|
| `src/analytics/pandasai_config.py` | Auto-detects Gemini/OpenRouter/OpenAI |
| `src/analytics/report_generator.py` | 6 chart types + AI narrative + HTML |
| `scripts/run_analytics_report.py` | CLI: `--input`, `--all`, `--no-ai` |
| `tests/test_analytics_report.py` | 17 unit tests |

```bash
# Generate report (static charts, no API key needed)
python3 scripts/run_analytics_report.py --input output/backtest.json --no-ai

# Generate with AI narrative
GEMINI_API_KEY=xxx python3 scripts/run_analytics_report.py --input output/backtest.json
```

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| Using `pd.DataFrame` instead of `pai.DataFrame` | PandasAI needs its own DataFrame wrapper |
| Embedding PandasAI in production pipeline | Keep it as a separate analytics step |
| Asking vague questions | Be specific: "Plot wMAPE by segment as bar chart" |
| Not handling missing API keys | Always check `configure_pandasai()` return value |
| Charts not rendering in scripts | Set `matplotlib.use("Agg")` before importing pyplot |
| Large DataFrames causing token overflow | Aggregate data before passing to PandasAI |

## Dependencies

```
pandasai>=3.0.0
pandasai-litellm>=0.0.1  # For Gemini/OpenRouter/OpenAI
matplotlib>=3.7.0         # Chart rendering
```

Python 3.8-3.11 required (PandasAI constraint).
