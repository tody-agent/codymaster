---
name: medical-research
description: Evidence-based medical writing protocol for OB/GYN research articles. Ensures citation standards, Level of Evidence grading, anti-hallucination rules, and clinical accuracy markers. Use when generating or reviewing medical content.
allowed-tools: Read, Write, Edit, Bash
version: 1.0
priority: HIGH
---

# Medical Research — Evidence-Based Writing Protocol

> **Mandatory** when writing medical articles for the OB/GYN RND system.

---

## 1. Evidence Grading — Oxford CEBM

Every recommendation/protocol in articles **MUST** include Level of Evidence:

| Level | Evidence Type | In-Article Notation |
|-------|--------------|---------------------|
| **I** | Systematic Review / Meta-analysis / Large RCT | `[LoE: I]` |
| **II** | Small RCT / High-quality Cohort study | `[LoE: II]` |
| **III** | Case-control study / Retrospective Cohort | `[LoE: III]` |
| **IV** | Case series / Cross-sectional | `[LoE: IV]` |
| **V** | Expert opinion / Consensus | `[LoE: V]` |

**Rules:**
- Each pathology article (Tier 2) must have **at least 3 recommendations with LoE**
- Each technique article (Tier 3) must have **at least 2 recommendations with LoE**
- Each foundation article (Tier 1) must have **at least 1 LoE**
- Include LoE **inline** right after the recommendation, e.g.: `Aspirin 150mg from week 12 for high-risk group [LoE: I — ASPRE trial 2017]`

---

## 2. Citation Standard — Mandatory References

### Accepted Sources (in priority order)

| Priority | Source | Citation Example |
|----------|--------|-----------------|
| **P0** | National MoH Guidelines | `[MoH 2023 — Diagnosis and Treatment Guidelines]` |
| **P1** | ACOG Practice Bulletin | `[ACOG PB #234, 2024]` |
| **P1** | ASRM Committee Opinion | `[ASRM CO 2023]` |
| **P1** | ESHRE Guideline | `[ESHRE Guideline 2024]` |
| **P2** | WHO Recommendation | `[WHO 2023]` |
| **P2** | Cochrane Systematic Review | `[Cochrane 2023]` |
| **P3** | NICE / RCOG | `[NICE NG000, 2024]` |
| **P3** | UpToDate / Standard Textbook | `[Williams Obstetrics 26th Ed]` |

### Citation Rules

- Each article **MUST** have a `## REFERENCES` section at the end
- Each pathology article (T2) must cite **≥ 3 different guidelines**
- Each technique article (T3) must cite **≥ 2 guidelines**
- Each foundation article (T1) must cite **≥ 2 guidelines**
- Cite **inline** within text, e.g.: `According to ACOG PB #234 (2024), IVF success rate in women > 40 is 15-20%`
- **DO NOT** accept vague citations: ~~"According to research"~~, ~~"Experts suggest"~~

---

## 3. Anti-Hallucination Rules — No Fabrication

> 🔴 **CRITICAL:** The most important rules for medical content.

| Rule | Description | Violation Example |
|------|-------------|-------------------|
| **No fabricated statistics** | Do not invent percentages or statistical figures | ❌ "Success rate 87.3%" (no source) |
| **No fabricated drugs** | Only list real medications with correct dosages | ❌ Inventing non-existent brand names |
| **No fabricated guidelines** | Only cite real, existing guidelines | ❌ "ACOG PB #999" (doesn't exist) |
| **No fabricated studies** | Do not create fake author names/years | ❌ "According to Smith et al. (2024)..." (fabricated) |
| **When uncertain → state clearly** | Write "Data varies..." or use ranges | ✅ "Rate ~10-20% (varies by study)" |

### Safe Phrases When Exact Data Is Missing

```
✅ "Rate ranges from X-Y% depending on the study"
✅ "Based on available literature, estimated at approximately..."
✅ "Local data is limited; international reports indicate..."
✅ "Further research needed to confirm"
❌ "Exactly XX.X%" (when no specific source exists)
```

---

## 4. Clinical Safety Markers — Medical Markup

Each pathology article (T2) **MUST** include all 4 markers:

| Marker | Purpose | Format |
|--------|---------|--------|
| `> 💊 CLINICAL NOTE` | Most important practice consideration | Blockquote |
| `> ⚠️ RED FLAG` | When urgent intervention / referral is needed | Blockquote |
| `> 📚 REFERENCE` | Primary guideline for this topic | Blockquote |
| `> ⚕️ DISCLAIMER` | Specialist consultation required | Blockquote at end |

### Mandatory Disclaimer (end of each article)

```markdown
> ⚕️ **DISCLAIMER:** This article is for medical reference purposes only.
> All diagnostic and treatment decisions **require specialist physician guidance**.
> Do not self-apply protocols without specific clinical evaluation.
```

---

## 5. Cross-Reference Protocol

### Inter-Article Links

- When mentioning a pathology/technique with its own article → **MUST include article code**
- Format: `→ See details: [VSN-04] Endometriosis`
- Section `## CROSS-LINKS` must list all related articles

### ICD-10

- Pathology articles (T2) with ICD-10 codes → **MUST include in header**
- Format: `> **ICD-10:** N97.0 | **Group:** VSN`

---

## 6. Medical Writing Audit — 8-Dimension Evaluation

When reviewing medical articles, score across 8 dimensions (1-10):

| Dimension | Question | Passing Standard |
|-----------|----------|-----------------|
| **1. Evidence Quality** | Are LoE markers on key recommendations? | ≥ 3 LoE markers |
| **2. Citation Depth** | Are specific guidelines cited? | ≥ 3 different sources |
| **3. Clinical Accuracy** | Are drug doses, metrics correct? | No medical errors |
| **4. Structure** | Correct template, all sections present? | 100% sections with content |
| **5. ICD-10 Compliance** | Correct ICD-10 code present? | Header has ICD-10 |
| **6. Safety Markers** | Red Flag, Disclaimer present? | 4/4 markers |
| **7. Cross-References** | Links to related articles? | ≥ 2 cross-links |
| **8. Word Count** | Meets minimum length? | T1≥1500, T2≥2000, T3≥1500 |

**Scoring:**
- **72-80:** Excellent — publish ready
- **56-71:** Good — minor revisions needed
- **40-55:** Average — needs more evidence
- **< 40:** Fail — rewrite

---

## 7. Template Enhancement Rules

When creating new articles, inject these additional requirements into the prompt:

### For Pathology Articles (T2)

```
EVIDENCE-BASED REQUIREMENTS:
1. Each treatment recommendation includes [LoE: I-V] + source
2. "DIAGNOSIS" section must have a test table with "Source Guideline" column
3. "TREATMENT" section must cite specific protocols (ACOG/MoH/ASRM)
4. End of article has "## REFERENCES" listing ≥ 3 guidelines
5. End of article has medical DISCLAIMER
6. DO NOT fabricate statistics — use estimated ranges when exact data is unavailable
```

### For Technique Articles (T3)

```
EVIDENCE-BASED REQUIREMENTS:
1. Each procedure step cites source protocol (ASRM/ESHRE/MoH)
2. Drug tables must have a "Guideline" column
3. Success rates must cite source + confidence interval
4. End of article has "## REFERENCES" ≥ 2 guidelines
5. End of article has medical DISCLAIMER
```

---

## Verification Script

Run after article generation to check quality:

```bash
python3 ~/.gemini/antigravity/skills/medical-research/scripts/evidence_checker.py <output_dir>
```

Script checks: References, LoE markers, ICD-10, Disclaimer, word count, cross-links.

---

## Quick Diagnostic

| Question | If NO | Action |
|----------|-------|--------|
| Has REFERENCES section? | Article lacks sources | Add ≥ 3 guidelines |
| Has LoE for recommendations? | Unclear reliability | Assign LoE I-V |
| Has ICD-10 in header? | Missing coding | Add ICD-10 |
| Has RED FLAG? | Missing clinical warning | Add ⚠️ marker |
| Has DISCLAIMER? | Legal risk | Add disclaimer at end |
| Do statistics have sources? | Suspected hallucination | Convert to estimated ranges |
