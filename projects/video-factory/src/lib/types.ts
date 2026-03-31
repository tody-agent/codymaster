// src/lib/types.ts — Shared types for the Video Factory pipeline

/** A single scene within a video script */
export interface VideoScene {
  time_start: number;
  duration: number;
  text: string;
  visual: ComponentName;
  props?: Record<string, unknown>;
  transition?: "cut" | "fade" | "slide_up" | "slide_left" | "zoom_in" | "glitch";
}

/** Available visual component names */
export type ComponentName =
  | "DarkTerminal"
  | "VsCodeGlow"
  | "BouncingSubtitle"
  | "StatCounter"
  | "SplitScreen"
  | "CodeDiff"
  | "FloatingCard"
  | "ProgressRing"
  | "TerminalCrashView"
  | "CodeGlowView"
  | "TitleCard"
  | "EndCard";

/** Hook formula identifiers */
export type HookFormula =
  | "data_shock" | "contrarian" | "future_pacing" | "story_open"
  | "authority" | "curiosity_gap" | "fear" | "social_proof"
  | "challenge" | "comparison" | "reveal" | "empathy";

/** TTS engine selection */
export type TTSEngine = "vieneu" | "elevenlabs" | "openai" | "auto";

/** Video format */
export type VideoFormat = "tiktok" | "youtube" | "both";

/** Complete video script (JSON input to the pipeline) */
export interface VideoScript {
  id: string;
  title: string;
  hook: string;
  hook_formula?: HookFormula;
  language: "vi" | "en";
  duration_target: number;
  format: VideoFormat;
  scenes: VideoScene[];
  cta: string;
  hashtags?: string[];
  metadata?: {
    ai_generated: boolean;
    ai_disclosure?: string;
    thumbnail_prompt?: string;
    seo_description?: string;
  };
  tts_config?: {
    engine?: TTSEngine;
    voice?: string;
    speed?: number;
    ref_audio?: string;
  };
}

/** Job status in the batch queue */
export type JobStatus = "queued" | "planning" | "researching" | "scripting" | "tts" | "rendering" | "publishing" | "done" | "failed";

/** A single job in the batch queue */
export interface QueueJob {
  id: string;
  idea: string;
  script_path?: string;
  audio_path?: string;
  video_path?: string;
  nlm_notebook_id?: string;
  nlm_audio_url?: string;
  status: JobStatus;
  error?: string;
  attempts: number;
  created_at: string;
  updated_at: string;
}

/** Batch queue file format */
export interface BatchQueue {
  batch_id: string;
  created_at: string;
  config: {
    format: VideoFormat;
    language: "vi" | "en";
    tts_engine: TTSEngine;
    concurrency: number;
    retry_max: number;
    publish_platforms: string[];
  };
  jobs: QueueJob[];
}

/** Progress tracking file format */
export interface BatchProgress {
  batch_id: string;
  total: number;
  completed: number;
  failed: number;
  in_progress: number;
  queued: number;
  estimated_remaining_minutes: number;
  last_updated: string;
}

/** Platform publish config */
export interface PublishConfig {
  platform: "youtube" | "tiktok" | "reels";
  title: string;
  description: string;
  hashtags: string[];
  ai_disclosure: string;
  schedule_time?: string;
  video_path: string;
}
