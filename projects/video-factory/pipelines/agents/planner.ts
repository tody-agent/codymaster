import dotenv from 'dotenv';
import { HookFormula } from '../../src/lib/types';

dotenv.config();

// We removed OpenAI initialization to allow local-only execution.

export interface VideoPlan {
  idea: string;
  hook: string;
  hookFormula: HookFormula;
  coreMessage: string;
  cta: string;
}

export const plannerAgent = {
  async generatePlan(idea: string, language: 'vi' | 'en' = 'vi'): Promise<VideoPlan> {
    console.log(`[Planner] Generating plan for: "${idea}"`);
    
    // Fallback: If OpenAI isn't available, we return a deterministic CM AutoPilot plan.
    if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'dummy') {
      console.log(`[Planner] Fallback mode: Using pre-baked "CM AutoPilot" plan (No OpenAI Key)`);
      return {
        idea: "CM AutoPilot CLI",
        hook: "Mệt mỏi vì phải cấu hình kỹ thuật? CM AutoPilot đã có mặt!",
        hookFormula: 'negative_to_positive',
        coreMessage: "Trải nghiệm VibeCoding không giới hạn với CM AutoPilot.",
        cta: "Lưu ngay video này nhé!",
      };
    }

    // In a real environment with OpenAI:
    // const response = await openai.chat.completions.create(...)
    
    return {
      idea,
      hook: language === 'vi' ? "Bạn có biết bí mật này chưa?" : "Did you know this secret?",
      hookFormula: 'curiosity_gap',
      coreMessage: idea,
      cta: language === 'vi' ? "Lưu lại video này nhé!" : "Save this video for later!",
    };
  }
};
