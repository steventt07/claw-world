/**
 * Agent Swarm Scenario
 *
 * Multi-orchestrator agent swarm with 3 orchestrators and ~10 total agents:
 * - Architect: plans auth system, spawns 3 sub-agents (OAuth, UI, Tests)
 * - Backend Lead: refactors API, spawns 2 sub-agents (DB Migration, API Routes)
 * - DevOps Lead: sets up CI/CD, spawns 2 sub-agents (CI Pipeline, Deploy)
 */

import type { ManagedSession } from '../../../shared/types'
import type { DemoEducation, DemoScenario, DemoScenarioBundle } from '../types'
import { SPEED, DEMO_CWD, nextToolUseId, timedToolPair, toSteps, type TimedEvent } from '../helpers'

// ============================================================================
// Session / Managed IDs
// ============================================================================

// --- Architect swarm ---
const SID_ARCH = 'demo-architect-session-0001'
const SID_OAUTH = 'demo-subagent-oauth-0001'
const SID_UI = 'demo-subagent-ui-0002'
const SID_TESTS = 'demo-subagent-tests-0003'

const MID_ARCH = 'demo-managed-architect-0001'
const MID_OAUTH = 'demo-managed-oauth-0001'
const MID_UI = 'demo-managed-ui-0002'
const MID_TESTS = 'demo-managed-tests-0003'

// --- Backend Lead swarm ---
const SID_BACKEND = 'demo-backend-session-0001'
const SID_DBMIGR = 'demo-subagent-dbmigr-0001'
const SID_APIROUTES = 'demo-subagent-apiroutes-0001'

const MID_BACKEND = 'demo-managed-backend-0001'
const MID_DBMIGR = 'demo-managed-dbmigr-0001'
const MID_APIROUTES = 'demo-managed-apiroutes-0001'

// --- DevOps Lead swarm ---
const SID_DEVOPS = 'demo-devops-session-0001'
const SID_CIPIPE = 'demo-subagent-cipipe-0001'
const SID_DEPLOY = 'demo-subagent-deploy-0001'

const MID_DEVOPS = 'demo-managed-devops-0001'
const MID_CIPIPE = 'demo-managed-cipipe-0001'
const MID_DEPLOY = 'demo-managed-deploy-0001'

const SESSION_IDS = [
  SID_ARCH, SID_OAUTH, SID_UI, SID_TESTS,
  SID_BACKEND, SID_DBMIGR, SID_APIROUTES,
  SID_DEVOPS, SID_CIPIPE, SID_DEPLOY,
] as const

const MANAGED_IDS = [
  MID_ARCH, MID_OAUTH, MID_UI, MID_TESTS,
  MID_BACKEND, MID_DBMIGR, MID_APIROUTES,
  MID_DEVOPS, MID_CIPIPE, MID_DEPLOY,
] as const

// ============================================================================
// Managed Sessions Factory
// ============================================================================

function createManagedSessions(): ManagedSession[] {
  const now = Date.now()
  return [
    { id: MID_ARCH, name: 'Architect', tmuxSession: 'demo-architect', status: 'idle', claudeSessionId: SID_ARCH, createdAt: now, lastActivity: now, cwd: DEMO_CWD },
    { id: MID_OAUTH, name: 'OAuth Agent', tmuxSession: 'demo-oauth', status: 'idle', claudeSessionId: SID_OAUTH, createdAt: now, lastActivity: now, cwd: DEMO_CWD + '/server' },
    { id: MID_UI, name: 'UI Agent', tmuxSession: 'demo-ui', status: 'idle', claudeSessionId: SID_UI, createdAt: now, lastActivity: now, cwd: DEMO_CWD + '/src' },
    { id: MID_TESTS, name: 'Tests Agent', tmuxSession: 'demo-tests', status: 'idle', claudeSessionId: SID_TESTS, createdAt: now, lastActivity: now, cwd: DEMO_CWD + '/tests' },
    { id: MID_BACKEND, name: 'Backend Lead', tmuxSession: 'demo-backend', status: 'idle', claudeSessionId: SID_BACKEND, createdAt: now, lastActivity: now, cwd: DEMO_CWD + '/server' },
    { id: MID_DBMIGR, name: 'DB Migration', tmuxSession: 'demo-dbmigr', status: 'idle', claudeSessionId: SID_DBMIGR, createdAt: now, lastActivity: now, cwd: DEMO_CWD + '/server/db' },
    { id: MID_APIROUTES, name: 'API Routes', tmuxSession: 'demo-apiroutes', status: 'idle', claudeSessionId: SID_APIROUTES, createdAt: now, lastActivity: now, cwd: DEMO_CWD + '/server/routes' },
    { id: MID_DEVOPS, name: 'DevOps Lead', tmuxSession: 'demo-devops', status: 'idle', claudeSessionId: SID_DEVOPS, createdAt: now, lastActivity: now, cwd: DEMO_CWD + '/infra' },
    { id: MID_CIPIPE, name: 'CI Pipeline', tmuxSession: 'demo-cipipe', status: 'idle', claudeSessionId: SID_CIPIPE, createdAt: now, lastActivity: now, cwd: DEMO_CWD + '/.github' },
    { id: MID_DEPLOY, name: 'Deploy', tmuxSession: 'demo-deploy', status: 'idle', claudeSessionId: SID_DEPLOY, createdAt: now, lastActivity: now, cwd: DEMO_CWD + '/infra/deploy' },
  ]
}

// ============================================================================
// Scenario Definitions
// ============================================================================

function createArchitectScenario(): DemoScenario {
  const all: TimedEvent[] = []

  const taskOAuthId = nextToolUseId()
  const taskUIId = nextToolUseId()
  const taskTestsId = nextToolUseId()

  // ARCHITECT TRACK — Phase 1: Planning

  all.push({
    time: 0,
    event: { type: 'user_prompt_submit', sessionId: SID_ARCH, cwd: DEMO_CWD, prompt: 'Build a complete authentication system with OAuth, JWT, and tests' },
    phase: { name: 'Planning', description: 'Reading codebase and researching best practices' },
    narration: { text: 'The Architect begins by understanding the codebase before delegating work to specialized sub-agents.', duration: 5000 },
  })

  all.push(...timedToolPair({ sessionId: SID_ARCH, tool: 'Read', toolInput: { file_path: 'src/index.ts' }, toolResponse: { content: '// Main entry point...' }, preTime: 1500, postTime: 2300, assistantText: "Let me understand the project structure before planning the implementation." }))
  all.push(...timedToolPair({ sessionId: SID_ARCH, tool: 'Read', toolInput: { file_path: 'package.json' }, toolResponse: { content: '{ "dependencies": { "express": "^4.18.0" } }' }, preTime: 3500, postTime: 4100, assistantText: "I'll check the existing dependencies." }))
  all.push(...timedToolPair({ sessionId: SID_ARCH, tool: 'Grep', toolInput: { pattern: 'auth|session|token', path: 'src/' }, toolResponse: { matches: ['src/middleware/session.ts:3', 'src/routes/login.ts:1'] }, preTime: 5500, postTime: 6700, assistantText: "Let me check for any existing auth-related code." }))
  all.push(...timedToolPair({ sessionId: SID_ARCH, tool: 'WebSearch', toolInput: { query: 'OAuth 2.0 PKCE JWT best practices 2025' }, toolResponse: { results: [{ title: 'OAuth 2.0 Security Best Practices' }] }, preTime: 8000, postTime: 9800, assistantText: "I'll research current OAuth best practices before we start building." }))

  // Phase 2: Spawn sub-agents

  all.push({ time: 11500, event: { type: 'pre_tool_use' as const, sessionId: SID_ARCH, cwd: DEMO_CWD, tool: 'Task', toolInput: { description: 'Implement OAuth backend routes', prompt: 'Create OAuth 2.0 routes with Google/GitHub providers, token refresh, and PKCE flow', subagent_type: 'general-purpose' }, toolUseId: taskOAuthId, assistantText: "I'll delegate the OAuth backend to a sub-agent." }, phase: { name: 'Delegation', description: 'Spawning sub-agents for parallel work' }, narration: { text: 'Watch the portal station light up as sub-agents spawn into their own zones.', duration: 5000 } })
  all.push({ time: 13000, event: { type: 'pre_tool_use' as const, sessionId: SID_ARCH, cwd: DEMO_CWD, tool: 'Task', toolInput: { description: 'Build login/signup UI components', prompt: 'Create React login form, signup form, OAuth buttons, and password reset flow', subagent_type: 'general-purpose' }, toolUseId: taskUIId, assistantText: "Another sub-agent will handle the frontend UI." } })
  all.push({ time: 14500, event: { type: 'pre_tool_use' as const, sessionId: SID_ARCH, cwd: DEMO_CWD, tool: 'Task', toolInput: { description: 'Write auth integration tests', prompt: 'Write comprehensive tests for OAuth flow, JWT validation, and session management', subagent_type: 'general-purpose' }, toolUseId: taskTestsId, assistantText: "A third sub-agent will write integration tests in parallel." } })

  // Phase 3: Architect continues

  { const [pre, post] = timedToolPair({ sessionId: SID_ARCH, tool: 'Write', toolInput: { file_path: 'src/config/auth.ts', content: '// Auth config...' }, preTime: 16500, postTime: 17000, assistantText: "While the sub-agents work, I'll set up the shared auth config." }); all.push({ ...pre, phase: { name: 'Parallel Work', description: 'Architect continues while sub-agents build' } }, post) }
  all.push(...timedToolPair({ sessionId: SID_ARCH, tool: 'Edit', toolInput: { file_path: 'src/index.ts', old_string: "import { router } from './routes'", new_string: "import { router } from './routes'\nimport { authMiddleware } from './middleware/auth'" }, preTime: 18500, postTime: 18900, assistantText: "I'll wire up the auth middleware in the main entry point." }))
  all.push(...timedToolPair({ sessionId: SID_ARCH, tool: 'Bash', toolInput: { command: 'npm install jsonwebtoken bcrypt passport passport-google-oauth20' }, toolResponse: { stdout: 'added 5 packages in 3.1s' }, preTime: 20000, postTime: 22500, assistantText: "Let me install the required auth packages." }))

  // Task post events

  all.push({ time: 23500, event: { type: 'post_tool_use' as const, sessionId: SID_ARCH, cwd: DEMO_CWD, tool: 'Task', toolInput: { description: 'Implement OAuth backend routes' }, toolResponse: { result: 'OAuth routes implemented: /auth/google, /auth/github, /auth/callback, /auth/refresh' }, toolUseId: taskOAuthId, success: true, duration: 12000 }, phase: { name: 'Integration', description: 'Reviewing and integrating sub-agent results' }, narration: { text: 'Sub-agents report back and the Architect integrates their work into the main codebase.', duration: 5000 } })
  all.push(...timedToolPair({ sessionId: SID_ARCH, tool: 'Read', toolInput: { file_path: 'src/routes/auth.ts' }, toolResponse: { content: '// OAuth routes...' }, preTime: 24000, postTime: 24600, assistantText: "OAuth sub-agent finished. Let me review what it created." }))
  all.push(...timedToolPair({ sessionId: SID_ARCH, tool: 'Edit', toolInput: { file_path: 'src/routes/index.ts', old_string: "router.use('/api', apiRoutes)", new_string: "router.use('/api', apiRoutes)\nrouter.use('/auth', authRoutes)" }, preTime: 25500, postTime: 25900, assistantText: "I'll wire the OAuth routes into the main router." }))
  all.push({ time: 27500, event: { type: 'post_tool_use' as const, sessionId: SID_ARCH, cwd: DEMO_CWD, tool: 'Task', toolInput: { description: 'Build login/signup UI components' }, toolResponse: { result: 'UI components built: LoginForm, SignupForm, OAuthButtons, AuthProvider' }, toolUseId: taskUIId, success: true, duration: 14500 } })
  all.push(...timedToolPair({ sessionId: SID_ARCH, tool: 'Edit', toolInput: { file_path: 'src/App.tsx', old_string: '<Router>', new_string: '<AuthProvider>\n  <Router>' }, preTime: 28500, postTime: 28900, assistantText: "UI sub-agent is done. Let me integrate the auth components." }))
  all.push({ time: 31500, event: { type: 'post_tool_use' as const, sessionId: SID_ARCH, cwd: DEMO_CWD, tool: 'Task', toolInput: { description: 'Write auth integration tests' }, toolResponse: { result: 'All 15 tests passing' }, toolUseId: taskTestsId, success: true, duration: 17000 } })

  // Phase 4: Final build

  { const [pre, post] = timedToolPair({ sessionId: SID_ARCH, tool: 'Bash', toolInput: { command: 'npm run build' }, toolResponse: { stdout: '✓ Compiled successfully in 4.2s' }, preTime: 32500, postTime: 35500, assistantText: "All sub-agents done. Let me verify the full build passes." }); all.push({ ...pre, phase: { name: 'Verification', description: 'Building and verifying the complete system' } }, post) }
  all.push({ time: 37500, event: { type: 'stop', sessionId: SID_ARCH, cwd: DEMO_CWD, stopHookActive: false, response: "Auth system complete! OAuth 2.0 with Google & GitHub, JWT tokens, login/signup UI, and 15 passing tests. Sub-agents handled backend, UI, and tests in parallel." } })

  // SUB-AGENT 1: OAuth Backend

  all.push({ time: 12000, event: { type: 'user_prompt_submit', sessionId: SID_OAUTH, cwd: DEMO_CWD + '/server', prompt: 'Implement OAuth 2.0 routes with Google/GitHub providers, token refresh, and PKCE flow' }, spawnBeam: { from: SID_ARCH, to: SID_OAUTH }, narration: { text: 'Each sub-agent works independently in its own zone with its own set of tools.', duration: 5000 } })
  all.push(...timedToolPair({ sessionId: SID_OAUTH, tool: 'Glob', toolInput: { pattern: 'server/routes/**/*.ts' }, toolResponse: { matches: ['server/routes/index.ts', 'server/routes/api.ts'] }, preTime: 13500, postTime: 14000, assistantText: "Let me find the existing route files." }))
  all.push(...timedToolPair({ sessionId: SID_OAUTH, tool: 'Read', toolInput: { file_path: 'server/routes/index.ts' }, toolResponse: { content: '// Existing routes...' }, preTime: 15000, postTime: 15700, assistantText: "Checking the route structure before adding OAuth." }))
  all.push(...timedToolPair({ sessionId: SID_OAUTH, tool: 'WebFetch', toolInput: { url: 'https://developers.google.com/identity/protocols/oauth2', prompt: 'OAuth PKCE flow steps' }, toolResponse: { content: 'Authorization code flow with PKCE...' }, preTime: 16800, postTime: 17800, assistantText: "Checking Google's OAuth docs for the PKCE flow." }))
  all.push(...timedToolPair({ sessionId: SID_OAUTH, tool: 'Write', toolInput: { file_path: 'server/routes/oauth.ts', content: '// OAuth routes with PKCE...' }, preTime: 18800, postTime: 19500, assistantText: "Creating the OAuth route handlers with PKCE flow." }))
  all.push(...timedToolPair({ sessionId: SID_OAUTH, tool: 'Edit', toolInput: { file_path: 'server/config/passport.ts', old_string: 'export default passport', new_string: '// Configure Google + GitHub strategies\nexport default passport' }, preTime: 20500, postTime: 20900, assistantText: "Configuring passport strategies for both providers." }))
  all.push(...timedToolPair({ sessionId: SID_OAUTH, tool: 'Bash', toolInput: { command: 'curl -s http://localhost:3000/auth/health | jq .' }, toolResponse: { stdout: '{ "status": "ok", "providers": ["google", "github"] }' }, preTime: 21500, postTime: 22500, assistantText: "Let me verify the OAuth endpoints are responding." }))
  all.push({ time: 23000, event: { type: 'stop', sessionId: SID_OAUTH, cwd: DEMO_CWD + '/server', stopHookActive: false, response: "OAuth routes implemented: /auth/google, /auth/github, /auth/callback, /auth/refresh. PKCE flow with httpOnly cookies." }, deleteZone: SID_OAUTH })

  // SUB-AGENT 2: Login UI

  all.push({ time: 13500, event: { type: 'user_prompt_submit', sessionId: SID_UI, cwd: DEMO_CWD + '/src', prompt: 'Create React login form, signup form, OAuth buttons, and password reset flow' }, spawnBeam: { from: SID_ARCH, to: SID_UI } })
  all.push(...timedToolPair({ sessionId: SID_UI, tool: 'Read', toolInput: { file_path: 'src/components/index.ts' }, toolResponse: { content: '// Component exports...' }, preTime: 15000, postTime: 15700, assistantText: "Checking the existing component structure." }))
  all.push(...timedToolPair({ sessionId: SID_UI, tool: 'Grep', toolInput: { pattern: 'useAuth|AuthContext|<Form', path: 'src/components/' }, toolResponse: { matches: ['src/components/Nav.tsx:12: useAuth()', 'src/components/Profile.tsx:5: AuthContext'] }, preTime: 17200, postTime: 17800, assistantText: "Searching for existing auth patterns to match." }))
  all.push(...timedToolPair({ sessionId: SID_UI, tool: 'Write', toolInput: { file_path: 'src/components/LoginForm.tsx', content: '// Login form...' }, preTime: 19200, postTime: 19800, assistantText: "Creating the login form with email/password and OAuth buttons." }))
  all.push(...timedToolPair({ sessionId: SID_UI, tool: 'Write', toolInput: { file_path: 'src/components/SignupForm.tsx', content: '// Signup form...' }, preTime: 21200, postTime: 21800, assistantText: "Building the signup form with validation." }))
  all.push(...timedToolPair({ sessionId: SID_UI, tool: 'Bash', toolInput: { command: 'npx tsc --noEmit src/components/LoginForm.tsx src/components/SignupForm.tsx' }, toolResponse: { stdout: 'No errors found.' }, preTime: 23000, postTime: 23800, assistantText: "Running type check on the new components." }))
  all.push(...timedToolPair({ sessionId: SID_UI, tool: 'Edit', toolInput: { file_path: 'src/context/AuthProvider.tsx', old_string: 'export const AuthContext', new_string: '// Enhanced auth context with OAuth support\nexport const AuthContext' }, preTime: 24800, postTime: 25200, assistantText: "Updating the AuthProvider context with token management." }))
  all.push({ time: 27000, event: { type: 'stop', sessionId: SID_UI, cwd: DEMO_CWD + '/src', stopHookActive: false, response: "UI components built: LoginForm, SignupForm, OAuthButtons, AuthProvider context with form validation and loading states." }, deleteZone: SID_UI })

  // SUB-AGENT 3: Tests

  all.push({ time: 15000, event: { type: 'user_prompt_submit', sessionId: SID_TESTS, cwd: DEMO_CWD + '/tests', prompt: 'Write comprehensive tests for OAuth flow, JWT validation, and session management' }, spawnBeam: { from: SID_ARCH, to: SID_TESTS } })
  all.push(...timedToolPair({ sessionId: SID_TESTS, tool: 'Read', toolInput: { file_path: 'tests/helpers/setup.ts' }, toolResponse: { content: '// Test setup with mock providers...' }, preTime: 16800, postTime: 17400, assistantText: "Reading existing test setup patterns." }))
  all.push(...timedToolPair({ sessionId: SID_TESTS, tool: 'Glob', toolInput: { pattern: 'tests/fixtures/**/*.json' }, toolResponse: { matches: ['tests/fixtures/users.json', 'tests/fixtures/tokens.json'] }, preTime: 18500, postTime: 19000, assistantText: "Finding test fixtures to reuse." }))
  all.push(...timedToolPair({ sessionId: SID_TESTS, tool: 'Write', toolInput: { file_path: 'tests/auth/oauth.test.ts', content: '// OAuth flow tests...' }, preTime: 20000, postTime: 20600, assistantText: "Writing OAuth flow tests for both providers." }))
  all.push(...timedToolPair({ sessionId: SID_TESTS, tool: 'Write', toolInput: { file_path: 'tests/auth/jwt.test.ts', content: '// JWT validation tests...' }, preTime: 21800, postTime: 22400, assistantText: "Creating JWT validation and expiry tests." }))
  all.push(...timedToolPair({ sessionId: SID_TESTS, tool: 'Bash', toolInput: { command: 'npx vitest run tests/auth/' }, toolResponse: { stdout: 'FAIL  tests/auth/jwt.test.ts\n  ✗ should reject expired tokens\n\nTests: 1 failed, 14 passed, 15 total' }, success: false, preTime: 23200, postTime: 25800, assistantText: "Running the test suite to check for issues." }))
  all.push(...timedToolPair({ sessionId: SID_TESTS, tool: 'Edit', toolInput: { file_path: 'tests/auth/jwt.test.ts', old_string: "expect(token).toBeNull()", new_string: "expect(result.error).toBe('TOKEN_EXPIRED')" }, preTime: 26500, postTime: 26900, assistantText: "The assertion was wrong — fixing the expired token test." }))
  all.push(...timedToolPair({ sessionId: SID_TESTS, tool: 'Bash', toolInput: { command: 'npx vitest run tests/auth/' }, toolResponse: { stdout: 'PASS  tests/auth/\n  ✓ oauth.test.ts (5 tests)\n  ✓ jwt.test.ts (4 tests)\n  ✓ session.test.ts (6 tests)\n\nTests: 15 passed, 15 total' }, preTime: 28000, postTime: 30500, assistantText: "Rerunning tests to confirm the fix." }))
  all.push({ time: 31000, event: { type: 'stop', sessionId: SID_TESTS, cwd: DEMO_CWD + '/tests', stopHookActive: false, response: "All 15 tests passing: 5 OAuth flow, 4 JWT validation, 6 session management." }, deleteZone: SID_TESTS })

  return {
    sessionId: SID_ARCH,
    managedId: MID_ARCH,
    name: 'Architect',
    cyclePause: 5000 / SPEED,
    initialDelay: 500,
    steps: toSteps(all),
  }
}

function createBackendScenario(): DemoScenario {
  const all: TimedEvent[] = []
  const taskDbMigrId = nextToolUseId()
  const taskApiRoutesId = nextToolUseId()

  // BACKEND LEAD TRACK

  all.push({ time: 0, event: { type: 'user_prompt_submit', sessionId: SID_BACKEND, cwd: DEMO_CWD + '/server', prompt: 'Refactor the API layer: migrate DB schema to v2 and add new REST endpoints' } })
  all.push(...timedToolPair({ sessionId: SID_BACKEND, tool: 'Read', toolInput: { file_path: 'server/db/schema.ts' }, toolResponse: { content: '// Current schema v1...' }, preTime: 1500, postTime: 2200, assistantText: "Let me review the current database schema before planning the migration." }))
  all.push(...timedToolPair({ sessionId: SID_BACKEND, tool: 'Grep', toolInput: { pattern: 'router\\.(get|post|put|delete)', path: 'server/routes/' }, toolResponse: { matches: ['server/routes/users.ts:5', 'server/routes/users.ts:12', 'server/routes/posts.ts:8'] }, preTime: 3500, postTime: 4500, assistantText: "Searching for existing API route patterns to understand the convention." }))
  all.push(...timedToolPair({ sessionId: SID_BACKEND, tool: 'Read', toolInput: { file_path: 'server/config/database.ts' }, toolResponse: { content: '// Database config with connection pool...' }, preTime: 6000, postTime: 6800, assistantText: "Checking the database configuration and connection setup." }))

  // Spawn sub-agents
  all.push({ time: 10000, event: { type: 'pre_tool_use' as const, sessionId: SID_BACKEND, cwd: DEMO_CWD + '/server', tool: 'Task', toolInput: { description: 'Run DB schema migration to v2', prompt: 'Create migration scripts for schema v2: add roles table, update users with role_id FK, seed default roles', subagent_type: 'Bash' }, toolUseId: taskDbMigrId, assistantText: "I'll have a sub-agent handle the database migration scripts." } })
  all.push({ time: 12000, event: { type: 'pre_tool_use' as const, sessionId: SID_BACKEND, cwd: DEMO_CWD + '/server', tool: 'Task', toolInput: { description: 'Create new REST API routes', prompt: 'Add /api/v2/users, /api/v2/roles, and /api/v2/permissions endpoints with validation', subagent_type: 'general-purpose' }, toolUseId: taskApiRoutesId, assistantText: "Another sub-agent will build the new API routes." } })

  // Backend Lead continues
  all.push(...timedToolPair({ sessionId: SID_BACKEND, tool: 'Write', toolInput: { file_path: 'server/types/api.ts', content: '// Shared API types for v2...' }, preTime: 14000, postTime: 14600, assistantText: "I'll define the shared TypeScript types for the v2 API." }))
  all.push(...timedToolPair({ sessionId: SID_BACKEND, tool: 'Edit', toolInput: { file_path: 'server/routes/index.ts', old_string: "app.use('/api', v1Router)", new_string: "app.use('/api', v1Router)\napp.use('/api/v2', v2Router)" }, preTime: 16500, postTime: 17000, assistantText: "Wiring up the v2 router alongside the existing v1." }))

  // Task post events
  all.push({ time: 28000, event: { type: 'post_tool_use' as const, sessionId: SID_BACKEND, cwd: DEMO_CWD + '/server', tool: 'Task', toolInput: { description: 'Run DB schema migration to v2' }, toolResponse: { result: 'Migration complete: roles table created, users.role_id added, 3 default roles seeded' }, toolUseId: taskDbMigrId, success: true, duration: 18000 } })
  all.push(...timedToolPair({ sessionId: SID_BACKEND, tool: 'Read', toolInput: { file_path: 'server/db/migrations/002_add_roles.ts' }, toolResponse: { content: '// Migration: create roles table...' }, preTime: 28500, postTime: 29200, assistantText: "DB migration done. Let me verify the migration script." }))
  all.push({ time: 30000, event: { type: 'post_tool_use' as const, sessionId: SID_BACKEND, cwd: DEMO_CWD + '/server', tool: 'Task', toolInput: { description: 'Create new REST API routes' }, toolResponse: { result: 'API v2 routes created: /users, /roles, /permissions with Zod validation' }, toolUseId: taskApiRoutesId, success: true, duration: 18000 } })

  // Integration
  all.push(...timedToolPair({ sessionId: SID_BACKEND, tool: 'Edit', toolInput: { file_path: 'server/middleware/validation.ts', old_string: 'export const validate', new_string: '// Enhanced with Zod schemas for v2\nexport const validate' }, preTime: 31000, postTime: 31500, assistantText: "Integrating the validation middleware from the API routes agent." }))
  all.push(...timedToolPair({ sessionId: SID_BACKEND, tool: 'Bash', toolInput: { command: 'npx tsc --noEmit && npm run test:api' }, toolResponse: { stdout: 'No errors. 12 tests passed.' }, preTime: 32500, postTime: 34500, assistantText: "Running type check and API tests to verify everything works together." }))
  all.push({ time: 35000, event: { type: 'stop', sessionId: SID_BACKEND, cwd: DEMO_CWD + '/server', stopHookActive: false, response: "API refactor complete! Schema v2 migrated with roles, new REST endpoints with Zod validation, all 12 API tests passing." } })

  // SUB-AGENT: DB Migration

  all.push({ time: 10500, event: { type: 'user_prompt_submit', sessionId: SID_DBMIGR, cwd: DEMO_CWD + '/server/db', prompt: 'Create migration scripts for schema v2: add roles table, update users with role_id FK, seed default roles' }, spawnBeam: { from: SID_BACKEND, to: SID_DBMIGR } })
  all.push(...timedToolPair({ sessionId: SID_DBMIGR, tool: 'Read', toolInput: { file_path: 'server/db/migrations/001_initial.ts' }, toolResponse: { content: '// Initial migration...' }, preTime: 12000, postTime: 12700, assistantText: "Reading the existing migration format." }))
  all.push(...timedToolPair({ sessionId: SID_DBMIGR, tool: 'Glob', toolInput: { pattern: 'server/db/migrations/*.ts' }, toolResponse: { matches: ['server/db/migrations/001_initial.ts'] }, preTime: 14000, postTime: 14500, assistantText: "Checking existing migrations to determine next number." }))
  all.push(...timedToolPair({ sessionId: SID_DBMIGR, tool: 'Write', toolInput: { file_path: 'server/db/migrations/002_add_roles.ts', content: '// Create roles table...' }, preTime: 16000, postTime: 16700, assistantText: "Creating the roles table migration." }))
  all.push(...timedToolPair({ sessionId: SID_DBMIGR, tool: 'Write', toolInput: { file_path: 'server/db/migrations/003_seed_roles.ts', content: '// Seed admin, editor, viewer...' }, preTime: 18500, postTime: 19200, assistantText: "Adding seed data for default roles." }))
  all.push(...timedToolPair({ sessionId: SID_DBMIGR, tool: 'Bash', toolInput: { command: 'npx knex migrate:latest --knexfile server/knexfile.ts' }, toolResponse: { stdout: 'Batch 2 run: 2 migrations\n  002_add_roles.ts\n  003_seed_roles.ts' }, preTime: 21000, postTime: 24500, assistantText: "Running the migrations against the development database." }))
  all.push({ time: 27000, event: { type: 'stop', sessionId: SID_DBMIGR, cwd: DEMO_CWD + '/server/db', stopHookActive: false, response: "Migration complete: roles table created, users.role_id FK added, 3 default roles seeded." }, deleteZone: SID_DBMIGR })

  // SUB-AGENT: API Routes

  all.push({ time: 12500, event: { type: 'user_prompt_submit', sessionId: SID_APIROUTES, cwd: DEMO_CWD + '/server/routes', prompt: 'Add /api/v2/users, /api/v2/roles, and /api/v2/permissions endpoints with validation' }, spawnBeam: { from: SID_BACKEND, to: SID_APIROUTES } })
  all.push(...timedToolPair({ sessionId: SID_APIROUTES, tool: 'Grep', toolInput: { pattern: 'export.*Schema|z\\.object', path: 'server/' }, toolResponse: { matches: ['server/validation/users.ts:3', 'server/validation/posts.ts:8'] }, preTime: 14000, postTime: 14800, assistantText: "Looking at existing Zod validation patterns." }))
  all.push(...timedToolPair({ sessionId: SID_APIROUTES, tool: 'Read', toolInput: { file_path: 'server/routes/users.ts' }, toolResponse: { content: '// V1 users routes...' }, preTime: 16500, postTime: 17200, assistantText: "Reading the v1 users route to understand the pattern." }))
  all.push(...timedToolPair({ sessionId: SID_APIROUTES, tool: 'Write', toolInput: { file_path: 'server/routes/v2/users.ts', content: '// V2 users with roles...' }, preTime: 19000, postTime: 19700, assistantText: "Creating the v2 users endpoint with role-aware queries." }))
  all.push(...timedToolPair({ sessionId: SID_APIROUTES, tool: 'Edit', toolInput: { file_path: 'server/routes/v2/index.ts', old_string: "export const v2Router = Router()", new_string: "export const v2Router = Router()\nv2Router.use('/users', usersRouter)\nv2Router.use('/roles', rolesRouter)" }, preTime: 22000, postTime: 22500, assistantText: "Wiring up the v2 sub-routes." }))
  all.push(...timedToolPair({ sessionId: SID_APIROUTES, tool: 'Bash', toolInput: { command: 'curl -s http://localhost:3000/api/v2/roles | jq .' }, toolResponse: { stdout: '[{"id":1,"name":"admin"},{"id":2,"name":"editor"},{"id":3,"name":"viewer"}]' }, preTime: 24500, postTime: 25800, assistantText: "Quick smoke test of the new roles endpoint." }))
  all.push({ time: 29000, event: { type: 'stop', sessionId: SID_APIROUTES, cwd: DEMO_CWD + '/server/routes', stopHookActive: false, response: "V2 API routes created: /users (CRUD with roles), /roles, /permissions. All with Zod validation." }, deleteZone: SID_APIROUTES })

  return {
    sessionId: SID_BACKEND,
    managedId: MID_BACKEND,
    name: 'Backend Lead',
    cyclePause: 5000 / SPEED,
    initialDelay: 5000 / SPEED,
    steps: toSteps(all),
  }
}

function createDevOpsScenario(): DemoScenario {
  const all: TimedEvent[] = []
  const taskCiPipeId = nextToolUseId()
  const taskDeployId = nextToolUseId()

  // DEVOPS LEAD TRACK

  all.push({ time: 0, event: { type: 'user_prompt_submit', sessionId: SID_DEVOPS, cwd: DEMO_CWD + '/infra', prompt: 'Set up CI/CD pipeline with GitHub Actions and Kubernetes deployment' } })
  all.push(...timedToolPair({ sessionId: SID_DEVOPS, tool: 'Read', toolInput: { file_path: 'package.json' }, toolResponse: { content: '{ "scripts": { "test": "vitest", "build": "tsc && vite build" } }' }, preTime: 1500, postTime: 2300, assistantText: "Checking the project's build and test scripts." }))
  all.push(...timedToolPair({ sessionId: SID_DEVOPS, tool: 'Bash', toolInput: { command: 'node -v && npm -v && docker --version' }, toolResponse: { stdout: 'v20.11.0\n10.2.4\nDocker version 25.0.3' }, preTime: 4000, postTime: 4800, assistantText: "Checking runtime versions for the CI environment." }))
  all.push(...timedToolPair({ sessionId: SID_DEVOPS, tool: 'Glob', toolInput: { pattern: '{Dockerfile,docker-compose*,.github/**}' }, toolResponse: { matches: ['Dockerfile', '.github/dependabot.yml'] }, preTime: 6500, postTime: 7200, assistantText: "Finding existing Docker and CI config files." }))

  // Spawn sub-agents
  all.push({ time: 8000, event: { type: 'pre_tool_use' as const, sessionId: SID_DEVOPS, cwd: DEMO_CWD + '/infra', tool: 'Task', toolInput: { description: 'Create GitHub Actions CI pipeline', prompt: 'Create .github/workflows/ci.yml with lint, test, build stages. Use Node 20, cache npm, run on PR and push to main', subagent_type: 'Bash' }, toolUseId: taskCiPipeId, assistantText: "A sub-agent will create the CI pipeline workflow." } })
  all.push({ time: 10000, event: { type: 'pre_tool_use' as const, sessionId: SID_DEVOPS, cwd: DEMO_CWD + '/infra', tool: 'Task', toolInput: { description: 'Set up Kubernetes deployment', prompt: 'Create k8s manifests: deployment, service, ingress, and HPA. Use rolling update strategy', subagent_type: 'Explore' }, toolUseId: taskDeployId, assistantText: "Another sub-agent will handle the Kubernetes manifests." } })

  // DevOps continues
  all.push(...timedToolPair({ sessionId: SID_DEVOPS, tool: 'Write', toolInput: { file_path: 'docker-compose.yml', content: '# Multi-stage docker-compose for dev/prod...' }, preTime: 12000, postTime: 12700, assistantText: "Setting up the Docker Compose configuration." }))
  all.push(...timedToolPair({ sessionId: SID_DEVOPS, tool: 'Edit', toolInput: { file_path: 'Makefile', old_string: 'build:\n\tnpm run build', new_string: 'build:\n\tnpm run build\n\ndocker-build:\n\tdocker build -t app:latest .' }, preTime: 14500, postTime: 15000, assistantText: "Adding Docker build targets to the Makefile." }))

  // Task post events
  all.push({ time: 25000, event: { type: 'post_tool_use' as const, sessionId: SID_DEVOPS, cwd: DEMO_CWD + '/infra', tool: 'Task', toolInput: { description: 'Create GitHub Actions CI pipeline' }, toolResponse: { result: 'CI workflow created: lint → test → build stages with npm caching' }, toolUseId: taskCiPipeId, success: true, duration: 17000 } })
  all.push(...timedToolPair({ sessionId: SID_DEVOPS, tool: 'Bash', toolInput: { command: 'act --list .github/workflows/ci.yml' }, toolResponse: { stdout: 'Stage 0: lint\nStage 1: test\nStage 2: build\nStage 3: docker-push' }, preTime: 25500, postTime: 26500, assistantText: "Validating the CI workflow with act." }))
  all.push({ time: 28000, event: { type: 'post_tool_use' as const, sessionId: SID_DEVOPS, cwd: DEMO_CWD + '/infra', tool: 'Task', toolInput: { description: 'Set up Kubernetes deployment' }, toolResponse: { result: 'K8s manifests created: deployment, service, ingress, HPA' }, toolUseId: taskDeployId, success: true, duration: 18000 } })

  // Integration
  all.push(...timedToolPair({ sessionId: SID_DEVOPS, tool: 'Read', toolInput: { file_path: 'infra/k8s/deployment.yaml' }, toolResponse: { content: '# Kubernetes deployment with rolling updates...' }, preTime: 28500, postTime: 29200, assistantText: "Reviewing the generated Kubernetes deployment." }))
  all.push({ time: 30000, event: { type: 'stop', sessionId: SID_DEVOPS, cwd: DEMO_CWD + '/infra', stopHookActive: false, response: "CI/CD complete! GitHub Actions pipeline (lint→test→build→push), K8s deployment with HPA, Docker Compose for local dev." } })

  // SUB-AGENT: CI Pipeline

  all.push({ time: 8500, event: { type: 'user_prompt_submit', sessionId: SID_CIPIPE, cwd: DEMO_CWD + '/.github', prompt: 'Create .github/workflows/ci.yml with lint, test, build stages. Use Node 20, cache npm' }, spawnBeam: { from: SID_DEVOPS, to: SID_CIPIPE } })
  all.push(...timedToolPair({ sessionId: SID_CIPIPE, tool: 'Read', toolInput: { file_path: '.github/dependabot.yml' }, toolResponse: { content: '# Dependabot config...' }, preTime: 10000, postTime: 10600, assistantText: "Checking existing GitHub config for conventions." }))
  all.push(...timedToolPair({ sessionId: SID_CIPIPE, tool: 'Write', toolInput: { file_path: '.github/workflows/ci.yml', content: '# CI pipeline...' }, preTime: 12500, postTime: 13200, assistantText: "Creating the CI workflow file." }))
  all.push(...timedToolPair({ sessionId: SID_CIPIPE, tool: 'Edit', toolInput: { file_path: '.github/workflows/ci.yml', old_string: 'runs-on: ubuntu-latest', new_string: 'runs-on: ubuntu-latest\n    timeout-minutes: 10' }, preTime: 15000, postTime: 15400, assistantText: "Adding timeout to prevent runaway CI jobs." }))
  all.push(...timedToolPair({ sessionId: SID_CIPIPE, tool: 'Write', toolInput: { file_path: '.github/workflows/deploy.yml', content: '# Deploy on tag push...' }, preTime: 17500, postTime: 18200, assistantText: "Creating the deploy-on-tag workflow." }))
  all.push(...timedToolPair({ sessionId: SID_CIPIPE, tool: 'Bash', toolInput: { command: 'yamllint .github/workflows/*.yml' }, toolResponse: { stdout: '.github/workflows/ci.yml: OK\n.github/workflows/deploy.yml: OK' }, preTime: 20000, postTime: 21500, assistantText: "Validating the YAML syntax." }))
  all.push({ time: 24000, event: { type: 'stop', sessionId: SID_CIPIPE, cwd: DEMO_CWD + '/.github', stopHookActive: false, response: "CI pipeline created: lint, test, build stages with npm cache. Deploy workflow triggers on tag push." }, deleteZone: SID_CIPIPE })

  // SUB-AGENT: Deploy

  all.push({ time: 10500, event: { type: 'user_prompt_submit', sessionId: SID_DEPLOY, cwd: DEMO_CWD + '/infra/deploy', prompt: 'Create k8s manifests: deployment, service, ingress, and HPA. Use rolling update strategy' }, spawnBeam: { from: SID_DEVOPS, to: SID_DEPLOY } })
  all.push(...timedToolPair({ sessionId: SID_DEPLOY, tool: 'WebFetch', toolInput: { url: 'https://kubernetes.io/docs/concepts/workloads/controllers/deployment/', prompt: 'Rolling update strategy best practices' }, toolResponse: { content: 'Rolling update with maxSurge: 25%, maxUnavailable: 25%...' }, preTime: 12000, postTime: 13200, assistantText: "Checking K8s docs for rolling update best practices." }))
  all.push(...timedToolPair({ sessionId: SID_DEPLOY, tool: 'Read', toolInput: { file_path: 'Dockerfile' }, toolResponse: { content: 'FROM node:20-alpine AS builder...' }, preTime: 15000, postTime: 15700, assistantText: "Reading the Dockerfile to match container config." }))
  all.push(...timedToolPair({ sessionId: SID_DEPLOY, tool: 'Write', toolInput: { file_path: 'infra/k8s/deployment.yaml', content: '# K8s deployment manifest...' }, preTime: 17500, postTime: 18200, assistantText: "Creating the Kubernetes deployment manifest." }))
  all.push(...timedToolPair({ sessionId: SID_DEPLOY, tool: 'Bash', toolInput: { command: 'kubectl apply --dry-run=client -f infra/k8s/' }, toolResponse: { stdout: 'deployment.apps/app created (dry run)\nservice/app created (dry run)\ningress.networking.k8s.io/app created (dry run)' }, preTime: 20500, postTime: 22500, assistantText: "Dry-run validation of the K8s manifests." }))
  all.push(...timedToolPair({ sessionId: SID_DEPLOY, tool: 'Edit', toolInput: { file_path: 'infra/k8s/deployment.yaml', old_string: 'replicas: 1', new_string: 'replicas: 2' }, preTime: 24000, postTime: 24400, assistantText: "Bumping default replicas to 2 for high availability." }))
  all.push({ time: 27000, event: { type: 'stop', sessionId: SID_DEPLOY, cwd: DEMO_CWD + '/infra/deploy', stopHookActive: false, response: "K8s manifests created: deployment (2 replicas, rolling update), service, ingress, HPA (2-10 pods, 70% CPU target)." }, deleteZone: SID_DEPLOY })

  return {
    sessionId: SID_DEVOPS,
    managedId: MID_DEVOPS,
    name: 'DevOps Lead',
    cyclePause: 5000 / SPEED,
    initialDelay: 10000 / SPEED,
    steps: toSteps(all),
  }
}

// ============================================================================
// Public API
// ============================================================================

export function createAgentSwarmBundle(): DemoScenarioBundle {
  return {
    scenarios: [
      createArchitectScenario(),
      createBackendScenario(),
      createDevOpsScenario(),
    ],
    managedSessions: createManagedSessions(),
    sessionIds: SESSION_IDS,
    managedIds: MANAGED_IDS,
    education: {
      intro: {
        title: 'Agent Swarm',
        description: 'Three orchestrators (Architect, Backend Lead, DevOps) each plan their area, then spawn specialized sub-agents to work in parallel. Watch how work flows from planning to delegation to parallel execution.',
        watchFor: [
          'Spawn beams connecting orchestrators to their sub-agents',
          'Sub-agents working independently at different stations',
          'Orchestrators continuing their own work while sub-agents build',
          'Sub-agent zones disappearing as tasks complete',
        ],
        agentCount: { orchestrators: 3, subagents: 7 },
      },
      summary: {
        achievements: [
          'Auth system with OAuth, JWT, and 15 tests',
          'API v2 with schema migration and Zod validation',
          'CI/CD pipeline with GitHub Actions and K8s deployment',
        ],
        parallelTimeSaved: '~60s saved vs sequential execution',
      },
    },
  }
}
