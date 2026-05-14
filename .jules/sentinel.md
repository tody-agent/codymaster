## 2024-05-18 - [Command Injection via execSync in TDD Gate]
**Vulnerability:** A critical command injection vulnerability existed in `src/execution/tdd-gate.ts`. The `testFile` variable, containing user-influenced input (file paths), was concatenated directly into a shell command using `execSync(\`npx vitest run ${testFile}...\`)`.
**Learning:** Shell metacharacters in the path could execute arbitrary commands. For example, a file path like `test; rm -rf /` would be interpreted by the shell.
**Prevention:** Always avoid shell execution when handling file paths or user input. Use safe subprocess functions like `execFileSync` or `spawnSync` and pass arguments as an array instead of a string.
