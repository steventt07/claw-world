/**
 * Research Sprint Scenario
 *
 * Single session doing heavy WebSearch/WebFetch research, then a burst of
 * Write/Edit/Bash building. 1 zone, shows "learn then build" pattern.
 *
 * Timeline (~25s cycle at 2x):
 *   Research phase (0-14s): WebSearch → WebFetch → WebSearch → Read → WebFetch → Read
 *   Build phase (15-25s):   Write → Write → Edit → Bash test → Edit → Bash build → stop
 */

import type { ManagedSession } from '../../../shared/types'
import type { DemoScenarioBundle } from '../types'
import { SPEED, DEMO_CWD, timedToolPair, toSteps, type TimedEvent } from '../helpers'

// ============================================================================
// Session / Managed IDs
// ============================================================================

const SID = 'demo-research-session-0001'
const MID = 'demo-managed-research-0001'

const SESSION_IDS = [SID] as const
const MANAGED_IDS = [MID] as const

// ============================================================================
// Managed Sessions
// ============================================================================

function createManagedSessions(): ManagedSession[] {
  const now = Date.now()
  return [
    { id: MID, name: 'Research Sprint', tmuxSession: 'demo-research', status: 'idle', claudeSessionId: SID, createdAt: now, lastActivity: now, cwd: DEMO_CWD },
  ]
}

// ============================================================================
// Scenario
// ============================================================================

function createResearchScenario() {
  const all: TimedEvent[] = []

  all.push({
    time: 0,
    event: { type: 'user_prompt_submit', sessionId: SID, cwd: DEMO_CWD, prompt: 'Research WebSocket best practices and implement a real-time notification system' },
  })

  // --- Research Phase: heavy antenna + bookshelf ---

  all.push(...timedToolPair({
    sessionId: SID, tool: 'WebSearch',
    toolInput: { query: 'WebSocket vs SSE real-time notifications 2025' },
    toolResponse: { results: [{ title: 'WebSocket vs SSE: When to Use Each' }, { title: 'Real-time Notifications Architecture' }] },
    preTime: 1500, postTime: 3500,
    assistantText: "Let me research the best approach for real-time notifications.",
  }))

  all.push(...timedToolPair({
    sessionId: SID, tool: 'WebFetch',
    toolInput: { url: 'https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API', prompt: 'WebSocket API usage patterns' },
    toolResponse: { content: 'The WebSocket API provides a persistent connection...' },
    preTime: 5000, postTime: 7000,
    assistantText: "Reading the MDN docs on WebSocket API.",
  }))

  all.push(...timedToolPair({
    sessionId: SID, tool: 'WebSearch',
    toolInput: { query: 'ws library node.js reconnection heartbeat patterns' },
    toolResponse: { results: [{ title: 'ws: Node.js WebSocket Library' }, { title: 'Production WebSocket Best Practices' }] },
    preTime: 8500, postTime: 10500,
    assistantText: "Searching for production-ready WebSocket patterns in Node.js.",
  }))

  all.push(...timedToolPair({
    sessionId: SID, tool: 'Read',
    toolInput: { file_path: 'package.json' },
    toolResponse: { content: '{ "dependencies": { "express": "^4.18.0" } }' },
    preTime: 12000, postTime: 12700,
    assistantText: "Checking existing dependencies before adding ws.",
  }))

  all.push(...timedToolPair({
    sessionId: SID, tool: 'WebFetch',
    toolInput: { url: 'https://github.com/websockets/ws/blob/master/README.md', prompt: 'ws library API and configuration' },
    toolResponse: { content: 'const wss = new WebSocketServer({ port: 8080 })...' },
    preTime: 14500, postTime: 16500,
    assistantText: "Reading the ws library docs for API patterns.",
  }))

  all.push(...timedToolPair({
    sessionId: SID, tool: 'Read',
    toolInput: { file_path: 'server/index.ts' },
    toolResponse: { content: '// Express server setup...' },
    preTime: 18000, postTime: 18700,
    assistantText: "Understanding the existing server setup before adding WebSocket support.",
  }))

  // --- Build Phase: burst of Write/Edit/Bash ---

  all.push(...timedToolPair({
    sessionId: SID, tool: 'Write',
    toolInput: { file_path: 'server/websocket/NotificationServer.ts', content: '// WebSocket notification server with heartbeat, reconnection...' },
    preTime: 20500, postTime: 21800,
    assistantText: "Creating the WebSocket notification server with heartbeat support.",
  }))

  all.push(...timedToolPair({
    sessionId: SID, tool: 'Write',
    toolInput: { file_path: 'server/websocket/types.ts', content: '// Notification types: alert, info, warning...' },
    preTime: 23000, postTime: 23800,
    assistantText: "Defining notification event types.",
  }))

  all.push(...timedToolPair({
    sessionId: SID, tool: 'Write',
    toolInput: { file_path: 'src/hooks/useNotifications.ts', content: '// React hook for WebSocket notifications...' },
    preTime: 25500, postTime: 26500,
    assistantText: "Building the React hook for consuming notifications.",
  }))

  all.push(...timedToolPair({
    sessionId: SID, tool: 'Edit',
    toolInput: { file_path: 'server/index.ts', old_string: "app.listen(PORT", new_string: "// Upgrade HTTP server for WebSocket\nconst server = app.listen(PORT" },
    preTime: 28000, postTime: 28500,
    assistantText: "Integrating the WebSocket server with the Express app.",
  }))

  all.push(...timedToolPair({
    sessionId: SID, tool: 'Bash',
    toolInput: { command: 'npm install ws && npx tsc --noEmit' },
    toolResponse: { stdout: 'added 1 package\nNo errors found.' },
    preTime: 30000, postTime: 32500,
    assistantText: "Installing ws and verifying the build.",
  }))

  all.push(...timedToolPair({
    sessionId: SID, tool: 'Edit',
    toolInput: { file_path: 'src/App.tsx', old_string: '<NotificationProvider>', new_string: '<WebSocketProvider>\n  <NotificationProvider>' },
    preTime: 34000, postTime: 34500,
    assistantText: "Wrapping the app with the WebSocket provider.",
  }))

  all.push(...timedToolPair({
    sessionId: SID, tool: 'Write',
    toolInput: { file_path: 'server/tests/websocket.test.ts', content: '// WebSocket integration tests...' },
    preTime: 36000, postTime: 37000,
    assistantText: "Writing integration tests for the WebSocket server.",
  }))

  all.push(...timedToolPair({
    sessionId: SID, tool: 'Bash',
    toolInput: { command: 'npx vitest run server/tests/websocket.test.ts' },
    toolResponse: { stdout: 'PASS  server/tests/websocket.test.ts\n  ✓ connects and receives heartbeat\n  ✓ broadcasts notifications\n  ✓ handles reconnection\n  ✓ filters by topic\n\nTests: 4 passed, 4 total' },
    preTime: 38500, postTime: 41000,
    assistantText: "Running the WebSocket tests.",
  }))

  all.push({
    time: 43000,
    event: { type: 'stop', sessionId: SID, cwd: DEMO_CWD, stopHookActive: false, response: "Real-time notification system complete! WebSocket server with heartbeat/reconnection, React useNotifications hook, typed notification events, and 4 passing integration tests." },
  })

  return {
    sessionId: SID,
    managedId: MID,
    name: 'Research Sprint',
    cyclePause: 5000 / SPEED,
    initialDelay: 0,
    steps: toSteps(all),
  }
}

// ============================================================================
// Public API
// ============================================================================

export function createResearchSprintBundle(): DemoScenarioBundle {
  return {
    scenarios: [createResearchScenario()],
    managedSessions: createManagedSessions(),
    sessionIds: SESSION_IDS,
    managedIds: MANAGED_IDS,
  }
}
