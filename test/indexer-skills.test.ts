import { describe, it, expect } from "vitest";
import { generateProjectSkillsIndex } from "../src/indexer/skills";
import * as fs from "node:fs";
import * as path from "node:path";

describe("Skill Indexer", () => {
  it("should detect Next.js and return its associated skills", () => {
    // We will run this on a dummy directory that has a next.config.js
    const testDir = path.join(__dirname, "fixtures", "nextjs-project");
    
    // Create fixture if not exists
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }
    fs.writeFileSync(path.join(testDir, "next.config.js"), "module.exports = {};");
    fs.writeFileSync(
      path.join(testDir, "package.json"),
      JSON.stringify({ dependencies: { next: "latest", react: "latest", "react-dom": "latest" } })
    );

    const result = generateProjectSkillsIndex(testDir);
    
    expect(result.detectedTechnologies).toContain("Next.js");
    expect(result.detectedTechnologies).toContain("React");
    expect(result.recommendedSkills).toContain("vercel-labs/next-skills/next-best-practices");
    
    // Cleanup
    fs.unlinkSync(path.join(testDir, "next.config.js"));
    fs.unlinkSync(path.join(testDir, "package.json"));
    fs.rmdirSync(testDir);
  });
});
