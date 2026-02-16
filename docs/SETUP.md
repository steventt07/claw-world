# Vibecraft2 Setup Guide

Complete installation and troubleshooting guide for Vibecraft2.

## What is Vibecraft2?

Vibecraft2 visualizes Claude Code's activity in real-time as a 3D workshop. When Claude uses tools (Read, Edit, Bash, etc.), a character moves to corresponding workstations.

**Two parts:**
1. **Hooks** - Capture events from Claude Code
2. **Server** - WebSocket server + 3D browser visualization

```
┌─────────────────┐      hooks       ┌─────────────────┐
│  Claude Code    │ ───────────────→ │  Vibecraft2      │
│  (your CLI)     │                  │  Server (:4003) │
└─────────────────┘                  └────────┬────────┘
                                              │
                                              ↓ WebSocket
                                     ┌─────────────────┐
                                     │  Browser        │
                                     │  (3D Scene)     │
                                     └─────────────────┘
```

---

## Quick Start (3 steps)

### Step 1: Install dependencies

```bash
# macOS
brew install jq tmux

# Ubuntu/Debian
sudo apt install jq tmux

# Arch
pacman -S jq tmux
```

### Step 2: Configure hooks

```bash
npx vibecraft2 setup
```

This automatically adds hooks to `~/.claude/settings.json`.

### Step 3: Start server and use Claude

```bash
# Terminal 1: Start Vibecraft2 server
npx vibecraft2

# Terminal 2: Use Claude Code normally
claude
```

Open http://localhost:4003 in your browser.

**That's it!** Every time Claude uses a tool, you'll see it in the 3D visualization.

---

## Prerequisites Explained

| Dependency | Required? | Purpose |
|------------|-----------|---------|
| **Node.js 18+** | Yes | Runs the server |
| **jq** | Yes | JSON processing in hook scripts |
| **tmux** | Optional | Session management, browser→Claude prompts |

**Check if installed:**
```bash
node --version   # Should be 18+
jq --version     # Should output version
tmux -V          # Should output version (optional)
```

---

## Hook Configuration Options

### Option A: Automatic (Recommended)

```bash
npx vibecraft2 setup
```

This:
- Copies hook script to `~/.vibecraft2/hooks/vibecraft2-hook.sh`
- Creates `~/.vibecraft2/data/` directory
- Configures all 8 hooks in `~/.claude/settings.json`
- Backs up existing settings
- Checks for jq/tmux

**After setup, restart Claude Code for hooks to take effect.**

### Option B: Manual Configuration

If you prefer to configure hooks manually, add to `~/.claude/settings.json`:

```json
{
  "hooks": {
    "PreToolUse": [
      { "matcher": "*", "hooks": [{"type": "command", "command": "HOOK_PATH", "timeout": 5}] }
    ],
    "PostToolUse": [
      { "matcher": "*", "hooks": [{"type": "command", "command": "HOOK_PATH", "timeout": 5}] }
    ],
    "Stop": [
      { "hooks": [{"type": "command", "command": "HOOK_PATH", "timeout": 5}] }
    ],
    "SubagentStop": [
      { "hooks": [{"type": "command", "command": "HOOK_PATH", "timeout": 5}] }
    ],
    "SessionStart": [
      { "hooks": [{"type": "command", "command": "HOOK_PATH", "timeout": 5}] }
    ],
    "SessionEnd": [
      { "hooks": [{"type": "command", "command": "HOOK_PATH", "timeout": 5}] }
    ],
    "UserPromptSubmit": [
      { "hooks": [{"type": "command", "command": "HOOK_PATH", "timeout": 5}] }
    ],
    "Notification": [
      { "hooks": [{"type": "command", "command": "HOOK_PATH", "timeout": 5}] }
    ]
  }
}
```

Replace `HOOK_PATH` with the output of:
```bash
npx vibecraft2 --hook-path
```

**Note:** You must also copy the hook script to a stable location and ensure `~/.vibecraft2/data/` exists.

---

## What "Agent Not Connected" Means

If you see this overlay in the browser:

```
┌──────────────────────────────────┐
│                                  │
│     🔌 Agent Not Connected       │
│                                  │
│  Vibecraft2 needs a local agent   │
│  running to receive events.      │
│                                  │
│       [ npx vibecraft2 ]          │
│                                  │
└──────────────────────────────────┘
```

**It means ONE of these:**

| Problem | Solution |
|---------|----------|
| Server not running | Run `npx vibecraft2` in a terminal |
| Wrong port | Check URL matches server port (default: 4003) |
| Hooks not configured | Run `npx vibecraft2 setup` |

**Quick test:**
```bash
# Check server is running
curl http://localhost:4003/health
# Should return: {"ok":true,...}
```

---

## Sending Prompts from Browser

To send prompts to Claude from the Vibecraft2 UI:

### Step 1: Run Claude in tmux

```bash
# Create named tmux session
tmux new -s claude

# Start Claude inside tmux
claude
```

### Step 2: Use Vibecraft2 normally

```bash
# In another terminal
npx vibecraft2
```

### Step 3: Send prompts

In the browser, type in the prompt field and click "Send" with "Send to tmux" checked.

**Note:** If you named your tmux session something other than `claude`:
```bash
VIBECRAFT2_TMUX_SESSION=myname npx vibecraft2
```

---

## Common Issues

### "jq: command not found"

```bash
# macOS
brew install jq

# Ubuntu/Debian
sudo apt install jq

# Arch
pacman -S jq
```

### "Permission denied" on hook script

```bash
chmod +x $(npx vibecraft2 --hook-path)
```

### Events not appearing

**1. Check server is running:**
```bash
curl http://localhost:4003/health
```

**2. Check hooks are configured:**
```bash
cat ~/.claude/settings.json | grep vibecraft2
```

**3. Restart Claude Code** (hooks load at startup)

### "Can't connect to tmux session"

```bash
# List sessions
tmux list-sessions

# Default session name is 'claude'
# If different, set environment variable:
VIBECRAFT2_TMUX_SESSION=yourname npx vibecraft2
```

### Events appearing twice

You likely have duplicate hooks configured. Check `~/.claude/settings.json` for duplicate vibecraft2-hook entries and remove extras. Then run `npx vibecraft2 setup` to ensure correct configuration.

### Browser shows "Disconnected"

- Refresh the page
- Check if server is still running
- Check browser console for errors

---

## Voice Input (Optional)

For speech-to-text prompts:

1. Sign up at [deepgram.com](https://deepgram.com)
2. Create an API key
3. Add to your `.env` file:
   ```bash
   DEEPGRAM_API_KEY=your_api_key_here
   ```
4. Restart the server
5. Press `Alt+S` or click the microphone icon

---

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `VIBECRAFT2_PORT` | `4003` | Server port |
| `VIBECRAFT2_TMUX_SESSION` | `claude` | tmux session for prompts |
| `VIBECRAFT2_DEBUG` | `false` | Verbose logging |
| `DEEPGRAM_API_KEY` | (none) | Deepgram API key for voice input |

Example:
```bash
VIBECRAFT2_PORT=4005 VIBECRAFT2_DEBUG=true npx vibecraft2
```

---

## Development Setup

For contributing or modifying:

```bash
# Clone
git clone https://github.com/nearcyan/vibecraft2
cd vibecraft2

# Install dependencies
npm install

# Start dev servers (frontend :4002, API :4003)
npm run dev

# Open browser
open http://localhost:4002
```

**Note:** In dev mode, frontend and API run on different ports. In production (`npx vibecraft2`), everything runs on port 4003.

---

## Uninstalling

To remove Vibecraft2 hooks (keeps your event data):

```bash
npx vibecraft2 uninstall
```

This:
- Removes vibecraft2 hooks from `~/.claude/settings.json`
- Removes the hook script from `~/.vibecraft2/hooks/`
- **Keeps** your data in `~/.vibecraft2/data/`
- Does NOT affect other hooks you may have configured

To completely remove all data:

```bash
rm -rf ~/.vibecraft2
```

**Restart Claude Code after uninstalling for changes to take effect.**

---

## Getting Help

- **GitHub Issues:** https://github.com/nearcyan/vibecraft2/issues
- **Technical Docs:** See [CLAUDE.md](../CLAUDE.md)
- **Orchestration:** See [ORCHESTRATION.md](./ORCHESTRATION.md)
