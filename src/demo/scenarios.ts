/**
 * Demo Scenarios - Synthetic event data for demo/sandbox mode
 *
 * Defines 3 demo sessions with scripted work cycles that loop indefinitely.
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

export const DEMO_SESSION_IDS = [
  'demo-frontend-session-0001',
  'demo-backend-session-0002',
  'demo-tests-session-0003',
] as const

export const DEMO_MANAGED_IDS = [
  'demo-managed-frontend-0001',
  'demo-managed-backend-0002',
  'demo-managed-tests-0003',
] as const

const DEMO_CWD = '/home/user/project'

// ============================================================================
// Types
// ============================================================================

/** A single step in a demo scenario — the event plus its delay from the previous step */
export interface DemoStep {
  delay: number
  event: DemoEvent
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

// ============================================================================
// Managed Sessions Factory
// ============================================================================

export function createDemoManagedSessions(): ManagedSession[] {
  const now = Date.now()
  return [
    {
      id: DEMO_MANAGED_IDS[0],
      name: 'Frontend',
      tmuxSession: 'demo-frontend',
      status: 'idle',
      claudeSessionId: DEMO_SESSION_IDS[0],
      createdAt: now,
      lastActivity: now,
      cwd: DEMO_CWD + '/src',
    },
    {
      id: DEMO_MANAGED_IDS[1],
      name: 'Backend',
      tmuxSession: 'demo-backend',
      status: 'idle',
      claudeSessionId: DEMO_SESSION_IDS[1],
      createdAt: now,
      lastActivity: now,
      cwd: DEMO_CWD + '/server',
    },
    {
      id: DEMO_MANAGED_IDS[2],
      name: 'Tests',
      tmuxSession: 'demo-tests',
      status: 'idle',
      claudeSessionId: DEMO_SESSION_IDS[2],
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
    createFrontendScenario(),
    createBackendScenario(),
    createTestsScenario(),
  ]
}

// ---------------------------------------------------------------------------
// Frontend Session
// Read components, Grep patterns, Write files, Edit imports, WebSearch
// ---------------------------------------------------------------------------

function createFrontendScenario(): DemoScenario {
  const sid = DEMO_SESSION_IDS[0]
  const steps: DemoStep[] = []

  // --- Cycle: Component refactor workflow ---

  // User prompt
  steps.push({
    delay: 0,
    event: {
      type: 'user_prompt_submit',
      sessionId: sid,
      cwd: DEMO_CWD,
      prompt: 'Refactor the Dashboard component to use the new design system',
    },
  })

  // Read the component
  const [readPre1, readPost1] = makeToolPair({
    sessionId: sid,
    tool: 'Read',
    toolInput: { file_path: 'src/components/Dashboard.tsx' },
    toolResponse: { content: '// Dashboard component...' },
    preDelay: 1500,
    postDelay: 800,
    assistantText: "Let me start by reading the current Dashboard component to understand its structure.",
  })
  steps.push(readPre1, readPost1)

  // Grep for pattern usage
  const [grepPre1, grepPost1] = makeToolPair({
    sessionId: sid,
    tool: 'Grep',
    toolInput: { pattern: 'className=.*old-', path: 'src/components/' },
    toolResponse: { matches: ['Dashboard.tsx:15', 'Dashboard.tsx:42', 'Header.tsx:8'] },
    preDelay: 2000,
    postDelay: 1200,
    assistantText: "I'll search for old class name patterns that need to be updated.",
  })
  steps.push(grepPre1, grepPost1)

  // Read another file
  const [readPre2, readPost2] = makeToolPair({
    sessionId: sid,
    tool: 'Read',
    toolInput: { file_path: 'src/components/Header.tsx' },
    toolResponse: { content: '// Header component...' },
    preDelay: 1800,
    postDelay: 600,
  })
  steps.push(readPre2, readPost2)

  // WebSearch for best practices
  const [wsPre, wsPost] = makeToolPair({
    sessionId: sid,
    tool: 'WebSearch',
    toolInput: { query: 'React design system component patterns 2025' },
    toolResponse: { results: [{ title: 'Design System Best Practices', url: 'https://example.com' }] },
    preDelay: 2200,
    postDelay: 1800,
    assistantText: "Let me look up current best practices for design system migration.",
  })
  steps.push(wsPre, wsPost)

  // Write new component
  const [writePre1, writePost1] = makeToolPair({
    sessionId: sid,
    tool: 'Write',
    toolInput: { file_path: 'src/components/Dashboard.tsx', content: '// Refactored Dashboard...' },
    preDelay: 3000,
    postDelay: 500,
    assistantText: "Now I'll rewrite the Dashboard component with the new design system tokens.",
  })
  steps.push(writePre1, writePost1)

  // Edit imports
  const [editPre1, editPost1] = makeToolPair({
    sessionId: sid,
    tool: 'Edit',
    toolInput: { file_path: 'src/components/Header.tsx', old_string: "import './old-styles'", new_string: "import { tokens } from '@design-system'" },
    preDelay: 2000,
    postDelay: 400,
    assistantText: "I'll update the Header imports to use the design system.",
  })
  steps.push(editPre1, editPost1)

  // Edit more imports
  const [editPre2, editPost2] = makeToolPair({
    sessionId: sid,
    tool: 'Edit',
    toolInput: { file_path: 'src/App.tsx', old_string: "import Dashboard from './Dashboard'", new_string: "import { Dashboard } from './components/Dashboard'" },
    preDelay: 1500,
    postDelay: 400,
  })
  steps.push(editPre2, editPost2)

  // Stop
  steps.push({
    delay: 2000,
    event: {
      type: 'stop',
      sessionId: sid,
      cwd: DEMO_CWD,
      stopHookActive: false,
      response: "I've refactored the Dashboard component to use the new design system. The Header imports have also been updated.",
    },
  })

  return {
    sessionId: sid,
    managedId: DEMO_MANAGED_IDS[0],
    name: 'Frontend',
    cyclePause: 5000,
    initialDelay: 500,
    steps,
  }
}

// ---------------------------------------------------------------------------
// Backend Session
// Read configs, Write routes, Bash (npm, curl), Edit middleware, WebFetch
// ---------------------------------------------------------------------------

function createBackendScenario(): DemoScenario {
  const sid = DEMO_SESSION_IDS[1]
  const steps: DemoStep[] = []

  // User prompt
  steps.push({
    delay: 0,
    event: {
      type: 'user_prompt_submit',
      sessionId: sid,
      cwd: DEMO_CWD,
      prompt: 'Add a rate limiting middleware to the API routes',
    },
  })

  // Read config
  const [readPre1, readPost1] = makeToolPair({
    sessionId: sid,
    tool: 'Read',
    toolInput: { file_path: 'server/config.ts' },
    toolResponse: { content: '// Server config...' },
    preDelay: 2000,
    postDelay: 700,
    assistantText: "Let me check the server configuration first.",
  })
  steps.push(readPre1, readPost1)

  // Read existing middleware
  const [readPre2, readPost2] = makeToolPair({
    sessionId: sid,
    tool: 'Read',
    toolInput: { file_path: 'server/middleware/auth.ts' },
    toolResponse: { content: '// Auth middleware...' },
    preDelay: 1800,
    postDelay: 600,
  })
  steps.push(readPre2, readPost2)

  // Bash: npm install
  const [bashPre1, bashPost1] = makeToolPair({
    sessionId: sid,
    tool: 'Bash',
    toolInput: { command: 'npm install express-rate-limit' },
    toolResponse: { stdout: 'added 1 package in 2.3s' },
    preDelay: 2200,
    postDelay: 2500,
    assistantText: "I'll install the rate limiting package.",
  })
  steps.push(bashPre1, bashPost1)

  // Write rate limiter
  const [writePre1, writePost1] = makeToolPair({
    sessionId: sid,
    tool: 'Write',
    toolInput: { file_path: 'server/middleware/rateLimit.ts', content: '// Rate limiting middleware...' },
    preDelay: 2500,
    postDelay: 500,
    assistantText: "Now I'll create the rate limiting middleware.",
  })
  steps.push(writePre1, writePost1)

  // Edit routes to add middleware
  const [editPre1, editPost1] = makeToolPair({
    sessionId: sid,
    tool: 'Edit',
    toolInput: { file_path: 'server/routes/api.ts', old_string: 'router.use(auth)', new_string: 'router.use(rateLimit)\nrouter.use(auth)' },
    preDelay: 2000,
    postDelay: 400,
    assistantText: "I'll add the rate limiter before the auth middleware in the route chain.",
  })
  steps.push(editPre1, editPost1)

  // WebFetch docs
  const [wfPre, wfPost] = makeToolPair({
    sessionId: sid,
    tool: 'WebFetch',
    toolInput: { url: 'https://express-rate-limit.mintlify.app/reference/configuration' },
    toolResponse: { content: 'Rate limit configuration options...' },
    preDelay: 2000,
    postDelay: 1500,
    assistantText: "Let me check the documentation for advanced configuration.",
  })
  steps.push(wfPre, wfPost)

  // Edit config with rate limit settings
  const [editPre2, editPost2] = makeToolPair({
    sessionId: sid,
    tool: 'Edit',
    toolInput: { file_path: 'server/config.ts', old_string: 'export const config = {', new_string: "export const config = {\n  rateLimit: { windowMs: 60000, max: 100 }," },
    preDelay: 1800,
    postDelay: 400,
  })
  steps.push(editPre2, editPost2)

  // Bash: curl test
  const [bashPre2, bashPost2] = makeToolPair({
    sessionId: sid,
    tool: 'Bash',
    toolInput: { command: 'curl -s http://localhost:3000/api/health | jq .' },
    toolResponse: { stdout: '{ "status": "ok", "rateLimit": { "remaining": 99 } }' },
    preDelay: 2500,
    postDelay: 1200,
    assistantText: "Let me verify the rate limiting is working.",
  })
  steps.push(bashPre2, bashPost2)

  // Stop
  steps.push({
    delay: 2000,
    event: {
      type: 'stop',
      sessionId: sid,
      cwd: DEMO_CWD,
      stopHookActive: false,
      response: "Rate limiting middleware has been added. The API now limits requests to 100 per minute per IP.",
    },
  })

  return {
    sessionId: sid,
    managedId: DEMO_MANAGED_IDS[1],
    name: 'Backend',
    cyclePause: 6000,
    initialDelay: 2000,
    steps,
  }
}

// ---------------------------------------------------------------------------
// Tests Session
// Read tests, Bash (vitest), Edit fixtures, Grep errors
// Includes one test failure + retry, and a Task tool (subagent spawn)
// ---------------------------------------------------------------------------

function createTestsScenario(): DemoScenario {
  const sid = DEMO_SESSION_IDS[2]
  const steps: DemoStep[] = []

  // User prompt
  steps.push({
    delay: 0,
    event: {
      type: 'user_prompt_submit',
      sessionId: sid,
      cwd: DEMO_CWD,
      prompt: 'Run the test suite and fix any failures',
    },
  })

  // Read test file
  const [readPre1, readPost1] = makeToolPair({
    sessionId: sid,
    tool: 'Read',
    toolInput: { file_path: 'tests/api.test.ts' },
    toolResponse: { content: '// API tests...' },
    preDelay: 1500,
    postDelay: 800,
    assistantText: "Let me look at the test suite first.",
  })
  steps.push(readPre1, readPost1)

  // Bash: run tests (FAIL)
  const [bashPre1, bashPost1] = makeToolPair({
    sessionId: sid,
    tool: 'Bash',
    toolInput: { command: 'npx vitest run --reporter=verbose' },
    toolResponse: { stdout: 'FAIL tests/api.test.ts\n  ✓ GET /health (3ms)\n  ✗ POST /users should validate email (12ms)\n  ✓ GET /users/:id (5ms)\n\nTests: 1 failed, 2 passed, 3 total' },
    success: false,
    preDelay: 2200,
    postDelay: 3000,
    assistantText: "I'll run the tests to see the current state.",
  })
  steps.push(bashPre1, bashPost1)

  // Grep for the error
  const [grepPre1, grepPost1] = makeToolPair({
    sessionId: sid,
    tool: 'Grep',
    toolInput: { pattern: 'validate.*email', path: 'src/' },
    toolResponse: { matches: ['validators.ts:23: export function validateEmail(email: string)'] },
    preDelay: 2000,
    postDelay: 1000,
    assistantText: "Let me find the email validation logic.",
  })
  steps.push(grepPre1, grepPost1)

  // Read the validator
  const [readPre2, readPost2] = makeToolPair({
    sessionId: sid,
    tool: 'Read',
    toolInput: { file_path: 'src/validators.ts' },
    toolResponse: { content: '// Validators...' },
    preDelay: 1500,
    postDelay: 600,
  })
  steps.push(readPre2, readPost2)

  // Edit the fixture
  const [editPre1, editPost1] = makeToolPair({
    sessionId: sid,
    tool: 'Edit',
    toolInput: { file_path: 'src/validators.ts', old_string: 'return email.includes("@")', new_string: 'return /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(email)' },
    preDelay: 2500,
    postDelay: 400,
    assistantText: "The email validation regex was too permissive. I'll fix it.",
  })
  steps.push(editPre1, editPost1)

  // Edit the test fixture to match
  const [editPre2, editPost2] = makeToolPair({
    sessionId: sid,
    tool: 'Edit',
    toolInput: { file_path: 'tests/api.test.ts', old_string: "email: 'invalid'", new_string: "email: 'not-an-email'" },
    preDelay: 1500,
    postDelay: 400,
  })
  steps.push(editPre2, editPost2)

  // Bash: rerun tests (PASS)
  const [bashPre2, bashPost2] = makeToolPair({
    sessionId: sid,
    tool: 'Bash',
    toolInput: { command: 'npx vitest run --reporter=verbose' },
    toolResponse: { stdout: 'PASS tests/api.test.ts\n  ✓ GET /health (3ms)\n  ✓ POST /users should validate email (8ms)\n  ✓ GET /users/:id (4ms)\n\nTests: 3 passed, 3 total' },
    success: true,
    preDelay: 2000,
    postDelay: 2800,
    assistantText: "Let me rerun the tests to confirm the fix.",
  })
  steps.push(bashPre2, bashPost2)

  // Task: spawn subagent for integration tests
  const [taskPre, taskPost] = makeToolPair({
    sessionId: sid,
    tool: 'Task',
    toolInput: { description: 'Run integration tests', prompt: 'Run the integration test suite and report results' },
    toolResponse: { result: 'All 12 integration tests passed.' },
    preDelay: 2000,
    postDelay: 4000,
    assistantText: "I'll run the integration tests in parallel as a subagent.",
  })
  steps.push(taskPre, taskPost)

  // Stop
  steps.push({
    delay: 2500,
    event: {
      type: 'stop',
      sessionId: sid,
      cwd: DEMO_CWD,
      stopHookActive: false,
      response: "All tests are passing now. Fixed the email validation regex and updated the test fixture. Integration tests also pass.",
    },
  })

  return {
    sessionId: sid,
    managedId: DEMO_MANAGED_IDS[2],
    name: 'Tests',
    cyclePause: 7000,
    initialDelay: 3500,
    steps,
  }
}
