I've gathered enough substantial information from both repositories. Let me now compile a comprehensive improvement proposal.

---

# 🧠 BẢN ĐỀ XUẤT CẢI TIẾN CODYMASTER v6.0 — "Self-Evolving Brain"

*Lấy cảm hứng từ OpenSpace (HKUDS) để nâng cấp CodyMaster với khả năng tự học, tự cải tiến, tiết kiệm token, và sử dụng brain layers thông minh hơn.*

---

## I. PHÂN TÍCH SO SÁNH HAI HỆ THỐNG

### OpenSpace — Điểm mạnh cốt lõi

OpenSpace là một **self-evolving skill engine** với ba trụ cột chính mà CodyMaster hiện đang thiếu hoặc triển khai sơ khai:

**1. Vòng lặp tiến hóa 3 chế độ (FIX / DERIVED / CAPTURED):**
OpenSpace không chỉ sửa skill hỏng (FIX) — nó còn tạo phiên bản nâng cao từ skill cha (DERIVED) và bắt pattern thành công từ quá trình thực thi để tạo skill hoàn toàn mới (CAPTURED). Ba chế độ này hoạt động song song qua 3 trigger độc lập: post-execution analysis, tool degradation detection, và periodic metric monitoring.

**2. Quality monitoring đa tầng với SQLite persistence:**
Mỗi skill được track 4 metrics cốt lõi: `applied_rate`, `completion_rate`, `effective_rate`, `fallback_rate`. Dữ liệu được lưu trong SQLite với WAL mode, version DAG đầy đủ, lineage tracking cho mọi evolution. Mỗi execution được phân tích bởi một LLM agent loop riêng (ExecutionAnalyzer) có thể gọi tools để verify kết quả.

**3. Token efficiency thực chứng:**
OpenSpace giảm 46% token usage trong Phase 2 (warm rerun) so với Phase 1 (cold start) trên benchmark GDPVal 50 tasks. Cơ chế: reuse successful skill patterns thay vì reasoning from scratch, diff-based evolution (chỉ sửa phần hỏng, không rewrite), và smart skill selection (BM25 + embedding + LLM re-ranking).

### CodyMaster — Điểm mạnh hiện tại

CodyMaster có kiến trúc **5-Tier Brain + Smart Spine** rất mạnh: Sensory → Working Memory (CONTINUITY.md) → Long-term (SQLite FTS5 + Ebbinghaus decay) → Semantic (qmd vector search) → Structural (CodeGraph AST). Hệ thống `cm://` URI scheme, token budget management, context bus, và L0/L1/L2 progressive loading là những thiết kế xuất sắc. Tuy nhiên, phần self-healing (`cm-skill-health`, `cm-skill-evolution`) hiện chỉ dừng ở mức monitoring và basic patching — thiếu vòng lặp evolution thực sự tự trị.

### Khoảng cách cần lấp

| Khía cạnh | CodyMaster hiện tại | OpenSpace | Gap |
|-----------|---------------------|-----------|-----|
| Skill evolution | FIX mode đơn giản khi health score thấp | FIX + DERIVED + CAPTURED với 3 triggers tự động | Thiếu DERIVED & CAPTURED |
| Post-execution analysis | Không có | LLM agent loop phân tích mọi execution | Critical gap |
| Skill metrics | Success rate, token usage, error patterns | 4 rate metrics + tool dependency tracking + version DAG | Cần mở rộng |
| Token reuse | L0/L1/L2 progressive loading (rất tốt) | Skill caching + warm rerun pattern | Bổ sung lẫn nhau |
| Brain layer routing | Manual (skill tự quyết định) | Automatic (registry + ranker chọn skill) | Cần auto-routing |
| Skill discovery | BM25 search (cm-skill-search) | BM25 + embedding hybrid + LLM confirmation | Cần nâng cấp |

---

## II. ĐỀ XUẤT CẢI TIẾN CHI TIẾT

### A. SKILL EVOLUTION ENGINE — Trái tim của sự tự cải tiến

#### A1. Triển khai 3 Evolution Modes

**File mới: `src/skill-evolver.ts`**

```typescript
// ====================================================================
// SKILL EVOLVER — Inspired by OpenSpace's SkillEvolver
// Three evolution modes: FIX, DERIVED, CAPTURED
// ====================================================================

import { SkillStore, SkillRecord, SkillMetrics } from './skill-store';
import { ContextBus } from './context-bus';

export enum EvolutionType {
  FIX = 'fix',           // Sửa skill hỏng in-place, cùng tên, version mới
  DERIVED = 'derived',   // Tạo skill nâng cao từ skill cha, thư mục mới
  CAPTURED = 'captured', // Bắt pattern mới từ execution thành công
}

export enum EvolutionTrigger {
  POST_EXECUTION = 'post_execution',    // Sau mỗi task execution
  HEALTH_DEGRADATION = 'health_degrade', // Khi health score giảm
  PERIODIC_SCAN = 'periodic_scan',       // Quét định kỳ (mỗi 10 tasks)
}

export interface EvolutionSuggestion {
  type: EvolutionType;
  targetSkillIds: string[];       // Skills cần evolution
  direction: string;              // Mô tả hướng cải tiến
  confidence: number;             // 0-1, ngưỡng để thực thi
  evidence: string[];             // Bằng chứng từ execution
  estimatedTokenSaving?: number;  // Ước lượng token tiết kiệm
}

export interface EvolutionContext {
  trigger: EvolutionTrigger;
  suggestion: EvolutionSuggestion;
  parentSkills: SkillRecord[];
  parentContents: string[];
  recentAnalyses: ExecutionAnalysis[];
  taskId?: string;
}

export class SkillEvolver {
  private store: SkillStore;
  private maxConcurrent = 2;
  private antiLoopRegistry = new Map<string, Set<string>>();
  
  constructor(store: SkillStore) {
    this.store = store;
  }

  /**
   * Main entry point — routes to correct evolution mode
   */
  async evolve(ctx: EvolutionContext): Promise<SkillRecord | null> {
    switch (ctx.suggestion.type) {
      case EvolutionType.FIX:
        return this.evolveFix(ctx);
      case EvolutionType.DERIVED:
        return this.evolveDerived(ctx);
      case EvolutionType.CAPTURED:
        return this.evolveCaptured(ctx);
    }
  }

  /**
   * FIX: In-place repair — same name, same directory, new version
   * 
   * Khi nào trigger:
   *   - Skill có success_rate < 60% sau 5+ invocations
   *   - Tool mà skill phụ thuộc bị degradation
   *   - LLM confirm rằng skill thực sự cần fix
   * 
   * Cách hoạt động:
   *   1. Load skill content + recent execution traces
   *   2. LLM agent loop: phân tích root cause, có thể read files
   *   3. Generate minimal DIFF (không rewrite toàn bộ)
   *   4. Apply diff → validate → persist version mới
   */
  private async evolveFix(ctx: EvolutionContext): Promise<SkillRecord | null> {
    const parent = ctx.parentSkills[0];
    const parentContent = ctx.parentContents[0];
    
    // Build evolution prompt with failure context
    const analysisContext = ctx.recentAnalyses
      .slice(0, 5)
      .map(a => `- Task ${a.taskId}: ${a.executionNote}`)
      .join('\n');
    
    const prompt = `
## Skill Evolution: FIX Mode

### Current Skill Content
${parentContent.slice(0, 8000)}

### Recent Failures/Issues
${analysisContext}

### Direction
${ctx.suggestion.direction}

### Instructions
1. Analyze the root cause of failures
2. Generate a MINIMAL diff to fix the issue
3. Do NOT rewrite the entire skill — targeted fixes only
4. Preserve the skill's core purpose and structure
5. Output format: unified diff with +/- markers

### Output
Return ONLY the updated SKILL.md content.
End with __EVOLUTION_COMPLETE__ if successful.
`;

    // LLM generates the fix
    const newContent = await this.runEvolutionLoop(prompt, ctx);
    if (!newContent) return null;
    
    // Create new version record
    const newRecord: SkillRecord = {
      ...parent,
      skillId: `${parent.name}__v${parent.generation + 1}_${randomHex(8)}`,
      generation: parent.generation + 1,
      origin: 'fixed',
      parentSkillIds: [parent.skillId],
      changeSummary: ctx.suggestion.direction,
      contentDiff: computeDiff(parentContent, newContent),
      metrics: resetMetrics(), // Fresh metrics for new version
    };
    
    await this.store.evolveSkill(newRecord, [parent.skillId]);
    return newRecord;
  }

  /**
   * DERIVED: Create enhanced version — new directory, coexists with parent
   *
   * Khi nào trigger:
   *   - Skill có applied_rate > 70% nhưng completion_rate < 50%
   *     (Được dùng nhiều nhưng không hoàn thành tốt → cần version chuyên biệt)
   *   - Hai+ skills thường được dùng cùng nhau → merge thành 1
   *   - Post-execution analysis gợi ý specialization
   *
   * Khác với FIX:
   *   - Tạo skill MỚI, không thay thế skill cũ
   *   - Skill cũ vẫn active (phục vụ use case gốc)
   *   - Skill mới specialized cho pattern đã phát hiện
   */
  private async evolveDerived(ctx: EvolutionContext): Promise<SkillRecord | null> {
    const isMultiParent = ctx.parentSkills.length > 1;
    
    const prompt = isMultiParent
      ? this.buildMergePrompt(ctx)     // Merge multiple skills
      : this.buildEnhancePrompt(ctx);  // Enhance single skill
    
    const newContent = await this.runEvolutionLoop(prompt, ctx);
    if (!newContent) return null;
    
    // Extract name from frontmatter or generate
    const newName = extractFrontmatter(newContent, 'name') 
      || `${ctx.parentSkills[0].name}-enhanced`;
    
    // Write to new directory under skills/
    const targetDir = `skills/${sanitizeName(newName)}`;
    await writeSkillFile(targetDir, newContent);
    
    const newRecord: SkillRecord = {
      skillId: `${sanitizeName(newName)}__v0_${randomHex(8)}`,
      name: newName,
      generation: Math.max(...ctx.parentSkills.map(p => p.generation)) + 1,
      origin: 'derived',
      parentSkillIds: ctx.parentSkills.map(p => p.skillId),
      path: `${targetDir}/SKILL.md`,
      isActive: true,
      metrics: resetMetrics(),
    };
    
    await this.store.saveRecord(newRecord);
    return newRecord;
  }

  /**
   * CAPTURED: Brand new skill from successful execution pattern
   *
   * Khi nào trigger:
   *   - Task thành công KHÔNG có skill nào match
   *     (Agent giải quyết bằng reasoning → pattern đáng capture)
   *   - Chuỗi tool calls lặp lại across 3+ tasks
   *   - Execution note chứa "workaround" hoặc "pattern discovered"
   *
   * Đây là OpenSpace's killer feature — skill library tự mở rộng
   */
  private async evolveCaptured(ctx: EvolutionContext): Promise<SkillRecord | null> {
    const taskHighlights = ctx.recentAnalyses
      .map(a => `- Task: ${a.taskId}\n  Note: ${a.executionNote}\n  Tools: ${a.toolsUsed?.join(', ')}`)
      .join('\n');

    const prompt = `
## Skill Evolution: CAPTURE Mode

### Observed Successful Pattern
${taskHighlights}

### Direction
${ctx.suggestion.direction}

### Instructions
Create a BRAND NEW reusable skill that captures this successful pattern.

Requirements:
1. Standard SKILL.md format with frontmatter (name, description)
2. Clear "When to Use" triggers
3. Step-by-step process extracted from the successful execution
4. Integration section (which other cm-* skills it connects to)
5. Keep under 400 lines (token optimization)

### Output
Return the complete SKILL.md content for the new skill.
End with __EVOLUTION_COMPLETE__
`;

    const newContent = await this.runEvolutionLoop(prompt, ctx);
    if (!newContent) return null;
    
    const name = extractFrontmatter(newContent, 'name');
    if (!name) return null;
    
    const targetDir = `skills/${sanitizeName(name)}`;
    await writeSkillFile(targetDir, newContent);
    
    const newRecord: SkillRecord = {
      skillId: `${sanitizeName(name)}__v0_${randomHex(8)}`,
      name,
      origin: 'captured',
      generation: 0,
      parentSkillIds: [], // No parents — brand new
      path: `${targetDir}/SKILL.md`,
      isActive: true,
      metrics: resetMetrics(),
    };
    
    await this.store.saveRecord(newRecord);
    return newRecord;
  }

  /**
   * Anti-loop protection — OpenSpace pattern
   * Prevent runaway evolution cycles
   */
  private isAddressed(trigger: string, skillId: string): boolean {
    return this.antiLoopRegistry.get(trigger)?.has(skillId) ?? false;
  }

  private markAddressed(trigger: string, skillId: string): void {
    if (!this.antiLoopRegistry.has(trigger)) {
      this.antiLoopRegistry.set(trigger, new Set());
    }
    this.antiLoopRegistry.get(trigger)!.add(skillId);
  }
}
```

#### A2. Execution Analyzer — Bộ não phân tích sau mỗi task

**File mới: `src/execution-analyzer.ts`**

Đây là component mà CodyMaster hoàn toàn thiếu. Mỗi khi một task hoàn thành (dù thành công hay thất bại), Execution Analyzer chạy để:

```typescript
export class ExecutionAnalyzer {
  private store: SkillStore;
  private evolver: SkillEvolver;
  
  /**
   * Chạy sau MỌI task execution
   * 
   * Flow:
   *   1. Thu thập artifacts: CONTINUITY.md, context-bus, error logs
   *   2. Build analysis prompt gửi LLM
   *   3. LLM trả về JSON analysis:
   *      - task_completed: boolean
   *      - skill_judgments: [{skillId, applied, effectiveness, note}]
   *      - evolution_suggestions: [{type, targets, direction}]
   *      - token_usage_analysis: {total, wasted, optimization_hints}
   *   4. Persist analysis → update skill metrics
   *   5. Route evolution suggestions → SkillEvolver
   */
  async analyzeExecution(
    taskId: string,
    skillsUsed: string[],
    executionResult: ExecutionResult,
  ): Promise<ExecutionAnalysis> {
    
    // 1. Load execution context
    const continuity = await readFile('.cm/CONTINUITY.md');
    const contextBus = await readContextBus();
    const learnings = await this.store.queryLearnings(taskId);
    
    // 2. Build analysis prompt
    const prompt = this.buildAnalysisPrompt({
      taskDescription: executionResult.instruction,
      status: executionResult.status,
      skillsUsed,
      continuitySnapshot: continuity.slice(0, 3000),
      contextBusState: JSON.stringify(contextBus).slice(0, 2000),
      errorLog: executionResult.errors?.slice(0, 2000),
    });
    
    // 3. LLM analysis (cheap model — this is meta-work)
    const analysis = await this.llm.analyze(prompt, { 
      model: 'fast', // Use cheaper model for analysis
      maxTokens: 1000,
    });
    
    // 4. Persist + update metrics
    await this.store.recordAnalysis(analysis);
    for (const judgment of analysis.skillJudgments) {
      await this.store.updateSkillMetrics(judgment.skillId, {
        selected: true,
        applied: judgment.applied,
        completed: judgment.applied && analysis.taskCompleted,
        fallback: !judgment.applied && !analysis.taskCompleted,
      });
    }
    
    // 5. Route evolution suggestions
    if (analysis.evolutionSuggestions.length > 0) {
      for (const suggestion of analysis.evolutionSuggestions) {
        if (suggestion.confidence > 0.7) {
          await this.evolver.evolve(
            this.buildEvolutionContext(suggestion, analysis)
          );
        }
      }
    }
    
    return analysis;
  }
}
```

---

### B. TOKEN OPTIMIZATION ENGINE — Tiết kiệm 40-50% tokens

#### B1. Smart Skill Selection (BM25 + Embedding Hybrid)

Hiện tại `cm-skill-search` dùng BM25 đơn thuần. Cần nâng cấp theo mô hình OpenSpace:

**File cải tiến: `src/skill-ranker.ts`**

```typescript
/**
 * SKILL RANKER — 3-stage pipeline inspired by OpenSpace
 * 
 * Stage 1: BM25 keyword recall (fast, cheap)  → top 20 candidates
 * Stage 2: Embedding similarity (nếu có)       → re-rank top 10
 * Stage 3: LLM confirmation (chỉ top 3-5)      → final selection
 * 
 * Token savings:
 *   - Thay vì inject TẤT CẢ 68 skills vào context (≈30K tokens)
 *   - Chỉ inject 3-5 skills relevant nhất (≈3K tokens)
 *   - Tiết kiệm ≈27K tokens MỖI request = ~90% savings trên skill loading
 */
export class SkillRanker {
  
  async selectSkills(
    taskDescription: string,
    availableSkills: SkillMeta[],
    options: { maxSkills?: number; budget?: number } = {}
  ): Promise<RankedSkill[]> {
    
    const maxSkills = options.maxSkills ?? 5;
    const budget = options.budget ?? 4000; // Token budget for skills
    
    // Stage 1: BM25 recall
    const bm25Candidates = this.bm25Rank(taskDescription, availableSkills)
      .slice(0, 20);
    
    // Stage 2: Embedding re-rank (if vector backend available)
    let reranked = bm25Candidates;
    if (this.hasEmbeddingBackend()) {
      const taskEmbedding = await this.embed(taskDescription);
      reranked = this.embeddingRerank(bm25Candidates, taskEmbedding)
        .slice(0, 10);
    }
    
    // Stage 3: Token-aware selection
    // Load skills at L0 first (frontmatter only ≈50 tokens each)
    // Only upgrade to L1/L2 for final selected skills
    const selected: RankedSkill[] = [];
    let tokenUsed = 0;
    
    for (const candidate of reranked) {
      if (selected.length >= maxSkills) break;
      
      const l0Content = await this.loadSkillL0(candidate.id);
      const estimatedTokens = estimateTokens(l0Content);
      
      if (tokenUsed + estimatedTokens > budget) {
        // Load at even cheaper depth
        selected.push({ ...candidate, depth: 'L0' });
      } else {
        selected.push({ ...candidate, depth: 'L1' });
        tokenUsed += estimatedTokens;
      }
    }
    
    return selected;
  }
  
  /**
   * Quality-weighted ranking
   * 
   * OpenSpace insight: Skills với effective_rate cao hơn
   * được ưu tiên chọn. Skill mới (ít data) được cho "exploration bonus"
   */
  private qualityWeight(skill: SkillRecord): number {
    if (skill.metrics.totalSelections < 3) {
      return 0.5; // Exploration bonus — give new skills a chance
    }
    
    const effectiveRate = skill.metrics.totalCompletions / skill.metrics.totalSelections;
    const freshness = daysSince(skill.lastUpdated) < 7 ? 0.1 : 0;
    
    return effectiveRate + freshness;
  }
}
```

#### B2. Progressive Skill Loading — Mở rộng hệ thống L0/L1/L2

CodyMaster đã có L0/L1/L2 cho memory. Áp dụng cùng pattern cho skills:

```typescript
/**
 * SKILL DEPTH LOADING
 * 
 * L0 (~50 tokens):  Frontmatter only — name + description
 *   Dùng khi: listing skills, initial ranking, budget constrained
 * 
 * L1 (~200 tokens): Frontmatter + When to Use + Quick Reference
 *   Dùng khi: Skill đã được selected nhưng agent chỉ cần overview
 * 
 * L2 (full):        Toàn bộ SKILL.md
 *   Dùng khi: Agent cần follow skill instructions step-by-step
 * 
 * AUTO mode:        Bắt đầu L0, upgrade lên L1/L2 khi agent request
 *   Dùng khi: Không chắc skill sẽ được dùng hay không
 */
export type SkillDepth = 'L0' | 'L1' | 'L2' | 'AUTO';

export function loadSkillAtDepth(
  skillPath: string, 
  depth: SkillDepth
): string {
  const content = readFileSync(skillPath, 'utf-8');
  
  switch (depth) {
    case 'L0': 
      return extractFrontmatter(content); // ~50 tokens
    
    case 'L1': {
      const sections = parseSections(content);
      return [
        extractFrontmatter(content),
        sections['When to Use'] || '',
        sections['Quick Reference'] || '',
      ].join('\n').slice(0, 800); // ~200 tokens
    }
    
    case 'L2':
      return content; // Full content
    
    case 'AUTO':
      return extractFrontmatter(content); // Start cheap, upgrade on demand
  }
}
```

#### B3. Warm Skill Cache — Pattern từ OpenSpace

```typescript
/**
 * SKILL EXECUTION CACHE
 * 
 * OpenSpace's killer optimization: khi một task type đã được giải quyết
 * thành công, cache chuỗi skill + config để reuse.
 * 
 * Ví dụ:
 *   Task "add i18n for Vietnamese" → cache: [cm-safe-i18n, cm-tdd]
 *   Lần sau "add i18n for Korean" → reuse CÙNG chain, skip selection
 *   
 * Token savings: skip cả BM25 ranking + LLM selection = ~2000 tokens/task
 */
export class SkillExecutionCache {
  private db: SQLiteDB; // Reuse .cm/context.db
  
  async cacheSuccessfulExecution(
    taskPattern: string,      // Normalized task description
    skillChain: string[],     // Ordered list of skills used
    effectiveness: number,     // 0-1 score from execution analysis
    tokenUsed: number,
  ): Promise<void> {
    if (effectiveness < 0.7) return; // Only cache good executions
    
    await this.db.run(`
      INSERT OR REPLACE INTO skill_cache 
      (task_pattern, skill_chain, effectiveness, token_used, hit_count, last_hit)
      VALUES (?, ?, ?, ?, COALESCE(
        (SELECT hit_count FROM skill_cache WHERE task_pattern = ?), 0
      ) + 1, datetime('now'))
    `, [taskPattern, JSON.stringify(skillChain), effectiveness, tokenUsed, taskPattern]);
  }
  
  async findCachedChain(taskDescription: string): Promise<CachedChain | null> {
    // BM25 search against cached task patterns
    const matches = await this.db.all(`
      SELECT * FROM skill_cache 
      WHERE skill_cache MATCH ?
      ORDER BY rank * effectiveness * (1 + hit_count * 0.1) DESC
      LIMIT 1
    `, [tokenize(taskDescription)]);
    
    if (matches.length > 0 && matches[0].effectiveness > 0.8) {
      return matches[0];
    }
    return null;
  }
}
```

---

### C. SMART BRAIN LAYER ROUTING — Thông minh hơn trong việc dùng brain layers

#### C1. Adaptive Context Loading Protocol

Hiện tại CodyMaster load memory theo protocol cố định (check L0 → CONTINUITY → etc). Cần routing thông minh dựa trên task type:

```typescript
/**
 * SMART BRAIN ROUTER
 * 
 * Vấn đề hiện tại:
 *   - cm-continuity load FULL learnings.json cho mọi task type
 *   - CodeGraph (Tier 5) load cho cả task không liên quan code
 *   - qmd vector search chạy cho cả task đơn giản
 * 
 * Giải pháp: Task-type classifier → Brain layer selector
 */
export class SmartBrainRouter {
  
  /**
   * Classify task → select minimal brain layers needed
   * 
   * Mỗi brain tier có cost (latency + tokens):
   *   Tier 1 (Sensory):    0 cost — always available
   *   Tier 2 (Working):    ~400 tokens — CONTINUITY.md
   *   Tier 3 (Long-term):  ~250 tokens (L0) to ~2500 (full)
   *   Tier 4 (Semantic):   ~1500 tokens + 2s latency
   *   Tier 5 (Structural): ~3000 tokens + 5s latency
   * 
   * Total potential: ~7650 tokens per task just for context loading
   * Smart routing target: <1500 tokens average = 80% savings
   */
  async route(taskDescription: string): Promise<BrainLoadPlan> {
    const taskType = this.classifyTask(taskDescription);
    
    switch (taskType) {
      case 'simple_question':
        // "What color is the button?" → Only Tier 1
        return { tiers: [1], totalBudget: 200 };
      
      case 'code_change':
        // "Fix the login bug" → Tier 1 + 2 + 3(scoped) + 5(if large codebase)
        return { 
          tiers: [1, 2, 3, 5],
          tier3Scope: extractScope(taskDescription), // e.g., "module:auth"
          tier5Filter: extractFilePaths(taskDescription),
          totalBudget: 3000,
        };
      
      case 'resume_session':
        // "What was I working on?" → Tier 2 (CONTINUITY) only
        return { tiers: [1, 2], totalBudget: 500 };
      
      case 'complex_feature':
        // "Build a payment system" → All tiers, but progressive
        return { 
          tiers: [1, 2, 3, 4, 5],
          progressiveLoad: true, // Start L0, upgrade as needed
          totalBudget: 5000,
        };
      
      case 'content_creation':
        // "Write blog post about React" → Tier 1 + 3 + 4
        return { tiers: [1, 3, 4], totalBudget: 2000 };
      
      case 'deployment':
        // "Deploy to production" → Tier 2 + 3(scoped to deploy learnings)
        return { 
          tiers: [1, 2, 3],
          tier3Scope: 'module:deploy',
          totalBudget: 1500,
        };
    }
  }
  
  /**
   * Lightweight task classifier — keyword based, no LLM call
   * Cost: ~0 tokens, <1ms
   */
  private classifyTask(desc: string): TaskType {
    const lower = desc.toLowerCase();
    
    if (lower.match(/\b(what|how|why|explain|status)\b/) && lower.length < 100)
      return 'simple_question';
    
    if (lower.match(/\b(resume|continue|what was|pick up|carry on)\b/))
      return 'resume_session';
    
    if (lower.match(/\b(deploy|ship|release|publish|push to prod)\b/))
      return 'deployment';
    
    if (lower.match(/\b(blog|article|content|write about|documentation)\b/))
      return 'content_creation';
    
    if (lower.match(/\b(fix|bug|error|crash|broken|debug)\b/))
      return 'code_change';
    
    if (lower.match(/\b(build|create|implement|add|feature|system)\b/))
      return 'complex_feature';
    
    return 'code_change'; // Default
  }
}
```

#### C2. Token Budget Enforcement — Tích hợp vào Smart Spine

```typescript
/**
 * ENHANCED TOKEN BUDGET
 * 
 * CodyMaster đã có .cm/token-budget.json — mở rộng với:
 *   1. Per-category budgets cho brain layers (không chỉ skills)
 *   2. Real-time tracking (không chỉ pre-flight check)
 *   3. Adaptive budgets dựa trên task complexity
 */
export interface EnhancedTokenBudget {
  total: 200_000;  // 200K context window
  
  categories: {
    skills: {
      soft: 4_000,    // Normal tasks
      hard: 8_000,    // Complex tasks with many skills
      current: 0,     // Real-time tracking
    };
    brainTier2: {
      soft: 500,
      hard: 1_000,
      current: 0,
    };
    brainTier3: {
      soft: 500,      // L0 index
      hard: 3_000,    // Full learnings
      current: 0,
    };
    brainTier4: {
      soft: 0,        // Off by default
      hard: 2_000,    // Only activated for complex tasks
      current: 0,
    };
    brainTier5: {
      soft: 0,
      hard: 4_000,
      current: 0,
    };
    conversation: {
      soft: 150_000,
      hard: 185_000,
      current: 0,
    };
  };
  
  // Auto-computed from task type by SmartBrainRouter
  activePlan: BrainLoadPlan | null;
}
```

---

### D. SELF-LEARNING LOOP — Tích hợp vào CodyMaster Brain

#### D1. Learnings ↔ Skills Feedback Loop

Điểm đặc biệt: kết hợp hệ thống learnings (Ebbinghaus decay) của CodyMaster với skill evolution của OpenSpace:

```typescript
/**
 * LEARNING-TO-SKILL PROMOTION
 * 
 * Khi một learning được reinforced 5+ lần → nó đủ "trưởng thành"
 * để trở thành skill hoặc được inject vào skill có liên quan.
 * 
 * Flow:
 *   Learning L001: "Always check auth token expiry before API call"
 *     → reinforceCount hits 5
 *     → Analyzer checks: does any existing skill cover this?
 *       → YES: trigger DERIVED evolution to add this pattern
 *       → NO:  trigger CAPTURED evolution to create new skill
 */
export class LearningToSkillPromoter {
  
  async checkPromotionCandidates(): Promise<void> {
    const matureLearnings = await this.store.queryLearnings({
      status: 'active',
      minReinforceCount: 5,
      notPromoted: true,
    });
    
    for (const learning of matureLearnings) {
      // Find related skills by scope
      const relatedSkills = await this.skillRanker.selectSkills(
        learning.prevention, // Use prevention as search query
        { maxSkills: 3 }
      );
      
      if (relatedSkills.length > 0 && relatedSkills[0].score > 0.8) {
        // Inject into existing skill via DERIVED evolution
        await this.evolver.evolve({
          trigger: EvolutionTrigger.PERIODIC_SCAN,
          suggestion: {
            type: EvolutionType.DERIVED,
            targetSkillIds: [relatedSkills[0].id],
            direction: `Integrate proven learning: "${learning.prevention}"`,
            confidence: 0.9,
            evidence: [`Learning ${learning.id} reinforced ${learning.reinforceCount}x`],
          },
          // ... context
        });
      } else {
        // Create brand new skill via CAPTURED
        await this.evolver.evolve({
          trigger: EvolutionTrigger.PERIODIC_SCAN,
          suggestion: {
            type: EvolutionType.CAPTURED,
            targetSkillIds: [],
            direction: `Capture proven pattern: ${learning.error} → ${learning.prevention}`,
            confidence: 0.85,
            evidence: [`Learning ${learning.id} reinforced ${learning.reinforceCount}x over ${learning.ttl} days`],
          },
        });
      }
      
      // Mark learning as promoted (don't re-process)
      await this.store.updateLearning(learning.id, { promoted: true });
    }
  }
}
```

#### D2. Meta-Evolution Dashboard Metrics

Mở rộng `cm-dashboard` để track evolution health:

```typescript
export interface EvolutionDashboardData {
  // Skill lifecycle
  totalSkills: number;
  activeSkills: number;
  evolvedSkills: { fixed: number; derived: number; captured: number };
  
  // Health overview
  healthySkills: number;      // effectiveness > 70%
  degradingSkills: number;    // effectiveness 40-70%
  brokenSkills: number;       // effectiveness < 40%
  
  // Token efficiency
  avgTokensPerTask: { last7d: number; last30d: number; trend: 'up' | 'down' | 'stable' };
  tokensSavedByCache: number;
  tokensSavedByL0Loading: number;
  
  // Evolution activity
  recentEvolutions: {
    type: EvolutionType;
    skillName: string;
    trigger: EvolutionTrigger;
    timestamp: string;
    success: boolean;
  }[];
  
  // Learning-to-skill promotions
  learningsPromoted: number;
  pendingPromotions: number;
}
```

---

### E. SKILL STORE — SQLite Schema mới

**File cải tiến: `src/skill-store.ts`**

Mở rộng `.cm/context.db` hiện tại:

```sql
-- =============================================
-- NEW TABLES for Skill Evolution Engine
-- =============================================

-- Skill records with full metrics tracking
CREATE TABLE IF NOT EXISTS cm_skill_records (
    skill_id               TEXT PRIMARY KEY,
    name                   TEXT NOT NULL,
    description            TEXT DEFAULT '',
    path                   TEXT NOT NULL,
    is_active              INTEGER DEFAULT 1,
    origin                 TEXT DEFAULT 'imported',  -- imported/fixed/derived/captured
    generation             INTEGER DEFAULT 0,
    parent_skill_ids       TEXT DEFAULT '[]',        -- JSON array
    change_summary         TEXT DEFAULT '',
    content_diff           TEXT DEFAULT '',
    content_hash           TEXT DEFAULT '',           -- Quick change detection
    
    -- Quality metrics (inspired by OpenSpace)
    total_selections       INTEGER DEFAULT 0,
    total_applied          INTEGER DEFAULT 0,
    total_completions      INTEGER DEFAULT 0,
    total_fallbacks        INTEGER DEFAULT 0,
    total_tokens_used      INTEGER DEFAULT 0,        -- CodyMaster addition
    avg_execution_time_ms  INTEGER DEFAULT 0,        -- CodyMaster addition
    
    first_seen             TEXT NOT NULL,
    last_updated           TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_cm_sr_active ON cm_skill_records(is_active);
CREATE INDEX IF NOT EXISTS idx_cm_sr_name ON cm_skill_records(name);
CREATE INDEX IF NOT EXISTS idx_cm_sr_origin ON cm_skill_records(origin);

-- FTS5 for BM25 skill search (reuse existing FTS pattern)
CREATE VIRTUAL TABLE IF NOT EXISTS cm_skill_records_fts 
USING fts5(name, description, content='cm_skill_records', content_rowid='rowid');

-- Execution analyses (one per task)
CREATE TABLE IF NOT EXISTS cm_execution_analyses (
    id                      INTEGER PRIMARY KEY AUTOINCREMENT,
    task_id                 TEXT NOT NULL UNIQUE,
    timestamp               TEXT NOT NULL,
    task_completed          INTEGER DEFAULT 0,
    execution_note          TEXT DEFAULT '',
    skills_used             TEXT DEFAULT '[]',        -- JSON array
    skill_judgments         TEXT DEFAULT '[]',        -- JSON array of judgments
    evolution_suggestions   TEXT DEFAULT '[]',        -- JSON array
    token_usage             INTEGER DEFAULT 0,
    execution_time_ms       INTEGER DEFAULT 0,
    evolution_processed_at  TEXT DEFAULT NULL
);

CREATE INDEX IF NOT EXISTS idx_cm_ea_task ON cm_execution_analyses(task_id);

-- Skill execution cache (warm rerun optimization)
CREATE TABLE IF NOT EXISTS cm_skill_cache (
    task_pattern           TEXT PRIMARY KEY,
    skill_chain            TEXT NOT NULL,             -- JSON array of skill names
    effectiveness          REAL DEFAULT 0,
    token_used             INTEGER DEFAULT 0,
    hit_count              INTEGER DEFAULT 0,
    last_hit               TEXT NOT NULL
);

-- FTS5 for cache pattern matching
CREATE VIRTUAL TABLE IF NOT EXISTS cm_skill_cache_fts
USING fts5(task_pattern, content='cm_skill_cache', content_rowid='rowid');

-- Lineage tracking (parent-child relationships)
CREATE TABLE IF NOT EXISTS cm_skill_lineage (
    skill_id        TEXT NOT NULL REFERENCES cm_skill_records(skill_id),
    parent_skill_id TEXT NOT NULL,
    PRIMARY KEY (skill_id, parent_skill_id)
);
```

---

### F. INTEGRATION PLAN — Tích hợp vào kiến trúc CodyMaster hiện tại

#### F1. Sửa `cm-skill-chain` — Auto-Dispatch + Evolution

```markdown
## Cải tiến cm-skill-chain (v6)

### Auto-dispatch hiện tại (v5)
chain auto "task" → match chain template → start

### Auto-dispatch mới (v6) 
chain auto "task" 
  → 1. Check skill cache (warm hit?) 
  → 2. If miss: SmartRanker selects skills 
  → 3. Build chain dynamically (không chỉ templates) 
  → 4. Execute with progress tracking
  → 5. Post-execution: ExecutionAnalyzer chạy
  → 6. Successful pattern → SkillExecutionCache
  → 7. Evolution suggestions → SkillEvolver (background)
```

#### F2. Sửa `cm-continuity` — Tích hợp Execution Analysis

```markdown
## AT THE END OF EVERY TASK (v6 addition):

After updating CONTINUITY.md, ALSO:
1. Trigger ExecutionAnalyzer.analyzeExecution()
2. Record skill effectiveness in context.db
3. Check if any learnings should be promoted to skills
4. Update skill cache for successful patterns
5. Report token usage vs. budget

## Token savings summary at session end:
- Skills loaded at L0 (saved ~X tokens)
- Cache hits (saved ~Y tokens)  
- Brain layers skipped (saved ~Z tokens)
- Total saved: X + Y + Z tokens
```

#### F3. Sửa `cm-skill-health` — Mở rộng metrics

```markdown
## Enhanced Health Monitoring (v6)

### Metrics tracked per skill (4 rates from OpenSpace):
- applied_rate = total_applied / total_selections
- completion_rate = total_completions / total_applied  
- effective_rate = total_completions / total_selections
- fallback_rate = total_fallbacks / total_selections

### NEW: Token efficiency per skill
- avg_tokens_per_use = total_tokens_used / total_applied
- token_trend = last_5_uses vs. previous_5_uses

### Thresholds for auto-evolution:
| Metric | Threshold | Action |
|--------|-----------|--------|
| effective_rate < 40% | After 5 uses | FIX evolution |
| applied_rate > 70% but completion < 50% | After 5 uses | DERIVED evolution |
| fallback_rate > 50% | After 5 uses | FIX or deactivate |
| token_trend increasing > 20% | After 10 uses | FIX for token optimization |
```

---

### G. CLI COMMANDS MỚI

```bash
# Skill Evolution
cm evolve status                    # Show pending evolution suggestions
cm evolve run [suggestion-id]       # Execute a specific evolution
cm evolve history                   # View evolution lineage
cm evolve rollback <skill-id>       # Rollback to parent version

# Skill Analytics
cm skill metrics                    # Show all skill health metrics
cm skill metrics <name>             # Detailed metrics for one skill
cm skill top 10 --by effective_rate # Leaderboard
cm skill cache                      # Show warm cache hits
cm skill cache clear                # Clear cache

# Token Analysis
cm token report                     # Token usage breakdown
cm token report --last 7d           # Last 7 days
cm token savings                    # Show optimization savings

# Brain Routing
cm brain plan "task description"    # Preview which brain layers would load
cm brain budget                     # Current token budget allocation
```

---

## III. IMPLEMENTATION ROADMAP

### Phase 1 (Week 1-2): Foundation
- `src/skill-store.ts` — SQLite schema migration + CRUD
- `src/skill-ranker.ts` — BM25 + quality-weighted ranking
- Progressive skill loading (L0/L1/L2)
- `cm skill metrics` CLI command

### Phase 2 (Week 3-4): Evolution Engine
- `src/execution-analyzer.ts` — Post-execution analysis
- `src/skill-evolver.ts` — FIX mode only first
- Integration vào `cm-skill-chain` post-execution hook
- `cm evolve status/history` CLI commands

### Phase 3 (Week 5-6): Advanced Evolution + Token Optimization
- DERIVED + CAPTURED evolution modes
- `src/skill-execution-cache.ts` — Warm cache
- `src/smart-brain-router.ts` — Adaptive brain layer loading
- Token budget enforcement per brain tier
- `cm token report/savings` CLI commands

### Phase 4 (Week 7-8): Learning-to-Skill Loop + Polish
- `src/learning-promoter.ts` — Mature learnings → skills
- Dashboard evolution metrics panel
- Anti-loop protection + safety checks
- Documentation + tests

---

## IV. ESTIMATED IMPACT

| Metric | Current CodyMaster | After Improvements | Source |
|--------|--------------------|--------------------|--------|
| Token per task | 100% (baseline) | ~55% (-45%) | OpenSpace benchmark: 46% reduction |
| Skill selection accuracy | BM25 only | BM25 + quality + embedding | 3-stage pipeline |
| Self-healing coverage | Health monitor + basic FIX | FIX + DERIVED + CAPTURED + 3 triggers | OpenSpace architecture |
| Brain layer waste | Load all by protocol | Load only needed by task type | Smart Brain Router |
| Repeated work | Cache miss every time | Warm cache for similar tasks | OpenSpace Phase 2 pattern |
| Knowledge capture | Manual learning → manual skill | Auto: Learning 5x → auto skill promotion | New feature |
| Skill library growth | Manual creation only | Manual + auto CAPTURED from success | OpenSpace CAPTURED mode |

---

## V. TÓM TẮT

Bản đề xuất này kết hợp **3 siêu năng lực của OpenSpace** (Self-Evolution Engine, Quality Monitoring, Token Efficiency) vào **kiến trúc 5-Tier Brain vốn đã rất mạnh** của CodyMaster:

**1. Skill tự tiến hóa (OpenSpace → CodyMaster):** FIX sửa lỗi, DERIVED tạo biến thể chuyên biệt, CAPTURED bắt pattern mới — 3 triggers tự động sau mỗi execution, khi tool degradation, và periodic scan.

**2. Tiết kiệm token thật sự (-45%):** Progressive skill loading L0/L1/L2, warm execution cache, smart brain layer routing theo task type, quality-weighted skill selection chỉ inject 3-5 skills thay vì 68.

**3. Brain layers thông minh:** Thay vì load cố định mọi brain tier cho mọi task, SmartBrainRouter phân loại task → chọn subset brain layers tối thiểu. Kết hợp token budget enforcement per-tier.

**4. Vòng lặp học hỏi khép kín:** Learnings Ebbinghaus (CodyMaster) → reinforced 5x → auto promote thành skill (OpenSpace pattern) → skill evolution → tốt hơn → ít lỗi → ít learnings mới = hệ thống tự cải thiện liên tục.