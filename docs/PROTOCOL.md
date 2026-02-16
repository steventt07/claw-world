# Universal Agent Protocol

Vibecraft2 can visualize **any** AI agent, not just Claude Code. This document describes how to integrate your agent framework with Vibecraft2.

## Quick Start

### Option 1: Use the SDK (TypeScript/JavaScript)

```typescript
import { Vibecraft2Client } from 'vibecraft2/sdk'

const client = new Vibecraft2Client('http://localhost:4003')

// Register your agent
const agentId = await client.register('My Agent', 'my-framework')

// Report tool usage
await client.toolStart({
  name: 'readFile',
  category: 'read',
  id: 'tool-001',
  context: 'config.json'
})

// ... tool executes ...

await client.toolEnd({
  name: 'readFile',
  category: 'read',
  id: 'tool-001',
  success: true,
  duration: 150
})

// Signal idle
await client.idle()
```

### Option 2: HTTP API (any language)

```bash
# Register agent
curl -X POST http://localhost:4003/v2/agents/register \
  -H 'Content-Type: application/json' \
  -d '{"name": "My Agent", "framework": "python-agent"}'
# Returns: {"ok": true, "agent": {"agentId": "abc-123", ...}}

# Send events
curl -X POST http://localhost:4003/v2/event \
  -H 'Content-Type: application/json' \
  -d '{
    "type": "tool_start",
    "agentId": "abc-123",
    "source": "python-agent",
    "tool": {"name": "web_search", "category": "search", "id": "t1"},
    "context": "latest news"
  }'
```

## Event Types

All events share a common base:

```typescript
interface AgentEvent {
  id: string           // Unique event ID (auto-generated if omitted)
  timestamp: number    // Unix ms (auto-generated if omitted)
  type: AgentEventType // Event type (see below)
  agentId: string      // Your agent's ID
  source: string       // Framework identifier
  cwd?: string         // Working directory
  metadata?: object    // Arbitrary extra data
}
```

### Tool Events

| Type | Description | Required Fields |
|------|-------------|-----------------|
| `tool_start` | Tool begins execution | `tool: {name, category, id}` |
| `tool_end` | Tool finishes | `tool: {name, category, id}, success` |

```json
{
  "type": "tool_start",
  "tool": {
    "name": "read_file",
    "category": "read",
    "id": "unique-tool-use-id"
  },
  "input": {"file_path": "/app/config.json"},
  "context": "config.json"
}
```

### Lifecycle Events

| Type | Description | Required Fields |
|------|-------------|-----------------|
| `agent_start` | Agent begins | `trigger?` |
| `agent_end` | Agent terminates | `reason?` |
| `agent_idle` | Agent is waiting | `reason?, response?` |
| `agent_thinking` | Agent is processing | _(none)_ |

### Interaction Events

| Type | Description | Required Fields |
|------|-------------|-----------------|
| `user_input` | User sends input | `text` |
| `notification` | System notification | `message, level?` |

### Sub-agent Events

| Type | Description | Required Fields |
|------|-------------|-----------------|
| `subagent_spawn` | Sub-agent created | `parentAgentId, toolUseId?` |
| `subagent_end` | Sub-agent finished | `toolUseId?` |

## Tool Categories

Every tool must specify a `category` that determines which visualization station it maps to:

| Category | Station | Description | Examples |
|----------|---------|-------------|----------|
| `read` | Bookshelf | Reading data | file read, DB query |
| `write` | Desk | Creating files | file create, upload |
| `edit` | Workbench | Modifying files | file edit, patch |
| `execute` | Terminal | Running commands | shell, subprocess |
| `search` | Scanner | Searching | grep, find, DB search |
| `network` | Antenna | HTTP/network | API call, web fetch |
| `delegate` | Portal | Sub-agents | task delegation |
| `plan` | Taskboard | Planning | todo, task management |
| `interact` | Center | User interaction | questions, prompts |
| `other` | Center | Uncategorized | fallback |

## API Endpoints

### `POST /v2/agents/register`

Register a new agent. Returns an `agentId` for subsequent events.

**Request:**
```json
{
  "name": "My Agent",
  "framework": "langchain",
  "cwd": "/path/to/project",
  "metadata": {"version": "1.0"}
}
```

**Response:**
```json
{
  "ok": true,
  "agent": {
    "agentId": "generated-uuid",
    "name": "My Agent",
    "framework": "langchain",
    "registeredAt": 1707000000000
  }
}
```

### `POST /v2/event`

Send a universal-format event.

**Request:** Any `AgentEvent` (see types above)

**Response:**
```json
{"ok": true}
```

### `POST /event` (legacy)

Accepts events in any supported format. The server auto-detects whether the event is:
1. Already in universal format → used directly
2. Claude Code format → normalized via adapter
3. Unknown → rejected

## Adapters

Adapters normalize framework-specific events into the universal format. Built-in adapters:

- **`claude-code`** — Normalizes Claude Code hook events (`pre_tool_use` → `tool_start`, etc.)
- **`generic`** — Pass-through for events already in universal format

### Writing a Custom Adapter

```typescript
import type { EventAdapter } from 'vibecraft2/adapters'

class MyFrameworkAdapter implements EventAdapter {
  readonly name = 'my-framework'

  canHandle(raw: Record<string, unknown>): boolean {
    return raw.framework === 'my-framework'
  }

  categorize(toolName: string): ToolCategory {
    // Map your tool names to categories
    if (toolName === 'file_reader') return 'read'
    return 'other'
  }

  normalize(raw: Record<string, unknown>): UniversalEvent | null {
    // Transform your event format to AgentEvent
    return {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      type: 'tool_start',
      agentId: raw.agentId as string,
      source: this.name,
      tool: {
        name: raw.toolName as string,
        category: this.categorize(raw.toolName as string),
        id: raw.callId as string,
      },
    }
  }
}
```

## Integration Examples

### Python Agent

```python
import requests
import uuid

SERVER = "http://localhost:4003"

# Register
resp = requests.post(f"{SERVER}/v2/agents/register", json={
    "name": "Python Agent",
    "framework": "custom-python"
})
agent_id = resp.json()["agent"]["agentId"]

# Tool start
tool_id = str(uuid.uuid4())
requests.post(f"{SERVER}/v2/event", json={
    "type": "tool_start",
    "agentId": agent_id,
    "source": "custom-python",
    "tool": {"name": "web_scrape", "category": "network", "id": tool_id},
    "context": "example.com"
})

# Tool end
requests.post(f"{SERVER}/v2/event", json={
    "type": "tool_end",
    "agentId": agent_id,
    "source": "custom-python",
    "tool": {"name": "web_scrape", "category": "network", "id": tool_id},
    "success": True,
    "duration": 1200
})
```

### LangChain Callback

```python
from langchain.callbacks.base import BaseCallbackHandler

class Vibecraft2Callback(BaseCallbackHandler):
    def __init__(self, server_url="http://localhost:4003"):
        self.server = server_url
        self.agent_id = None

    def on_tool_start(self, serialized, input_str, **kwargs):
        tool_name = serialized.get("name", "unknown")
        requests.post(f"{self.server}/v2/event", json={
            "type": "tool_start",
            "agentId": self.agent_id,
            "source": "langchain",
            "tool": {
                "name": tool_name,
                "category": self._categorize(tool_name),
                "id": kwargs.get("run_id", str(uuid.uuid4()))
            }
        })

    def _categorize(self, tool_name):
        categories = {
            "search": "search",
            "wikipedia": "network",
            "python_repl": "execute",
        }
        return categories.get(tool_name, "other")
```

## Backward Compatibility

The existing Claude Code integration works unchanged:
- The hook script (`vibecraft2-hook.sh`) continues to POST events in Claude Code format
- The `POST /event` endpoint auto-detects and normalizes these events
- All existing event types (`pre_tool_use`, `post_tool_use`, etc.) are fully supported
- Existing WebSocket clients receive events in the same format as before
