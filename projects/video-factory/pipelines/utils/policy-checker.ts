// pipelines/utils/policy-checker.ts
import { VideoScript } from '../../src/lib/types';

export const policyChecker = {
  check(script: VideoScript): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // TikTok Policy: Must have clear AI disclosure if 100% AI
    if (script.metadata?.ai_generated && !script.metadata?.ai_disclosure) {
      errors.push("Policy Violation (TikTok/Recs): missing ai_disclosure in metadata.");
    }

    // TikTok Policy: No more than 3 hashtags for peak algorithm
    if (script.hashtags && script.hashtags.length > 5) {
      errors.push("Optimization Warning: too many hashtags for TikTok algorithm (recommend <= 3-5).");
    }

    // YouTube Shorts: Max 60 seconds
    if (script.format === 'tiktok' && script.duration_target > 60) {
      errors.push("Policy Violation: TikTok/Shorts format target over 60 seconds.");
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
};
