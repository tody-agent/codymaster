"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateProjectSkillsIndex = generateProjectSkillsIndex;
const skills_lib_1 = require("./skills-lib");
/**
 * Parses the project directory to detect the tech stack (using deterministic config file checks)
 * and returns a miniaturized list of recommended AI skills.
 */
function generateProjectSkillsIndex(projectDir) {
    const { detected, isFrontend, combos } = (0, skills_lib_1.detectTechnologies)(projectDir);
    const skills = (0, skills_lib_1.collectSkills)({ detected, isFrontend, combos });
    return {
        detectedTechnologies: detected.map((tech) => tech.name),
        recommendedSkills: skills.map((s) => s.skill),
    };
}
