/**
 * Pair Programming Scenario
 *
 * Two sessions (Alice frontend, Bob backend) working in parallel on the same project.
 * 2 zones, no sub-agents. Shows collaborative parallel development.
 *
 * Alice (~20s cycle): prompt → Read → Grep → Write component → Edit imports → Read styles → Write CSS → Edit route → Bash tsc → stop
 * Bob (~21s cycle, 1s stagger): prompt → Read model → Read routes → Grep patterns → Write endpoint → Edit middleware → Write test → Bash test → Edit wiring → stop
 */

import type { ManagedSession } from '../../../shared/types'
import type { DemoScenarioBundle } from '../types'
import { SPEED, DEMO_CWD, timedToolPair, toSteps, type TimedEvent } from '../helpers'

// ============================================================================
// Session / Managed IDs
// ============================================================================

const SID_ALICE = 'demo-pair-alice-0001'
const SID_BOB = 'demo-pair-bob-0001'

const MID_ALICE = 'demo-managed-pair-alice-0001'
const MID_BOB = 'demo-managed-pair-bob-0001'

const SESSION_IDS = [SID_ALICE, SID_BOB] as const
const MANAGED_IDS = [MID_ALICE, MID_BOB] as const

// ============================================================================
// Managed Sessions
// ============================================================================

function createManagedSessions(): ManagedSession[] {
  const now = Date.now()
  return [
    { id: MID_ALICE, name: 'Alice (Frontend)', tmuxSession: 'demo-alice', status: 'idle', claudeSessionId: SID_ALICE, createdAt: now, lastActivity: now, cwd: DEMO_CWD + '/src' },
    { id: MID_BOB, name: 'Bob (Backend)', tmuxSession: 'demo-bob', status: 'idle', claudeSessionId: SID_BOB, createdAt: now, lastActivity: now, cwd: DEMO_CWD + '/server' },
  ]
}

// ============================================================================
// Scenarios
// ============================================================================

function createAliceScenario() {
  const all: TimedEvent[] = []

  all.push({
    time: 0,
    event: { type: 'user_prompt_submit', sessionId: SID_ALICE, cwd: DEMO_CWD + '/src', prompt: 'Build a dashboard page with a data table component and chart widget' },
  })

  // Read existing component structure
  all.push(...timedToolPair({ sessionId: SID_ALICE, tool: 'Read', toolInput: { file_path: 'src/components/index.ts' }, toolResponse: { content: '// Component barrel exports...' }, preTime: 1500, postTime: 2200, assistantText: "Let me understand the existing component structure." }))

  // Grep for existing patterns
  all.push(...timedToolPair({ sessionId: SID_ALICE, tool: 'Grep', toolInput: { pattern: 'import.*Table|DataGrid|useTable', path: 'src/' }, toolResponse: { matches: ['src/components/UserList.tsx:4'] }, preTime: 3500, postTime: 4200, assistantText: "Looking for existing table patterns to follow." }))

  // Write DataTable component
  all.push(...timedToolPair({ sessionId: SID_ALICE, tool: 'Write', toolInput: { file_path: 'src/components/DataTable.tsx', content: '// DataTable component with sorting, filtering...' }, preTime: 6000, postTime: 7200, assistantText: "Creating the DataTable component with sorting and pagination." }))

  // Edit component barrel
  all.push(...timedToolPair({ sessionId: SID_ALICE, tool: 'Edit', toolInput: { file_path: 'src/components/index.ts', old_string: "export { UserList }", new_string: "export { UserList }\nexport { DataTable } from './DataTable'" }, preTime: 8500, postTime: 9000, assistantText: "Adding DataTable to the component exports." }))

  // Read existing styles
  all.push(...timedToolPair({ sessionId: SID_ALICE, tool: 'Read', toolInput: { file_path: 'src/styles/theme.css' }, toolResponse: { content: ':root { --primary: #3b82f6; ... }' }, preTime: 10500, postTime: 11200, assistantText: "Checking the theme variables for consistent styling." }))

  // Write dashboard styles
  all.push(...timedToolPair({ sessionId: SID_ALICE, tool: 'Write', toolInput: { file_path: 'src/styles/dashboard.css', content: '.dashboard-grid { display: grid; ... }' }, preTime: 13000, postTime: 14000, assistantText: "Writing responsive dashboard grid styles." }))

  // Write chart widget
  all.push(...timedToolPair({ sessionId: SID_ALICE, tool: 'Write', toolInput: { file_path: 'src/components/ChartWidget.tsx', content: '// Chart widget with recharts...' }, preTime: 16000, postTime: 17200, assistantText: "Building the chart widget with recharts integration." }))

  // Edit route to add dashboard page
  all.push(...timedToolPair({ sessionId: SID_ALICE, tool: 'Edit', toolInput: { file_path: 'src/routes/index.tsx', old_string: '<Route path="/settings"', new_string: '<Route path="/dashboard" element={<Dashboard />} />\n      <Route path="/settings"' }, preTime: 19000, postTime: 19500, assistantText: "Adding the dashboard route." }))

  // Type-check
  all.push(...timedToolPair({ sessionId: SID_ALICE, tool: 'Bash', toolInput: { command: 'npx tsc --noEmit' }, toolResponse: { stdout: 'No errors found.' }, preTime: 21500, postTime: 23500, assistantText: "Running type check to make sure everything compiles." }))

  // Write dashboard page
  all.push(...timedToolPair({ sessionId: SID_ALICE, tool: 'Write', toolInput: { file_path: 'src/pages/Dashboard.tsx', content: '// Dashboard page composing DataTable + ChartWidget...' }, preTime: 25000, postTime: 26200, assistantText: "Assembling the dashboard page from the components." }))

  all.push({
    time: 28000,
    event: { type: 'stop', sessionId: SID_ALICE, cwd: DEMO_CWD + '/src', stopHookActive: false, response: "Dashboard page complete! DataTable with sorting/filtering, ChartWidget with recharts, responsive grid layout, and new /dashboard route." },
  })

  return {
    sessionId: SID_ALICE,
    managedId: MID_ALICE,
    name: 'Alice (Frontend)',
    cyclePause: 4000 / SPEED,
    initialDelay: 0,
    steps: toSteps(all),
  }
}

function createBobScenario() {
  const all: TimedEvent[] = []

  all.push({
    time: 0,
    event: { type: 'user_prompt_submit', sessionId: SID_BOB, cwd: DEMO_CWD + '/server', prompt: 'Create the analytics API endpoints that Alice\'s dashboard will consume' },
  })

  // Read model
  all.push(...timedToolPair({ sessionId: SID_BOB, tool: 'Read', toolInput: { file_path: 'server/models/User.ts' }, toolResponse: { content: '// User model with Prisma...' }, preTime: 2000, postTime: 2700, assistantText: "Reading the User model to understand the data shape." }))

  // Read existing routes
  all.push(...timedToolPair({ sessionId: SID_BOB, tool: 'Read', toolInput: { file_path: 'server/routes/index.ts' }, toolResponse: { content: '// Route setup...' }, preTime: 4500, postTime: 5200, assistantText: "Checking how routes are organized." }))

  // Grep for query patterns
  all.push(...timedToolPair({ sessionId: SID_BOB, tool: 'Grep', toolInput: { pattern: 'prisma\\.(user|analytics)\\.', path: 'server/' }, toolResponse: { matches: ['server/services/users.ts:12', 'server/services/users.ts:28'] }, preTime: 7000, postTime: 7800, assistantText: "Looking for existing Prisma query patterns." }))

  // Write analytics endpoint
  all.push(...timedToolPair({ sessionId: SID_BOB, tool: 'Write', toolInput: { file_path: 'server/routes/analytics.ts', content: '// Analytics API: /api/analytics/summary, /api/analytics/timeseries...' }, preTime: 9500, postTime: 10800, assistantText: "Creating the analytics endpoints with summary and timeseries data." }))

  // Edit middleware to add caching
  all.push(...timedToolPair({ sessionId: SID_BOB, tool: 'Edit', toolInput: { file_path: 'server/middleware/cache.ts', old_string: 'const CACHEABLE_ROUTES', new_string: "const CACHEABLE_ROUTES = ['/api/analytics/summary']" }, preTime: 12500, postTime: 13000, assistantText: "Adding response caching for the analytics summary." }))

  // Write analytics service
  all.push(...timedToolPair({ sessionId: SID_BOB, tool: 'Write', toolInput: { file_path: 'server/services/analytics.ts', content: '// Analytics service: aggregation queries, date ranges...' }, preTime: 15000, postTime: 16200, assistantText: "Building the analytics service with date-range aggregation." }))

  // Write test
  all.push(...timedToolPair({ sessionId: SID_BOB, tool: 'Write', toolInput: { file_path: 'server/tests/analytics.test.ts', content: '// Analytics endpoint tests...' }, preTime: 18000, postTime: 19200, assistantText: "Writing tests for the analytics endpoints." }))

  // Run tests
  all.push(...timedToolPair({ sessionId: SID_BOB, tool: 'Bash', toolInput: { command: 'npx vitest run server/tests/analytics.test.ts' }, toolResponse: { stdout: 'PASS  server/tests/analytics.test.ts\n  ✓ GET /api/analytics/summary\n  ✓ GET /api/analytics/timeseries\n  ✓ handles date ranges\n\nTests: 3 passed, 3 total' }, preTime: 21000, postTime: 24000, assistantText: "Running the analytics tests." }))

  // Wire up routes
  all.push(...timedToolPair({ sessionId: SID_BOB, tool: 'Edit', toolInput: { file_path: 'server/routes/index.ts', old_string: "app.use('/api/users'", new_string: "app.use('/api/analytics', analyticsRouter)\napp.use('/api/users'" }, preTime: 26000, postTime: 26500, assistantText: "Wiring the analytics router into the main app." }))

  all.push({
    time: 29000,
    event: { type: 'stop', sessionId: SID_BOB, cwd: DEMO_CWD + '/server', stopHookActive: false, response: "Analytics API complete! /api/analytics/summary and /api/analytics/timeseries endpoints with response caching, date-range queries, and 3 passing tests." },
  })

  return {
    sessionId: SID_BOB,
    managedId: MID_BOB,
    name: 'Bob (Backend)',
    cyclePause: 4000 / SPEED,
    initialDelay: 1000 / SPEED,
    steps: toSteps(all),
  }
}

// ============================================================================
// Public API
// ============================================================================

export function createPairProgrammingBundle(): DemoScenarioBundle {
  return {
    scenarios: [createAliceScenario(), createBobScenario()],
    managedSessions: createManagedSessions(),
    sessionIds: SESSION_IDS,
    managedIds: MANAGED_IDS,
  }
}
