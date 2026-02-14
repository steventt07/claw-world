/**
 * Demo Scenarios - Synthetic event data for demo/sandbox mode
 *
 * Single "Architect" scenario with 4 interleaved sessions:
 * - Main Architect that plans and orchestrates
 * - 3 sub-agent sessions (OAuth, UI, Tests) each in their own zone
 *
 * Events follow shared/types.ts exactly, missing only `id` and `timestamp`
 * which are stamped at playback time.
 */

import type { ClaudeEvent, ManagedSession } from '../../shared/types'

/** Distributive Omit that preserves discriminated union members */
type DistributiveOmit<T, K extends keyof any> = T extends any ? Omit<T, K> : never

/** A ClaudeEvent minus its id and timestamp (stamped at playback time) */
type DemoEvent = DistributiveOmit<ClaudeEvent, 'id' | 'timestamp'>

// ============================================================================
// Constants
// ============================================================================

const SID_ARCH = 'demo-architect-session-0001'
const SID_OAUTH = 'demo-subagent-oauth-0001'
const SID_UI = 'demo-subagent-ui-0002'
const SID_TESTS = 'demo-subagent-tests-0003'

const MID_ARCH = 'demo-managed-architect-0001'
const MID_OAUTH = 'demo-managed-oauth-0001'
const MID_UI = 'demo-managed-ui-0002'
const MID_TESTS = 'demo-managed-tests-0003'

export const DEMO_SESSION_IDS = [
  SID_ARCH,
  SID_OAUTH,
  SID_UI,
  SID_TESTS,
] as const

export const DEMO_MANAGED_IDS = [
  MID_ARCH,
  MID_OAUTH,
  MID_UI,
  MID_TESTS,
] as const

const DEMO_CWD = '/home/user/project'

// ============================================================================
// Types
// ============================================================================

/** A single step in a demo scenario — the event plus its delay from the previous step */
export interface DemoStep {
  delay: number
  event: DemoEvent
  /** Optional: delete this zone after the event fires (for sub-agent cleanup) */
  deleteZone?: string
  /** Optional: launch a spawn beam arc from one session's portal to another session's zone */
  spawnBeam?: { from: string; to: string }
}

/** A full demo scenario with metadata and repeating cycles */
export interface DemoScenario {
  sessionId: string
  managedId: string
  name: string
  /** Pause (ms) between cycle loops */
  cyclePause: number
  /** Initial delay before first cycle starts */
  initialDelay: number
  /** Steps for one complete work cycle */
  steps: DemoStep[]
}

// ============================================================================
// Helpers
// ============================================================================

let _toolUseCounter = 0

/** Generate a matched pre_tool_use / post_tool_use step pair with shared toolUseId */
export function makeToolPair(opts: {
  sessionId: string
  tool: string
  toolInput: Record<string, unknown>
  toolResponse?: Record<string, unknown>
  success?: boolean
  duration?: number
  preDelay: number
  postDelay: number
  assistantText?: string
}): [DemoStep, DemoStep] {
  const toolUseId = `demo-tool-${++_toolUseCounter}`
  const success = opts.success ?? true
  const duration = opts.duration ?? opts.postDelay

  return [
    {
      delay: opts.preDelay,
      event: {
        type: 'pre_tool_use' as const,
        sessionId: opts.sessionId,
        cwd: DEMO_CWD,
        tool: opts.tool,
        toolInput: opts.toolInput,
        toolUseId,
        ...(opts.assistantText ? { assistantText: opts.assistantText } : {}),
      },
    },
    {
      delay: opts.postDelay,
      event: {
        type: 'post_tool_use' as const,
        sessionId: opts.sessionId,
        cwd: DEMO_CWD,
        tool: opts.tool,
        toolInput: opts.toolInput,
        toolResponse: opts.toolResponse ?? {},
        toolUseId,
        success,
        duration,
      },
    },
  ]
}

/** An event placed at an absolute time (ms) in the scenario timeline */
interface TimedEvent {
  time: number
  event: DemoEvent
  /** Optional: delete this zone after the event fires */
  deleteZone?: string
  /** Optional: launch a spawn beam arc from one session's portal to another session's zone */
  spawnBeam?: { from: string; to: string }
}

/** Convert absolute-time events to relative-delay steps (sorted chronologically) */
function toSteps(events: TimedEvent[]): DemoStep[] {
  events.sort((a, b) => a.time - b.time)
  let prevTime = 0
  return events.map(e => {
    const delay = Math.max(0, (e.time - prevTime) / SPEED)
    prevTime = e.time
    return {
      delay,
      event: e.event,
      ...(e.deleteZone ? { deleteZone: e.deleteZone } : {}),
      ...(e.spawnBeam ? { spawnBeam: e.spawnBeam } : {}),
    }
  })
}

/** Create a pre/post tool pair as two TimedEvents at absolute times */
function timedToolPair(opts: {
  sessionId: string
  tool: string
  toolInput: Record<string, unknown>
  toolResponse?: Record<string, unknown>
  success?: boolean
  preTime: number
  postTime: number
  assistantText?: string
}): [TimedEvent, TimedEvent] {
  const toolUseId = `demo-tool-${++_toolUseCounter}`
  const success = opts.success ?? true
  const duration = opts.postTime - opts.preTime

  return [
    {
      time: opts.preTime,
      event: {
        type: 'pre_tool_use' as const,
        sessionId: opts.sessionId,
        cwd: DEMO_CWD,
        tool: opts.tool,
        toolInput: opts.toolInput,
        toolUseId,
        ...(opts.assistantText ? { assistantText: opts.assistantText } : {}),
      },
    },
    {
      time: opts.postTime,
      event: {
        type: 'post_tool_use' as const,
        sessionId: opts.sessionId,
        cwd: DEMO_CWD,
        tool: opts.tool,
        toolInput: opts.toolInput,
        toolResponse: opts.toolResponse ?? {},
        toolUseId,
        success,
        duration,
      },
    },
  ]
}

// ============================================================================
// Managed Sessions Factory
// ============================================================================

export function createDemoManagedSessions(): ManagedSession[] {
  const now = Date.now()
  return [
    {
      id: MID_ARCH,
      name: 'Architect',
      tmuxSession: 'demo-architect',
      status: 'idle',
      claudeSessionId: SID_ARCH,
      createdAt: now,
      lastActivity: now,
      cwd: DEMO_CWD,
    },
    {
      id: MID_OAUTH,
      name: 'OAuth Agent',
      tmuxSession: 'demo-oauth',
      status: 'idle',
      claudeSessionId: SID_OAUTH,
      createdAt: now,
      lastActivity: now,
      cwd: DEMO_CWD + '/server',
    },
    {
      id: MID_UI,
      name: 'UI Agent',
      tmuxSession: 'demo-ui',
      status: 'idle',
      claudeSessionId: SID_UI,
      createdAt: now,
      lastActivity: now,
      cwd: DEMO_CWD + '/src',
    },
    {
      id: MID_TESTS,
      name: 'Tests Agent',
      tmuxSession: 'demo-tests',
      status: 'idle',
      claudeSessionId: SID_TESTS,
      createdAt: now,
      lastActivity: now,
      cwd: DEMO_CWD + '/tests',
    },
  ]
}

// ============================================================================
// Scenario Definitions
// ============================================================================

export function createDemoScenarios(): DemoScenario[] {
  // Reset counter each time scenarios are created
  _toolUseCounter = 0

  return [
    createArchitectScenario(),
  ]
}

// ---------------------------------------------------------------------------
// Architect Scenario
//
// One scenario with events for 4 sessions interleaved chronologically.
// The Architect plans, spawns 3 sub-agents (each in their own zone),
// continues working while they execute, then integrates results.
//
// Timeline (~19s per cycle at 2x speed):
//   Phase 1 (0-5s):     Architect plans — Read, Read, Grep, WebSearch
//   Phase 2 (5.5-7.5s): Architect spawns 3 sub-agents via Task tool
//   Phase 3 (6-16s):    All 4 sessions work in parallel
//   Phase 4 (16-19s):   Final build + stop
// ---------------------------------------------------------------------------

/** Speed multiplier — all absolute times are divided by this */
const SPEED = 2

function createArchitectScenario(): DemoScenario {
  const all: TimedEvent[] = []

  // Stable toolUseIds for the 3 Task tools (pre placed early, post placed late)
  const taskOAuthId = `demo-tool-${++_toolUseCounter}`
  const taskUIId = `demo-tool-${++_toolUseCounter}`
  const taskTestsId = `demo-tool-${++_toolUseCounter}`

  // ===================================================================
  // ARCHITECT TRACK
  // ===================================================================

  // --- Phase 1: Planning ---

  all.push({
    time: 0,
    event: {
      type: 'user_prompt_submit',
      sessionId: SID_ARCH,
      cwd: DEMO_CWD,
      prompt: 'Build a complete authentication system with OAuth, JWT, and tests',
    },
  })

  all.push(...timedToolPair({
    sessionId: SID_ARCH,
    tool: 'Read',
    toolInput: { file_path: 'src/index.ts' },
    toolResponse: { content: '// Main entry point...' },
    preTime: 1500,
    postTime: 2300,
    assistantText: "Let me understand the project structure before planning the implementation.",
  }))

  all.push(...timedToolPair({
    sessionId: SID_ARCH,
    tool: 'Read',
    toolInput: { file_path: 'package.json' },
    toolResponse: { content: '{ "dependencies": { "express": "^4.18.0" } }' },
    preTime: 3500,
    postTime: 4100,
    assistantText: "I'll check the existing dependencies.",
  }))

  all.push(...timedToolPair({
    sessionId: SID_ARCH,
    tool: 'Grep',
    toolInput: { pattern: 'auth|session|token', path: 'src/' },
    toolResponse: { matches: ['src/middleware/session.ts:3', 'src/routes/login.ts:1'] },
    preTime: 5500,
    postTime: 6700,
    assistantText: "Let me check for any existing auth-related code.",
  }))

  all.push(...timedToolPair({
    sessionId: SID_ARCH,
    tool: 'WebSearch',
    toolInput: { query: 'OAuth 2.0 PKCE JWT best practices 2025' },
    toolResponse: { results: [{ title: 'OAuth 2.0 Security Best Practices' }] },
    preTime: 8000,
    postTime: 9800,
    assistantText: "I'll research current OAuth best practices before we start building.",
  }))

  // --- Phase 2: Spawn sub-agents (Task pre events) ---

  all.push({
    time: 11500,
    event: {
      type: 'pre_tool_use' as const,
      sessionId: SID_ARCH,
      cwd: DEMO_CWD,
      tool: 'Task',
      toolInput: {
        description: 'Implement OAuth backend routes',
        prompt: 'Create OAuth 2.0 routes with Google/GitHub providers, token refresh, and PKCE flow',
        subagent_type: 'general-purpose',
      },
      toolUseId: taskOAuthId,
      assistantText: "I'll delegate the OAuth backend to a sub-agent.",
    },
  })

  all.push({
    time: 13000,
    event: {
      type: 'pre_tool_use' as const,
      sessionId: SID_ARCH,
      cwd: DEMO_CWD,
      tool: 'Task',
      toolInput: {
        description: 'Build login/signup UI components',
        prompt: 'Create React login form, signup form, OAuth buttons, and password reset flow',
        subagent_type: 'general-purpose',
      },
      toolUseId: taskUIId,
      assistantText: "Another sub-agent will handle the frontend UI.",
    },
  })

  all.push({
    time: 14500,
    event: {
      type: 'pre_tool_use' as const,
      sessionId: SID_ARCH,
      cwd: DEMO_CWD,
      tool: 'Task',
      toolInput: {
        description: 'Write auth integration tests',
        prompt: 'Write comprehensive tests for OAuth flow, JWT validation, and session management',
        subagent_type: 'general-purpose',
      },
      toolUseId: taskTestsId,
      assistantText: "A third sub-agent will write integration tests in parallel.",
    },
  })

  // --- Phase 3: Architect continues working ---

  all.push(...timedToolPair({
    sessionId: SID_ARCH,
    tool: 'Write',
    toolInput: { file_path: 'src/config/auth.ts', content: '// Auth config...' },
    preTime: 16500,
    postTime: 17000,
    assistantText: "While the sub-agents work, I'll set up the shared auth config.",
  }))

  all.push(...timedToolPair({
    sessionId: SID_ARCH,
    tool: 'Edit',
    toolInput: {
      file_path: 'src/index.ts',
      old_string: "import { router } from './routes'",
      new_string: "import { router } from './routes'\nimport { authMiddleware } from './middleware/auth'",
    },
    preTime: 18500,
    postTime: 18900,
    assistantText: "I'll wire up the auth middleware in the main entry point.",
  }))

  all.push(...timedToolPair({
    sessionId: SID_ARCH,
    tool: 'Bash',
    toolInput: { command: 'npm install jsonwebtoken bcrypt passport passport-google-oauth20' },
    toolResponse: { stdout: 'added 5 packages in 3.1s' },
    preTime: 20000,
    postTime: 22500,
    assistantText: "Let me install the required auth packages.",
  }))

  // --- Task post events (sub-agents complete, despawn) ---

  // OAuth sub-agent finishes
  all.push({
    time: 23500,
    event: {
      type: 'post_tool_use' as const,
      sessionId: SID_ARCH,
      cwd: DEMO_CWD,
      tool: 'Task',
      toolInput: { description: 'Implement OAuth backend routes' },
      toolResponse: { result: 'OAuth routes implemented: /auth/google, /auth/github, /auth/callback, /auth/refresh' },
      toolUseId: taskOAuthId,
      success: true,
      duration: 12000,
    },
  })

  // Architect reviews OAuth output
  all.push(...timedToolPair({
    sessionId: SID_ARCH,
    tool: 'Read',
    toolInput: { file_path: 'src/routes/auth.ts' },
    toolResponse: { content: '// OAuth routes...' },
    preTime: 24000,
    postTime: 24600,
    assistantText: "OAuth sub-agent finished. Let me review what it created.",
  }))

  all.push(...timedToolPair({
    sessionId: SID_ARCH,
    tool: 'Edit',
    toolInput: {
      file_path: 'src/routes/index.ts',
      old_string: "router.use('/api', apiRoutes)",
      new_string: "router.use('/api', apiRoutes)\nrouter.use('/auth', authRoutes)",
    },
    preTime: 25500,
    postTime: 25900,
    assistantText: "I'll wire the OAuth routes into the main router.",
  }))

  // UI sub-agent finishes
  all.push({
    time: 27500,
    event: {
      type: 'post_tool_use' as const,
      sessionId: SID_ARCH,
      cwd: DEMO_CWD,
      tool: 'Task',
      toolInput: { description: 'Build login/signup UI components' },
      toolResponse: { result: 'UI components built: LoginForm, SignupForm, OAuthButtons, AuthProvider' },
      toolUseId: taskUIId,
      success: true,
      duration: 14500,
    },
  })

  // Architect integrates UI
  all.push(...timedToolPair({
    sessionId: SID_ARCH,
    tool: 'Edit',
    toolInput: {
      file_path: 'src/App.tsx',
      old_string: '<Router>',
      new_string: '<AuthProvider>\n  <Router>',
    },
    preTime: 28500,
    postTime: 28900,
    assistantText: "UI sub-agent is done. Let me integrate the auth components.",
  }))

  // Tests sub-agent finishes
  all.push({
    time: 31500,
    event: {
      type: 'post_tool_use' as const,
      sessionId: SID_ARCH,
      cwd: DEMO_CWD,
      tool: 'Task',
      toolInput: { description: 'Write auth integration tests' },
      toolResponse: { result: 'All 15 tests passing' },
      toolUseId: taskTestsId,
      success: true,
      duration: 17000,
    },
  })

  // --- Phase 4: Final build ---

  all.push(...timedToolPair({
    sessionId: SID_ARCH,
    tool: 'Bash',
    toolInput: { command: 'npm run build' },
    toolResponse: { stdout: '✓ Compiled successfully in 4.2s' },
    preTime: 32500,
    postTime: 35500,
    assistantText: "All sub-agents done. Let me verify the full build passes.",
  }))

  all.push({
    time: 37500,
    event: {
      type: 'stop',
      sessionId: SID_ARCH,
      cwd: DEMO_CWD,
      stopHookActive: false,
      response: "Auth system complete! OAuth 2.0 with Google & GitHub, JWT tokens, login/signup UI, and 15 passing tests. Sub-agents handled backend, UI, and tests in parallel.",
    },
  })

  // ===================================================================
  // SUB-AGENT 1: OAuth Backend (Blue zone)
  // Active from ~12s to ~23s
  // ===================================================================

  all.push({
    time: 12000,
    event: {
      type: 'user_prompt_submit',
      sessionId: SID_OAUTH,
      cwd: DEMO_CWD + '/server',
      prompt: 'Implement OAuth 2.0 routes with Google/GitHub providers, token refresh, and PKCE flow',
    },
    spawnBeam: { from: SID_ARCH, to: SID_OAUTH },
  })

  all.push(...timedToolPair({
    sessionId: SID_OAUTH,
    tool: 'Glob',
    toolInput: { pattern: 'server/routes/**/*.ts' },
    toolResponse: { matches: ['server/routes/index.ts', 'server/routes/api.ts'] },
    preTime: 13500,
    postTime: 14000,
    assistantText: "Let me find the existing route files.",
  }))

  all.push(...timedToolPair({
    sessionId: SID_OAUTH,
    tool: 'Read',
    toolInput: { file_path: 'server/routes/index.ts' },
    toolResponse: { content: '// Existing routes...' },
    preTime: 15000,
    postTime: 15700,
    assistantText: "Checking the route structure before adding OAuth.",
  }))

  all.push(...timedToolPair({
    sessionId: SID_OAUTH,
    tool: 'WebFetch',
    toolInput: { url: 'https://developers.google.com/identity/protocols/oauth2', prompt: 'OAuth PKCE flow steps' },
    toolResponse: { content: 'Authorization code flow with PKCE...' },
    preTime: 16800,
    postTime: 17800,
    assistantText: "Checking Google's OAuth docs for the PKCE flow.",
  }))

  all.push(...timedToolPair({
    sessionId: SID_OAUTH,
    tool: 'Write',
    toolInput: { file_path: 'server/routes/oauth.ts', content: '// OAuth routes with PKCE...' },
    preTime: 18800,
    postTime: 19500,
    assistantText: "Creating the OAuth route handlers with PKCE flow.",
  }))

  all.push(...timedToolPair({
    sessionId: SID_OAUTH,
    tool: 'Edit',
    toolInput: {
      file_path: 'server/config/passport.ts',
      old_string: 'export default passport',
      new_string: '// Configure Google + GitHub strategies\nexport default passport',
    },
    preTime: 20500,
    postTime: 20900,
    assistantText: "Configuring passport strategies for both providers.",
  }))

  all.push(...timedToolPair({
    sessionId: SID_OAUTH,
    tool: 'Bash',
    toolInput: { command: 'curl -s http://localhost:3000/auth/health | jq .' },
    toolResponse: { stdout: '{ "status": "ok", "providers": ["google", "github"] }' },
    preTime: 21500,
    postTime: 22500,
    assistantText: "Let me verify the OAuth endpoints are responding.",
  }))

  all.push({
    time: 23000,
    event: {
      type: 'stop',
      sessionId: SID_OAUTH,
      cwd: DEMO_CWD + '/server',
      stopHookActive: false,
      response: "OAuth routes implemented: /auth/google, /auth/github, /auth/callback, /auth/refresh. PKCE flow with httpOnly cookies.",
    },
    deleteZone: SID_OAUTH,
  })

  // ===================================================================
  // SUB-AGENT 2: Login UI (Emerald zone)
  // Active from ~13.5s to ~27s
  // ===================================================================

  all.push({
    time: 13500,
    event: {
      type: 'user_prompt_submit',
      sessionId: SID_UI,
      cwd: DEMO_CWD + '/src',
      prompt: 'Create React login form, signup form, OAuth buttons, and password reset flow',
    },
    spawnBeam: { from: SID_ARCH, to: SID_UI },
  })

  all.push(...timedToolPair({
    sessionId: SID_UI,
    tool: 'Read',
    toolInput: { file_path: 'src/components/index.ts' },
    toolResponse: { content: '// Component exports...' },
    preTime: 15000,
    postTime: 15700,
    assistantText: "Checking the existing component structure.",
  }))

  all.push(...timedToolPair({
    sessionId: SID_UI,
    tool: 'Grep',
    toolInput: { pattern: 'useAuth|AuthContext|<Form', path: 'src/components/' },
    toolResponse: { matches: ['src/components/Nav.tsx:12: useAuth()', 'src/components/Profile.tsx:5: AuthContext'] },
    preTime: 17200,
    postTime: 17800,
    assistantText: "Searching for existing auth patterns to match.",
  }))

  all.push(...timedToolPair({
    sessionId: SID_UI,
    tool: 'Write',
    toolInput: { file_path: 'src/components/LoginForm.tsx', content: '// Login form...' },
    preTime: 19200,
    postTime: 19800,
    assistantText: "Creating the login form with email/password and OAuth buttons.",
  }))

  all.push(...timedToolPair({
    sessionId: SID_UI,
    tool: 'Write',
    toolInput: { file_path: 'src/components/SignupForm.tsx', content: '// Signup form...' },
    preTime: 21200,
    postTime: 21800,
    assistantText: "Building the signup form with validation.",
  }))

  all.push(...timedToolPair({
    sessionId: SID_UI,
    tool: 'Bash',
    toolInput: { command: 'npx tsc --noEmit src/components/LoginForm.tsx src/components/SignupForm.tsx' },
    toolResponse: { stdout: 'No errors found.' },
    preTime: 23000,
    postTime: 23800,
    assistantText: "Running type check on the new components.",
  }))

  all.push(...timedToolPair({
    sessionId: SID_UI,
    tool: 'Edit',
    toolInput: {
      file_path: 'src/context/AuthProvider.tsx',
      old_string: 'export const AuthContext',
      new_string: '// Enhanced auth context with OAuth support\nexport const AuthContext',
    },
    preTime: 24800,
    postTime: 25200,
    assistantText: "Updating the AuthProvider context with token management.",
  }))

  all.push({
    time: 27000,
    event: {
      type: 'stop',
      sessionId: SID_UI,
      cwd: DEMO_CWD + '/src',
      stopHookActive: false,
      response: "UI components built: LoginForm, SignupForm, OAuthButtons, AuthProvider context with form validation and loading states.",
    },
    deleteZone: SID_UI,
  })

  // ===================================================================
  // SUB-AGENT 3: Tests (Pink zone)
  // Active from ~15s to ~31s
  // ===================================================================

  all.push({
    time: 15000,
    event: {
      type: 'user_prompt_submit',
      sessionId: SID_TESTS,
      cwd: DEMO_CWD + '/tests',
      prompt: 'Write comprehensive tests for OAuth flow, JWT validation, and session management',
    },
    spawnBeam: { from: SID_ARCH, to: SID_TESTS },
  })

  all.push(...timedToolPair({
    sessionId: SID_TESTS,
    tool: 'Read',
    toolInput: { file_path: 'tests/helpers/setup.ts' },
    toolResponse: { content: '// Test setup with mock providers...' },
    preTime: 16800,
    postTime: 17400,
    assistantText: "Reading existing test setup patterns.",
  }))

  all.push(...timedToolPair({
    sessionId: SID_TESTS,
    tool: 'Glob',
    toolInput: { pattern: 'tests/fixtures/**/*.json' },
    toolResponse: { matches: ['tests/fixtures/users.json', 'tests/fixtures/tokens.json'] },
    preTime: 18500,
    postTime: 19000,
    assistantText: "Finding test fixtures to reuse.",
  }))

  all.push(...timedToolPair({
    sessionId: SID_TESTS,
    tool: 'Write',
    toolInput: { file_path: 'tests/auth/oauth.test.ts', content: '// OAuth flow tests...' },
    preTime: 20000,
    postTime: 20600,
    assistantText: "Writing OAuth flow tests for both providers.",
  }))

  all.push(...timedToolPair({
    sessionId: SID_TESTS,
    tool: 'Write',
    toolInput: { file_path: 'tests/auth/jwt.test.ts', content: '// JWT validation tests...' },
    preTime: 21800,
    postTime: 22400,
    assistantText: "Creating JWT validation and expiry tests.",
  }))

  // First test run - fails
  all.push(...timedToolPair({
    sessionId: SID_TESTS,
    tool: 'Bash',
    toolInput: { command: 'npx vitest run tests/auth/' },
    toolResponse: { stdout: 'FAIL  tests/auth/jwt.test.ts\n  ✗ should reject expired tokens\n\nTests: 1 failed, 14 passed, 15 total' },
    success: false,
    preTime: 23200,
    postTime: 25800,
    assistantText: "Running the test suite to check for issues.",
  }))

  // Fix the failing test
  all.push(...timedToolPair({
    sessionId: SID_TESTS,
    tool: 'Edit',
    toolInput: {
      file_path: 'tests/auth/jwt.test.ts',
      old_string: "expect(token).toBeNull()",
      new_string: "expect(result.error).toBe('TOKEN_EXPIRED')",
    },
    preTime: 26500,
    postTime: 26900,
    assistantText: "The assertion was wrong — fixing the expired token test.",
  }))

  // Second test run - passes
  all.push(...timedToolPair({
    sessionId: SID_TESTS,
    tool: 'Bash',
    toolInput: { command: 'npx vitest run tests/auth/' },
    toolResponse: { stdout: 'PASS  tests/auth/\n  ✓ oauth.test.ts (5 tests)\n  ✓ jwt.test.ts (4 tests)\n  ✓ session.test.ts (6 tests)\n\nTests: 15 passed, 15 total' },
    preTime: 28000,
    postTime: 30500,
    assistantText: "Rerunning tests to confirm the fix.",
  }))

  all.push({
    time: 31000,
    event: {
      type: 'stop',
      sessionId: SID_TESTS,
      cwd: DEMO_CWD + '/tests',
      stopHookActive: false,
      response: "All 15 tests passing: 5 OAuth flow, 4 JWT validation, 6 session management.",
    },
    deleteZone: SID_TESTS,
  })

  // ===================================================================
  // Merge all tracks and convert to steps
  // ===================================================================

  return {
    sessionId: SID_ARCH,
    managedId: MID_ARCH,
    name: 'Architect',
    cyclePause: 5000 / SPEED,
    initialDelay: 500,
    steps: toSteps(all),
  }
}
