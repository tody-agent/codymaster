# UX-Master Quick Start Guide
## Get Started in 5 Minutes

---

## 🎯 Choose Your Path

### Path 1: Figma Plugin (Recommended for Designers)
**Time:** 2 minutes | **Difficulty:** ⭐ Easy

```
Figma → Plugins → UX-Master → ✨ Generate Magic
```

### Path 2: MCP Server (For Teams)
**Time:** 5 minutes | **Difficulty:** ⭐⭐ Medium

```
Install CLI → Start MCP Server → Connect Cursor/Claude
```

### Path 3: CLI (For Power Users)
**Time:** 3 minutes | **Difficulty:** ⭐⭐⭐ Advanced

```
pip install uxmaster
uxm init --ai claude
```

---

## 🎨 Path 1: Figma Plugin (Easiest)

### Step 1: Install (30 seconds)

1. Open Figma (desktop or web)
2. Click **Plugins** in the menu
3. Select **Browse plugins in Community**
4. Search: "UX-Master"
5. Click **Install**

![Install Plugin](screenshots/install-plugin.png)

### Step 2: Generate Design System (1 minute)

1. Open any Figma file
2. Go to **Plugins → UX-Master**
3. In the **Generate** tab, type:
   ```
   A fintech dashboard with dark mode and real-time charts
   ```
4. Click **✨ Generate Magic**
5. Wait 2-3 seconds

![Generate UI](screenshots/generate-ui.png)

### Step 3: Apply to Figma (30 seconds)

You'll see:
- 🎨 Color palette (primary, secondary, accent)
- ✍️ Typography recommendations
- 🧠 UX Laws applied (e.g., "Fitts's Law: 48px touch targets")
- ✓ Design Tests passed

Click **"Apply to Figma"** to create Variables automatically!

---

## 🖥️ Path 2: MCP Server (For Teams)

### What is MCP?
MCP = Model Context Protocol. It lets AI assistants (Claude, Cursor) use UX-Master tools directly.

### Step 1: Install CLI

```bash
# Install UX-Master CLI
pip install uxmaster[mcp]

# Or with pipx (recommended)
pipx install uxmaster[mcp]
```

### Step 2: Start MCP Server

```bash
# Start the server
uxm mcp start

# Or run in background
uxm mcp start -d

# Check status
uxm mcp status
```

You should see:
```
✓ MCP Server running on http://localhost:3000
✓ 8 tools available
```

### Step 3: Configure Your AI Assistant

#### For Claude Code

Add to `.claude/settings.json`:
```json
{
  "mcpServers": {
    "ux-master": {
      "command": "python",
      "args": ["-m", "mcp.server"],
      "env": {
        "PORT": "3000"
      }
    }
  }
}
```

#### For Cursor

Add to `.cursor/mcp.json`:
```json
{
  "mcpServers": {
    "ux-master": {
      "url": "http://localhost:3000"
    }
  }
}
```

### Step 4: Use in AI Chat

Now you can ask:

```
"Create a landing page for my SaaS product"
```

The AI will:
1. Call UX-Master to generate design system
2. Apply 48 UX Laws automatically
3. Show you the results with recommendations

---

## 💻 Path 3: CLI Commands

### Basic Commands

```bash
# Install UX-Master
pip install uxmaster

# Install for specific AI assistant
uxm init --ai claude

# Generate design system
uxm search "fintech dashboard" --design-system

# Search UX Laws
uxm search "mobile touch targets" --domain ux-laws

# Validate HTML file
uxm validate index.html --suite mobile
```

### Example: Complete Workflow

```bash
# 1. Install for Claude Code
uxm init --ai claude

# 2. Generate design system
uxm search "healthcare app for elderly" --design-system -p "CareConnect"

# Output:
# 🎨 Style: Soft UI Evolution
# 🎨 Colors: #3B82F6 primary, #10B981 success
# ✍️ Typography: Inter / 16px body
# 🧠 UX Laws: Fitts's Law (48px targets), High contrast (WCAG AAA)

# 3. Persist for later use
uxm search "healthcare app" --design-system --persist -p "CareConnect"
# Creates: design-system/careconnect/MASTER.md

# 4. Search specific UX Laws for mobile
uxm search "mobile app fitts" --domain ux-laws -n 3

# 5. Get design tests for validation
uxm search "mobile touch target" --domain design-tests
```

---

## 🎯 Common Tasks

### Task: Generate Color Palette

**Figma Plugin:**
1. Open UX-Master plugin
2. Click **Generate**
3. Type: "A luxury jewelry e-commerce site"
4. See color palette with gold accents

**CLI:**
```bash
uxm search "luxury jewelry e-commerce" --domain color -n 5
```

### Task: Validate Mobile Design

**Figma Plugin:**
1. Select your mobile frame
2. Open UX-Master → **Validate** tab
3. Click **Validate Selection**
4. See pass/fail results

**CLI:**
```bash
uxm validate mobile-design.html --suite mobile
```

### Task: Extract from Website

**Figma Plugin:**
1. Go to **Import** tab
2. Paste URL: `https://linear.app`
3. Click **Extract**

**CLI:**
```bash
uxm extract https://linear.app --output linear-tokens.json
```

---

## 📊 Understanding Output

### Design System Output Example

```
┌─────────────────────────────────────────────────────────────┐
│  UX-MASTER DESIGN SYSTEM: CareConnect                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  PATTERN: Dashboard + Progressive Disclosure                │
│     Sections: Hero > Stats > Patients > Actions             │
│                                                             │
│  STYLE: Soft UI Evolution                                   │
│     Keywords: Calming, trustworthy, accessible              │
│     Best For: Healthcare, elderly users                     │
│                                                             │
│  COLORS:                                                    │
│     Primary:    #3B82F6 (Trust Blue)                        │
│     Secondary:  #64748B (Slate)                             │
│     CTA:        #10B981 (Health Green)                      │
│     Background: #F8FAFC (Clean White)                       │
│     Text:       #1E293B (Dark Slate)                        │
│                                                             │
│  TYPOGRAPHY: Inter / Inter                                  │
│     Mood: Clean, accessible, professional                   │
│     Minimum: 16px body (accessibility)                      │
│                                                             │
│  APPLICABLE UX LAWS (5):                                    │
│     • Fitts's Law → 48px touch targets                      │
│     • Miller's Law → Max 7 items per view                   │
│     • Contrast → WCAG AAA compliance                        │
│     • Hick's Law → 2 primary CTAs                           │
│     • Doherty → Skeleton loaders                            │
│                                                             │
│  DESIGN TESTS:                                              │
│     ✅ DT-MOB-001 Touch targets ≥ 44px                      │
│     ✅ DT-MOB-002 Primary actions in thumb zone             │
│     ✅ DT-A11Y-001 Contrast ≥ 4.5:1                         │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 🆘 Troubleshooting

### Issue: Plugin Not Working

**Solution:**
1. Refresh Figma (Cmd/Ctrl + R)
2. Reinstall plugin
3. Check console for errors

### Issue: MCP Server Won't Start

**Solution:**
```bash
# Check if port is in use
lsof -i :3000

# Use different port
PORT=8080 uxm mcp start

# Check dependencies
pip install uxmaster[mcp] --upgrade
```

### Issue: No Results

**Solution:**
- Check internet connection
- Try simpler query
- Verify MCP server is running: `uxm mcp status`

---

## 📚 Next Steps

### Learn More
- [48 UX Laws Explained](/docs/ux-laws.md)
- [37 Design Tests Reference](/docs/design-tests.md)
- [Figma Plugin Guide](/docs/figma-plugin.md)

### Join Community
- Discord: [discord.gg/uxmaster](https://discord.gg/uxmaster)
- Twitter: [@uxmasterdev](https://twitter.com/uxmasterdev)

---

## ✅ Checklist

- [ ] Installed UX-Master (Figma plugin or CLI)
- [ ] Generated first design system
- [ ] Reviewed UX Laws applied
- [ ] Validated a design
- [ ] Exported to Figma Variables (if using plugin)
- [ ] Shared with team!

**You're ready to create amazing designs with AI! 🎉**
