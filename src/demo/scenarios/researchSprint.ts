/**
 * Research Sprint Scenario
 *
 * Main researcher does initial scoping, then spawns 2 parallel research sub-agents:
 *   1. Docs Researcher - deep-dive into official docs and specs
 *   2. Examples Researcher - find real-world examples and community patterns
 *
 * Researcher continues reading local code while sub-agents fetch web content.
 * When both return, researcher synthesizes findings and builds the implementation.
 *
 * 3 zones (1 main + 2 sub-agents). Shows "parallelize research, then consolidate and build."
 */

import type { ManagedSession } from '../../../shared/types'
import type { DemoEducation, DemoScenario, DemoScenarioBundle } from '../types'
import { SPEED, DEMO_CWD, nextToolUseId, timedToolPair, toSteps, type TimedEvent } from '../helpers'

// ============================================================================
// Session / Managed IDs
// ============================================================================

const SID = 'demo-research-session-0001'
const SID_DOCS = 'demo-subagent-docs-0001'
const SID_EXAMPLES = 'demo-subagent-examples-0001'

const MID = 'demo-managed-research-0001'
const MID_DOCS = 'demo-managed-docs-0001'
const MID_EXAMPLES = 'demo-managed-examples-0001'

const SESSION_IDS = [SID, SID_DOCS, SID_EXAMPLES] as const
const MANAGED_IDS = [MID, MID_DOCS, MID_EXAMPLES] as const

// ============================================================================
// Managed Sessions
// ============================================================================

function createManagedSessions(): ManagedSession[] {
  const now = Date.now()
  return [
    { id: MID, name: 'Research Sprint', tmuxSession: 'demo-research', status: 'idle', claudeSessionId: SID, createdAt: now, lastActivity: now, cwd: DEMO_CWD },
    { id: MID_DOCS, name: 'Docs Research', tmuxSession: 'demo-docs', status: 'idle', claudeSessionId: SID_DOCS, createdAt: now, lastActivity: now, cwd: DEMO_CWD },
    { id: MID_EXAMPLES, name: 'Examples', tmuxSession: 'demo-examples', status: 'idle', claudeSessionId: SID_EXAMPLES, createdAt: now, lastActivity: now, cwd: DEMO_CWD },
  ]
}

// ============================================================================
// Scenario
// ============================================================================

function createResearchScenario(): DemoScenario {
  const all: TimedEvent[] = []
  const taskDocsId = nextToolUseId()
  const taskExamplesId = nextToolUseId()

  all.push({
    time: 0,
    event: { type: 'user_prompt_submit', sessionId: SID, cwd: DEMO_CWD, prompt: 'Research WebSocket best practices and implement a real-time notification system' },
    phase: { name: 'Scoping', description: 'Understanding the problem space and existing code' },
    narration: { text: 'The researcher begins by understanding the project and scoping what needs to be built.', duration: 5000 },
  })

  // --- Initial scoping phase ---

  all.push(...timedToolPair({
    sessionId: SID, tool: 'WebSearch',
    toolInput: { query: 'WebSocket vs SSE real-time notifications 2025' },
    toolResponse: { results: [{ title: 'WebSocket vs SSE: When to Use Each' }, { title: 'Real-time Notifications Architecture' }] },
    preTime: 1500, postTime: 3500,
    assistantText: "Let me do a quick search to understand the landscape before diving deep.",
  }))

  all.push(...timedToolPair({
    sessionId: SID, tool: 'Read',
    toolInput: { file_path: 'package.json' },
    toolResponse: { content: '{ "dependencies": { "express": "^4.18.0" } }' },
    preTime: 5000, postTime: 5700,
    assistantText: "Checking existing dependencies before researching library options.",
  }))

  all.push(...timedToolPair({
    sessionId: SID, tool: 'Read',
    toolInput: { file_path: 'server/index.ts' },
    toolResponse: { content: '// Express server setup...' },
    preTime: 7000, postTime: 7700,
    assistantText: "Understanding the existing server setup to plan the integration.",
  }))

  // --- Spawn 2 parallel research sub-agents ---

  all.push({ time: 9500, event: { type: 'pre_tool_use' as const, sessionId: SID, cwd: DEMO_CWD, tool: 'Task', toolInput: { description: 'Research official WebSocket docs and specs', prompt: 'Deep-dive into WebSocket API docs (MDN), ws library README, and RFC 6455. Focus on: connection lifecycle, error handling, heartbeat/ping-pong, binary frames, and security (WSS, origin checks)', subagent_type: 'general-purpose' }, toolUseId: taskDocsId, assistantText: "Spawning a sub-agent to deep-dive into official docs and specs." }, phase: { name: 'Spawn Researchers', description: 'Launching parallel research sub-agents' }, narration: { text: 'Two research sub-agents spawn to explore official docs and community examples simultaneously.', duration: 6000 } })

  all.push({ time: 11000, event: { type: 'pre_tool_use' as const, sessionId: SID, cwd: DEMO_CWD, tool: 'Task', toolInput: { description: 'Find real-world WebSocket examples', prompt: 'Search for production WebSocket patterns: reconnection strategies, message queuing, room/topic subscriptions, scaling with Redis pub/sub. Find code examples from open-source projects', subagent_type: 'general-purpose' }, toolUseId: taskExamplesId, assistantText: "Another sub-agent will find real-world examples and community patterns." } })

  // --- Researcher continues reading local code while sub-agents research ---

  {
    const [pre, post] = timedToolPair({
      sessionId: SID, tool: 'Grep',
      toolInput: { pattern: 'socket|realtime|notification|event-stream', path: 'server/' },
      toolResponse: { matches: ['server/routes/events.ts:3: // SSE endpoint (deprecated)', 'server/services/notifications.ts:8'] },
      preTime: 12500, postTime: 13200,
      assistantText: "Checking if there's existing WebSocket or SSE code to build on.",
    })
    pre.phase = { name: 'Local Exploration', description: 'Main researcher explores local code while sub-agents research online' }
    all.push(pre, post)
  }

  all.push(...timedToolPair({
    sessionId: SID, tool: 'Read',
    toolInput: { file_path: 'server/services/notifications.ts' },
    toolResponse: { content: '// Notification service - currently polling-based...' },
    preTime: 14500, postTime: 15200,
    assistantText: "There's an existing polling-based notification service. I'll replace it.",
  }))

  all.push(...timedToolPair({
    sessionId: SID, tool: 'Read',
    toolInput: { file_path: 'server/routes/events.ts' },
    toolResponse: { content: '// Deprecated SSE endpoint for notifications...' },
    preTime: 16500, postTime: 17200,
    assistantText: "Found a deprecated SSE endpoint. The migration to WebSocket makes sense.",
  }))

  all.push(...timedToolPair({
    sessionId: SID, tool: 'Glob',
    toolInput: { pattern: 'src/hooks/use*Notification*' },
    toolResponse: { matches: ['src/hooks/useNotifications.ts'] },
    preTime: 18500, postTime: 19000,
    assistantText: "There's an existing React hook I'll need to update.",
  }))

  // --- Sub-agents report back ---

  all.push({ time: 23000, event: { type: 'post_tool_use' as const, sessionId: SID, cwd: DEMO_CWD, tool: 'Task', toolInput: { description: 'Research official WebSocket docs and specs' }, toolResponse: { result: 'Key findings: Use ws library (fastest Node.js impl), implement ping/pong heartbeat every 30s, handle close codes (1000=normal, 1006=abnormal), use WSS in prod, validate Origin header. Binary frames not needed for JSON notifications.' }, toolUseId: taskDocsId, success: true, duration: 13500 }, phase: { name: 'Synthesis', description: 'Combining research findings from all sources' }, narration: { text: 'Research is complete. The main agent synthesizes all findings and begins building.', duration: 5000 } })

  all.push({ time: 25000, event: { type: 'post_tool_use' as const, sessionId: SID, cwd: DEMO_CWD, tool: 'Task', toolInput: { description: 'Find real-world WebSocket examples' }, toolResponse: { result: 'Best patterns found: Exponential backoff reconnection (100ms→30s cap), message queue during disconnect, topic-based subscriptions via JSON { type, topic, data }, Redis pub/sub for horizontal scaling. Reference: Socket.IO internals, Liveblocks architecture.' }, toolUseId: taskExamplesId, success: true, duration: 14000 } })

  // --- Build phase: synthesize research and implement ---

  {
    const [pre, post] = timedToolPair({
      sessionId: SID, tool: 'Write',
      toolInput: { file_path: 'server/websocket/NotificationServer.ts', content: '// WebSocket server with heartbeat, reconnection, topic subscriptions...' },
      preTime: 26500, postTime: 27800,
      assistantText: "Creating the WebSocket server using patterns from both research agents.",
    })
    pre.phase = { name: 'Build', description: 'Implementing the solution based on research' }
    all.push(pre, post)
  }

  all.push(...timedToolPair({
    sessionId: SID, tool: 'Write',
    toolInput: { file_path: 'server/websocket/types.ts', content: '// Message types: { type, topic, data } pattern from examples research...' },
    preTime: 29000, postTime: 29800,
    assistantText: "Defining typed messages using the topic subscription pattern.",
  }))

  all.push(...timedToolPair({
    sessionId: SID, tool: 'Write',
    toolInput: { file_path: 'src/hooks/useNotifications.ts', content: '// React hook with exponential backoff reconnection...' },
    preTime: 31500, postTime: 32500,
    assistantText: "Rewriting the React hook with exponential backoff from the examples research.",
  }))

  all.push(...timedToolPair({
    sessionId: SID, tool: 'Edit',
    toolInput: { file_path: 'server/index.ts', old_string: "app.listen(PORT", new_string: "// Upgrade HTTP server for WebSocket\nconst server = app.listen(PORT" },
    preTime: 34000, postTime: 34500,
    assistantText: "Integrating the WebSocket server with Express.",
  }))

  all.push(...timedToolPair({
    sessionId: SID, tool: 'Bash',
    toolInput: { command: 'npm install ws && npx tsc --noEmit' },
    toolResponse: { stdout: 'added 1 package\nNo errors found.' },
    preTime: 36000, postTime: 38500,
    assistantText: "Installing ws library and verifying the build.",
  }))

  all.push(...timedToolPair({
    sessionId: SID, tool: 'Write',
    toolInput: { file_path: 'server/tests/websocket.test.ts', content: '// WebSocket integration tests: connect, heartbeat, reconnect, topics...' },
    preTime: 40000, postTime: 41000,
    assistantText: "Writing integration tests based on the patterns we learned.",
  }))

  all.push(...timedToolPair({
    sessionId: SID, tool: 'Bash',
    toolInput: { command: 'npx vitest run server/tests/websocket.test.ts' },
    toolResponse: { stdout: 'PASS  server/tests/websocket.test.ts\n  ✓ connects and receives heartbeat\n  ✓ broadcasts to topic subscribers\n  ✓ handles reconnection with backoff\n  ✓ queues messages during disconnect\n  ✓ validates origin header\n\nTests: 5 passed, 5 total' },
    preTime: 42500, postTime: 45000,
    assistantText: "Running the tests.",
  }))

  all.push({
    time: 47000,
    event: { type: 'stop', sessionId: SID, cwd: DEMO_CWD, stopHookActive: false, response: "Real-time notification system complete!\n\nResearch (via 2 sub-agents): Official docs (ws, RFC 6455, heartbeat) + community patterns (backoff, topics, Redis scaling)\n\nImplementation: WebSocket server with ping/pong heartbeat, topic subscriptions, exponential backoff reconnection, React hook, and 5 passing tests." },
  })

  // ========================================================================
  // SUB-AGENT 1: Docs Researcher
  // ========================================================================

  all.push({ time: 10000, event: { type: 'user_prompt_submit', sessionId: SID_DOCS, cwd: DEMO_CWD, prompt: 'Deep-dive into WebSocket API docs, ws library, and RFC 6455. Focus on lifecycle, heartbeat, error handling, security.' }, spawnBeam: { from: SID, to: SID_DOCS } })

  all.push(...timedToolPair({
    sessionId: SID_DOCS, tool: 'WebFetch',
    toolInput: { url: 'https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API', prompt: 'WebSocket API lifecycle and events' },
    toolResponse: { content: 'The WebSocket API provides a persistent connection between client and server...' },
    preTime: 11500, postTime: 13500,
    assistantText: "Reading MDN WebSocket docs for the full API surface.",
  }))

  all.push(...timedToolPair({
    sessionId: SID_DOCS, tool: 'WebFetch',
    toolInput: { url: 'https://github.com/websockets/ws/blob/master/README.md', prompt: 'ws library API, configuration, and heartbeat pattern' },
    toolResponse: { content: 'const wss = new WebSocketServer({ port: 8080 })... ping/pong heartbeat...' },
    preTime: 15000, postTime: 17000,
    assistantText: "Reading the ws library docs for the ping/pong heartbeat pattern.",
  }))

  all.push(...timedToolPair({
    sessionId: SID_DOCS, tool: 'WebSearch',
    toolInput: { query: 'RFC 6455 WebSocket close codes error handling best practices' },
    toolResponse: { results: [{ title: 'RFC 6455 - The WebSocket Protocol' }, { title: 'WebSocket Close Codes Explained' }] },
    preTime: 18500, postTime: 19500,
    assistantText: "Searching for RFC 6455 close codes and error handling.",
  }))

  all.push(...timedToolPair({
    sessionId: SID_DOCS, tool: 'WebFetch',
    toolInput: { url: 'https://www.rfc-editor.org/rfc/rfc6455#section-7.4', prompt: 'WebSocket close code definitions and when to use each' },
    toolResponse: { content: '1000 indicates normal closure, 1006 indicates abnormal closure...' },
    preTime: 20500, postTime: 21500,
    assistantText: "Reading RFC 6455 section on close codes.",
  }))

  all.push({ time: 22500, event: { type: 'stop', sessionId: SID_DOCS, cwd: DEMO_CWD, stopHookActive: false, response: "Docs research complete:\n- ws library is fastest Node.js WebSocket impl\n- Heartbeat: ping every 30s, terminate if no pong within 10s\n- Close codes: 1000 (normal), 1001 (going away), 1006 (abnormal)\n- Security: always use WSS in prod, validate Origin header\n- Binary frames not needed for JSON notifications" }, deleteZone: SID_DOCS })

  // ========================================================================
  // SUB-AGENT 2: Examples Researcher
  // ========================================================================

  all.push({ time: 11500, event: { type: 'user_prompt_submit', sessionId: SID_EXAMPLES, cwd: DEMO_CWD, prompt: 'Find real-world WebSocket patterns: reconnection, message queuing, topic subscriptions, scaling. Get code examples.' }, spawnBeam: { from: SID, to: SID_EXAMPLES } })

  all.push(...timedToolPair({
    sessionId: SID_EXAMPLES, tool: 'WebSearch',
    toolInput: { query: 'production WebSocket reconnection exponential backoff pattern javascript' },
    toolResponse: { results: [{ title: 'Robust WebSocket Reconnection Strategies' }, { title: 'Exponential Backoff for WebSocket' }] },
    preTime: 13000, postTime: 14500,
    assistantText: "Searching for reconnection strategies used in production.",
  }))

  all.push(...timedToolPair({
    sessionId: SID_EXAMPLES, tool: 'WebFetch',
    toolInput: { url: 'https://liveblocks.io/blog/websocket-architecture', prompt: 'How Liveblocks handles WebSocket reconnection and message ordering' },
    toolResponse: { content: 'Exponential backoff with jitter, message queue during disconnect...' },
    preTime: 16000, postTime: 17500,
    assistantText: "Reading how Liveblocks handles WebSocket reliability at scale.",
  }))

  all.push(...timedToolPair({
    sessionId: SID_EXAMPLES, tool: 'WebSearch',
    toolInput: { query: 'WebSocket topic subscription room pattern node.js Redis pub/sub scaling' },
    toolResponse: { results: [{ title: 'Scaling WebSockets with Redis Pub/Sub' }, { title: 'Socket.IO Architecture Deep Dive' }] },
    preTime: 19000, postTime: 20000,
    assistantText: "Searching for topic/room subscription patterns.",
  }))

  all.push(...timedToolPair({
    sessionId: SID_EXAMPLES, tool: 'WebFetch',
    toolInput: { url: 'https://socket.io/docs/v4/adapter/', prompt: 'Socket.IO Redis adapter pattern for horizontal scaling' },
    toolResponse: { content: 'The Redis adapter broadcasts packets between multiple Socket.IO servers...' },
    preTime: 21500, postTime: 22500,
    assistantText: "Reading Socket.IO's adapter pattern for scaling insights.",
  }))

  all.push({ time: 24500, event: { type: 'stop', sessionId: SID_EXAMPLES, cwd: DEMO_CWD, stopHookActive: false, response: "Examples research complete:\n- Reconnection: exponential backoff (100ms base, 30s cap, jitter)\n- Message queue: buffer during disconnect, replay on reconnect\n- Subscriptions: JSON { type, topic, data } pattern\n- Scaling: Redis pub/sub adapter (Socket.IO pattern)\n- References: Liveblocks, Socket.IO internals" }, deleteZone: SID_EXAMPLES })

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
    education: {
      intro: {
        title: 'Research Sprint',
        description: 'A developer needs to implement a new feature but first needs to research the best approach. Two sub-agents research official docs and community examples in parallel while the main agent explores the local codebase.',
        watchFor: [
          'Two research sub-agents using WebFetch and WebSearch at the antenna station',
          'Main researcher reading local files at the bookshelf while sub-agents research online',
          'Research results being synthesized into an implementation plan',
          'Transition from research phase to active building',
        ],
        agentCount: { orchestrators: 1, subagents: 2 },
      },
      summary: {
        achievements: [
          'Official documentation and API specs researched',
          'Community patterns and best practices gathered',
          'Complete implementation built from research findings',
        ],
        parallelTimeSaved: '~40s saved vs sequential research',
      },
    },
  }
}
