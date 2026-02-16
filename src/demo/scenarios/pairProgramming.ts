/**
 * Pair Programming Scenario
 *
 * Two sessions (Alice frontend, Bob backend) working in parallel, each delegating
 * a side-task to a sub-agent mid-way through their work.
 *
 * Alice spawns a sub-agent to write component tests while she continues building.
 * Bob spawns a sub-agent to generate OpenAPI spec while he continues coding.
 *
 * 4 zones (2 main + 2 sub-agents). Shows "delegate tedious tasks while you keep building."
 */

import type { ManagedSession } from '../../../shared/types'
import type { DemoEducation, DemoScenario, DemoScenarioBundle } from '../types'
import { SPEED, DEMO_CWD, nextToolUseId, timedToolPair, toSteps, type TimedEvent } from '../helpers'

// ============================================================================
// Session / Managed IDs
// ============================================================================

const SID_ALICE = 'demo-pair-alice-0001'
const SID_BOB = 'demo-pair-bob-0001'
const SID_ALICE_TESTS = 'demo-subagent-alice-tests-0001'
const SID_BOB_DOCS = 'demo-subagent-bob-docs-0001'

const MID_ALICE = 'demo-managed-pair-alice-0001'
const MID_BOB = 'demo-managed-pair-bob-0001'
const MID_ALICE_TESTS = 'demo-managed-alice-tests-0001'
const MID_BOB_DOCS = 'demo-managed-bob-docs-0001'

const SESSION_IDS = [SID_ALICE, SID_BOB, SID_ALICE_TESTS, SID_BOB_DOCS] as const
const MANAGED_IDS = [MID_ALICE, MID_BOB, MID_ALICE_TESTS, MID_BOB_DOCS] as const

// ============================================================================
// Managed Sessions
// ============================================================================

function createManagedSessions(): ManagedSession[] {
  const now = Date.now()
  return [
    { id: MID_ALICE, name: 'Alice (Frontend)', tmuxSession: 'demo-alice', status: 'idle', claudeSessionId: SID_ALICE, createdAt: now, lastActivity: now, cwd: DEMO_CWD + '/src' },
    { id: MID_BOB, name: 'Bob (Backend)', tmuxSession: 'demo-bob', status: 'idle', claudeSessionId: SID_BOB, createdAt: now, lastActivity: now, cwd: DEMO_CWD + '/server' },
    { id: MID_ALICE_TESTS, name: 'Test Writer', tmuxSession: 'demo-alice-tests', status: 'idle', claudeSessionId: SID_ALICE_TESTS, createdAt: now, lastActivity: now, cwd: DEMO_CWD + '/src/__tests__' },
    { id: MID_BOB_DOCS, name: 'API Docs', tmuxSession: 'demo-bob-docs', status: 'idle', claudeSessionId: SID_BOB_DOCS, createdAt: now, lastActivity: now, cwd: DEMO_CWD + '/docs' },
  ]
}

// ============================================================================
// Scenarios
// ============================================================================

function createAliceScenario(): DemoScenario {
  const all: TimedEvent[] = []
  const taskTestsId = nextToolUseId()

  all.push({
    time: 0,
    event: { type: 'user_prompt_submit', sessionId: SID_ALICE, cwd: DEMO_CWD + '/src', prompt: 'Build a dashboard page with a data table component and chart widget' },
    phase: { name: 'Setup', description: 'Alice and Bob start their tasks in parallel' },
    narration: { text: 'Alice and Bob work side by side, each tackling their own feature.', duration: 5000 },
  })

  // Read existing component structure
  all.push(...timedToolPair({ sessionId: SID_ALICE, tool: 'Read', toolInput: { file_path: 'src/components/index.ts' }, toolResponse: { content: '// Component barrel exports...' }, preTime: 1500, postTime: 2200, assistantText: "Let me understand the existing component structure." }))

  // Grep for existing patterns
  all.push(...timedToolPair({ sessionId: SID_ALICE, tool: 'Grep', toolInput: { pattern: 'import.*Table|DataGrid|useTable', path: 'src/' }, toolResponse: { matches: ['src/components/UserList.tsx:4'] }, preTime: 3500, postTime: 4200, assistantText: "Looking for existing table patterns to follow." }))

  // Write DataTable component
  all.push(...timedToolPair({ sessionId: SID_ALICE, tool: 'Write', toolInput: { file_path: 'src/components/DataTable.tsx', content: '// DataTable component with sorting, filtering...' }, preTime: 6000, postTime: 7200, assistantText: "Creating the DataTable component with sorting and pagination." }))

  // Spawn sub-agent for component tests
  all.push({ time: 8500, event: { type: 'pre_tool_use' as const, sessionId: SID_ALICE, cwd: DEMO_CWD + '/src', tool: 'Task', toolInput: { description: 'Write component tests for DataTable', prompt: 'Write comprehensive tests for the DataTable component: rendering, sorting, filtering, pagination, empty states', subagent_type: 'general-purpose' }, toolUseId: taskTestsId, assistantText: "I'll delegate the test writing to a sub-agent while I continue building." }, phase: { name: 'Delegation', description: 'Each developer delegates a side-task to a sub-agent' }, narration: { text: 'Alice delegates her tests to a sub-agent so she can keep building components.', duration: 5000 } })

  // Alice continues building while tests are being written
  all.push(...timedToolPair({ sessionId: SID_ALICE, tool: 'Write', toolInput: { file_path: 'src/components/ChartWidget.tsx', content: '// Chart widget with recharts integration...' }, preTime: 10000, postTime: 11200, assistantText: "Building the chart widget while the test agent works." }))

  all.push(...timedToolPair({ sessionId: SID_ALICE, tool: 'Read', toolInput: { file_path: 'src/styles/theme.css' }, toolResponse: { content: ':root { --primary: #3b82f6; ... }' }, preTime: 12500, postTime: 13200, assistantText: "Checking the theme variables for consistent styling." }))

  all.push(...timedToolPair({ sessionId: SID_ALICE, tool: 'Write', toolInput: { file_path: 'src/styles/dashboard.css', content: '.dashboard-grid { display: grid; ... }' }, preTime: 14500, postTime: 15500, assistantText: "Writing responsive dashboard grid styles." }))

  all.push(...timedToolPair({ sessionId: SID_ALICE, tool: 'Edit', toolInput: { file_path: 'src/routes/index.tsx', old_string: '<Route path="/settings"', new_string: '<Route path="/dashboard" element={<Dashboard />} />\n      <Route path="/settings"' }, preTime: 17000, postTime: 17500, assistantText: "Adding the dashboard route." }))

  // Sub-agent finishes
  all.push({ time: 22000, event: { type: 'post_tool_use' as const, sessionId: SID_ALICE, cwd: DEMO_CWD + '/src', tool: 'Task', toolInput: { description: 'Write component tests for DataTable' }, toolResponse: { result: '8 tests written and passing for DataTable: rendering, sorting, filtering, pagination, empty states' }, toolUseId: taskTestsId, success: true, duration: 13500 }, phase: { name: 'Results', description: 'Reviewing and finishing up' } })

  // Alice reviews tests and finishes
  all.push(...timedToolPair({ sessionId: SID_ALICE, tool: 'Read', toolInput: { file_path: 'src/__tests__/DataTable.test.tsx' }, toolResponse: { content: '// 8 comprehensive tests...' }, preTime: 22500, postTime: 23200, assistantText: "Test agent finished! Let me review what it wrote." }))

  all.push(...timedToolPair({ sessionId: SID_ALICE, tool: 'Write', toolInput: { file_path: 'src/pages/Dashboard.tsx', content: '// Dashboard page composing DataTable + ChartWidget...' }, preTime: 24500, postTime: 25700, assistantText: "Assembling the dashboard page from all the components." }))

  all.push(...timedToolPair({ sessionId: SID_ALICE, tool: 'Bash', toolInput: { command: 'npx tsc --noEmit' }, toolResponse: { stdout: 'No errors found.' }, preTime: 27000, postTime: 29000, assistantText: "Running type check to make sure everything compiles." }))

  all.push({
    time: 31000,
    event: { type: 'stop', sessionId: SID_ALICE, cwd: DEMO_CWD + '/src', stopHookActive: false, response: "Dashboard page complete! DataTable with sorting/filtering, ChartWidget with recharts, responsive grid layout, /dashboard route, and 8 passing component tests (written by sub-agent)." },
  })

  // SUB-AGENT: Test Writer
  all.push({ time: 9000, event: { type: 'user_prompt_submit', sessionId: SID_ALICE_TESTS, cwd: DEMO_CWD + '/src/__tests__', prompt: 'Write comprehensive tests for the DataTable component: rendering, sorting, filtering, pagination, empty states' }, spawnBeam: { from: SID_ALICE, to: SID_ALICE_TESTS }, narration: { text: 'Sub-agents spawn in new zones and work independently.', duration: 5000 } })
  all.push(...timedToolPair({ sessionId: SID_ALICE_TESTS, tool: 'Read', toolInput: { file_path: 'src/components/DataTable.tsx' }, toolResponse: { content: '// DataTable component with sorting, filtering...' }, preTime: 10500, postTime: 11200, assistantText: "Reading the component to understand its props and behavior." }))
  all.push(...timedToolPair({ sessionId: SID_ALICE_TESTS, tool: 'Glob', toolInput: { pattern: 'src/__tests__/**/*.test.tsx' }, toolResponse: { matches: ['src/__tests__/UserList.test.tsx'] }, preTime: 12500, postTime: 13000, assistantText: "Checking existing test patterns to follow." }))
  all.push(...timedToolPair({ sessionId: SID_ALICE_TESTS, tool: 'Read', toolInput: { file_path: 'src/__tests__/UserList.test.tsx' }, toolResponse: { content: '// Existing test with testing-library...' }, preTime: 14000, postTime: 14700, assistantText: "Reading existing tests for conventions." }))
  all.push(...timedToolPair({ sessionId: SID_ALICE_TESTS, tool: 'Write', toolInput: { file_path: 'src/__tests__/DataTable.test.tsx', content: '// DataTable tests: render, sort, filter, paginate, empty...' }, preTime: 16000, postTime: 17000, assistantText: "Writing comprehensive test suite for DataTable." }))
  all.push(...timedToolPair({ sessionId: SID_ALICE_TESTS, tool: 'Bash', toolInput: { command: 'npx vitest run src/__tests__/DataTable.test.tsx' }, toolResponse: { stdout: 'PASS  src/__tests__/DataTable.test.tsx\n  DataTable\n    ✓ renders with data\n    ✓ sorts by column\n    ✓ filters rows\n    ✓ paginates\n    ✓ shows empty state\n    ✓ handles column resize\n    ✓ selects rows\n    ✓ exports to CSV\n\nTests: 8 passed, 8 total' }, preTime: 18500, postTime: 20500, assistantText: "Running the tests to make sure they all pass." }))
  all.push({ time: 21500, event: { type: 'stop', sessionId: SID_ALICE_TESTS, cwd: DEMO_CWD + '/src/__tests__', stopHookActive: false, response: "8 tests written and passing: rendering, sorting, filtering, pagination, empty states, column resize, row selection, CSV export." }, deleteZone: SID_ALICE_TESTS })

  return {
    sessionId: SID_ALICE,
    managedId: MID_ALICE,
    name: 'Alice (Frontend)',
    cyclePause: 4000 / SPEED,
    initialDelay: 0,
    steps: toSteps(all),
  }
}

function createBobScenario(): DemoScenario {
  const all: TimedEvent[] = []
  const taskDocsId = nextToolUseId()

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

  // Spawn sub-agent for API docs
  all.push({ time: 12000, event: { type: 'pre_tool_use' as const, sessionId: SID_BOB, cwd: DEMO_CWD + '/server', tool: 'Task', toolInput: { description: 'Generate OpenAPI spec and docs', prompt: 'Generate OpenAPI 3.0 spec for the analytics endpoints. Include request/response schemas, examples, and error codes. Write to docs/api.yaml', subagent_type: 'general-purpose' }, toolUseId: taskDocsId, assistantText: "I'll have a sub-agent generate the API documentation while I keep coding." } })

  // Bob continues while docs agent works
  all.push(...timedToolPair({ sessionId: SID_BOB, tool: 'Write', toolInput: { file_path: 'server/services/analytics.ts', content: '// Analytics service: aggregation queries, date ranges...' }, preTime: 13500, postTime: 14700, assistantText: "Building the analytics service with date-range aggregation." }))

  all.push(...timedToolPair({ sessionId: SID_BOB, tool: 'Edit', toolInput: { file_path: 'server/middleware/cache.ts', old_string: 'const CACHEABLE_ROUTES', new_string: "const CACHEABLE_ROUTES = ['/api/analytics/summary']" }, preTime: 16000, postTime: 16500, assistantText: "Adding response caching for the analytics summary." }))

  all.push(...timedToolPair({ sessionId: SID_BOB, tool: 'Write', toolInput: { file_path: 'server/tests/analytics.test.ts', content: '// Analytics endpoint tests...' }, preTime: 18000, postTime: 19200, assistantText: "Writing tests for the analytics endpoints." }))

  all.push(...timedToolPair({ sessionId: SID_BOB, tool: 'Bash', toolInput: { command: 'npx vitest run server/tests/analytics.test.ts' }, toolResponse: { stdout: 'PASS  server/tests/analytics.test.ts\n  ✓ GET /api/analytics/summary\n  ✓ GET /api/analytics/timeseries\n  ✓ handles date ranges\n\nTests: 3 passed, 3 total' }, preTime: 21000, postTime: 24000, assistantText: "Running the analytics tests." }))

  // Docs sub-agent finishes
  all.push({ time: 25000, event: { type: 'post_tool_use' as const, sessionId: SID_BOB, cwd: DEMO_CWD + '/server', tool: 'Task', toolInput: { description: 'Generate OpenAPI spec and docs' }, toolResponse: { result: 'OpenAPI 3.0 spec generated with schemas, examples, and error codes at docs/api.yaml' }, toolUseId: taskDocsId, success: true, duration: 13000 } })

  // Wire up routes
  all.push(...timedToolPair({ sessionId: SID_BOB, tool: 'Edit', toolInput: { file_path: 'server/routes/index.ts', old_string: "app.use('/api/users'", new_string: "app.use('/api/analytics', analyticsRouter)\napp.use('/api/users'" }, preTime: 26000, postTime: 26500, assistantText: "Wiring the analytics router into the main app." }))

  all.push({
    time: 29000,
    event: { type: 'stop', sessionId: SID_BOB, cwd: DEMO_CWD + '/server', stopHookActive: false, response: "Analytics API complete! /api/analytics/summary and /api/analytics/timeseries endpoints with response caching, 3 passing tests, and OpenAPI 3.0 spec (generated by sub-agent)." },
  })

  // SUB-AGENT: API Docs
  all.push({ time: 12500, event: { type: 'user_prompt_submit', sessionId: SID_BOB_DOCS, cwd: DEMO_CWD + '/docs', prompt: 'Generate OpenAPI 3.0 spec for the analytics endpoints with request/response schemas and examples' }, spawnBeam: { from: SID_BOB, to: SID_BOB_DOCS } })
  all.push(...timedToolPair({ sessionId: SID_BOB_DOCS, tool: 'Read', toolInput: { file_path: 'server/routes/analytics.ts' }, toolResponse: { content: '// Analytics API endpoints...' }, preTime: 14000, postTime: 14700, assistantText: "Reading the analytics routes to document." }))
  all.push(...timedToolPair({ sessionId: SID_BOB_DOCS, tool: 'Grep', toolInput: { pattern: 'interface.*Request|interface.*Response', path: 'server/' }, toolResponse: { matches: ['server/types/analytics.ts:5', 'server/types/analytics.ts:12'] }, preTime: 16000, postTime: 16700, assistantText: "Finding TypeScript interfaces to derive schemas from." }))
  all.push(...timedToolPair({ sessionId: SID_BOB_DOCS, tool: 'Read', toolInput: { file_path: 'server/types/analytics.ts' }, toolResponse: { content: '// Analytics request/response types...' }, preTime: 18000, postTime: 18700, assistantText: "Reading the type definitions for schema generation." }))
  all.push(...timedToolPair({ sessionId: SID_BOB_DOCS, tool: 'Write', toolInput: { file_path: 'docs/api.yaml', content: '# OpenAPI 3.0 spec for analytics API...' }, preTime: 20000, postTime: 21000, assistantText: "Writing the OpenAPI specification." }))
  all.push(...timedToolPair({ sessionId: SID_BOB_DOCS, tool: 'Bash', toolInput: { command: 'npx @redocly/cli lint docs/api.yaml' }, toolResponse: { stdout: 'No errors. Spec is valid OpenAPI 3.0.' }, preTime: 22000, postTime: 23500, assistantText: "Validating the spec with Redocly." }))
  all.push({ time: 24500, event: { type: 'stop', sessionId: SID_BOB_DOCS, cwd: DEMO_CWD + '/docs', stopHookActive: false, response: "OpenAPI 3.0 spec generated: 2 endpoints, request/response schemas, example payloads, error codes. Validated with Redocly." }, deleteZone: SID_BOB_DOCS })

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
    education: {
      intro: {
        title: 'Pair Programming',
        description: 'Alice builds frontend components while Bob handles the backend API. Each delegates a tedious side-task (tests, docs) to a sub-agent so they can stay focused on building.',
        watchFor: [
          'Two developers working in parallel on different features',
          'Each developer spawning a sub-agent for side-tasks',
          'Sub-agents handling tests and documentation automatically',
          'Main developers continuing to build while sub-agents work',
        ],
        agentCount: { orchestrators: 2, subagents: 2 },
      },
      summary: {
        achievements: [
          'Dashboard with DataGrid, FilterBar, and ExportButton',
          'REST API with pagination, filtering, and rate limiting',
          'Component tests and OpenAPI documentation generated in parallel',
        ],
        parallelTimeSaved: '~30s saved vs sequential execution',
      },
    },
  }
}
