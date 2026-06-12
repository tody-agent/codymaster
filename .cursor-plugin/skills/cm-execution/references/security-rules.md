# Security Rules (Learned: March 2026)

> Code that touches files, subprocesses, or the DOM MUST follow these rules. No exceptions.

Load this reference when the task involves auth, files, subprocesses, user input, DOM rendering, config paths, or deploy.

## Frontend — DOM Safety

| Pattern | Risk | Fix |
|---|---|---|
| `innerHTML = \`...${data}...\`` | DOM XSS | `innerHTML = \`...${esc(data)}...\`` |
| `innerHTML = variable` | DOM XSS | `textContent = variable` |
| `eval(input)` / `new Function(input)` | Code injection | Avoid entirely |
| `document.write(data)` | DOM XSS | Use DOM API |
| `el.setAttribute('on*', data)` | Event injection | `el.addEventListener()` |

Always escape before `innerHTML`, prefer `textContent`, and validate URLs via allowlist.

## Backend — Python

| Pattern | Risk | Fix |
|---|---|---|
| `Path(user_input) / "file"` | Path Traversal | `safe_resolve(base, user_input)` |
| `subprocess.run(f"cmd {arg}", shell=True)` | Command Injection | `subprocess.run(["cmd", arg])` |
| `open(config["path"])` | Path Traversal | `safe_open(base, config["path"])` |
| `json.load()` paths unvalidated | Path Traversal | Validate all paths from config via `safe_resolve()` |

Always validate every path from CLI, config, or API against a base directory.

## Backend — Express / Node

| Pattern | Risk | Fix |
|---|---|---|
| Missing `app.disable('x-powered-by')` | Info leak | Add after `express()` |
| No body size limit | DoS | `express.json({ limit: '1mb' })` |
| `path.resolve(userInput)` without validation | Path Traversal | Check null bytes + ensure path stays under base dir |
| `Object.assign(config, userInput)` | Prototype Pollution | Filter `__proto__` and `constructor` keys |

## Mandatory Checklist
- [ ] All user input flowing into FS / subprocess / DOM has been listed
- [ ] Each entry has explicit validation or escaping
- [ ] No `shell=True`, `eval`, or unsafe `innerHTML` interpolation remains
- [ ] Path inputs are validated against a base directory
- [ ] Test added that proves validation works on a malicious payload

## Escalation
If you cannot make the code safe within task scope, do not ship. Mark the task `blocked` with reason `security-gap` and dispatch the repo's security review flow.
