import { detectTechnologies, collectSkills } from "./skills-lib";

export interface ProjectSkillsIndex {
  detectedTechnologies: string[];
  recommendedSkills: string[];
}

/**
 * Parses the project directory to detect the tech stack (using deterministic config file checks)
 * and returns a miniaturized list of recommended AI skills.
 */
export function generateProjectSkillsIndex(projectDir: string): ProjectSkillsIndex {
  const { detected, isFrontend, combos } = detectTechnologies(projectDir);
  const skills = collectSkills({ detected, isFrontend, combos });

  return {
    detectedTechnologies: detected.map((tech) => tech.name),
    recommendedSkills: skills.map((s) => s.skill),
  };
}
