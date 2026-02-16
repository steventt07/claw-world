/**
 * Code Review Scenario
 *
 * Main reviewer reads initial files, then spawns 3 parallel analysis sub-agents:
 *   1. Security Scanner - grep/read for XSS, SQL injection, insecure patterns
 *   2. Test Coverage - check which functions lack tests
 *   3. Dependency Auditor - audit packages for known vulnerabilities
 *
 * Reviewer continues reading while sub-agents scan, then makes targeted fixes
 * based on their findings. 4 zones (1 main + 3 sub-agents).
 *
 * Shows "parallelize analysis across multiple concerns" pattern.
 */

import type { ManagedSession } from '../../../shared/types'
import type { DemoScenario, DemoScenarioBundle } from '../types'
import { SPEED, DEMO_CWD, nextToolUseId, timedToolPair, toSteps, type TimedEvent } from '../helpers'

// ============================================================================
// Session / Managed IDs
// ============================================================================

const SID = 'demo-review-session-0001'
const SID_SECURITY = 'demo-subagent-security-0001'
const SID_COVERAGE = 'demo-subagent-coverage-0001'
const SID_DEPS = 'demo-subagent-deps-0001'

const MID = 'demo-managed-review-0001'
const MID_SECURITY = 'demo-managed-security-0001'
const MID_COVERAGE = 'demo-managed-coverage-0001'
const MID_DEPS = 'demo-managed-deps-0001'

const SESSION_IDS = [SID, SID_SECURITY, SID_COVERAGE, SID_DEPS] as const
const MANAGED_IDS = [MID, MID_SECURITY, MID_COVERAGE, MID_DEPS] as const

// ============================================================================
// Managed Sessions
// ============================================================================

function createManagedSessions(): ManagedSession[] {
  const now = Date.now()
  return [
    { id: MID, name: 'Code Review', tmuxSession: 'demo-review', status: 'idle', claudeSessionId: SID, createdAt: now, lastActivity: now, cwd: DEMO_CWD },
    { id: MID_SECURITY, name: 'Security Scan', tmuxSession: 'demo-security', status: 'idle', claudeSessionId: SID_SECURITY, createdAt: now, lastActivity: now, cwd: DEMO_CWD + '/src' },
    { id: MID_COVERAGE, name: 'Coverage Check', tmuxSession: 'demo-coverage', status: 'idle', claudeSessionId: SID_COVERAGE, createdAt: now, lastActivity: now, cwd: DEMO_CWD + '/tests' },
    { id: MID_DEPS, name: 'Dep Audit', tmuxSession: 'demo-deps', status: 'idle', claudeSessionId: SID_DEPS, createdAt: now, lastActivity: now, cwd: DEMO_CWD },
  ]
}

// ============================================================================
// Scenario
// ============================================================================

function createReviewScenario(): DemoScenario {
  const all: TimedEvent[] = []
  const taskSecurityId = nextToolUseId()
  const taskCoverageId = nextToolUseId()
  const taskDepsId = nextToolUseId()

  all.push({
    time: 0,
    event: { type: 'user_prompt_submit', sessionId: SID, cwd: DEMO_CWD, prompt: 'Do a comprehensive review of the auth module: security, test coverage, and dependency health' },
  })

  // --- Initial read phase ---

  all.push(...timedToolPair({
    sessionId: SID, tool: 'Read',
    toolInput: { file_path: 'src/auth/login.ts' },
    toolResponse: { content: '// Login handler with password verification...' },
    preTime: 1500, postTime: 2200,
    assistantText: "Starting the review with the login handler.",
  }))

  all.push(...timedToolPair({
    sessionId: SID, tool: 'Read',
    toolInput: { file_path: 'src/auth/register.ts' },
    toolResponse: { content: '// Registration handler...' },
    preTime: 3500, postTime: 4200,
    assistantText: "Reviewing the registration flow.",
  }))

  all.push(...timedToolPair({
    sessionId: SID, tool: 'Read',
    toolInput: { file_path: 'src/auth/middleware.ts' },
    toolResponse: { content: '// Auth middleware with JWT...' },
    preTime: 5500, postTime: 6200,
    assistantText: "Checking the auth middleware for token validation.",
  }))

  // --- Spawn 3 analysis sub-agents in quick succession ---

  all.push({ time: 8000, event: { type: 'pre_tool_use' as const, sessionId: SID, cwd: DEMO_CWD, tool: 'Task', toolInput: { description: 'Scan for security vulnerabilities', prompt: 'Scan src/auth/ and src/db/ for XSS (innerHTML, eval), SQL injection (template literals in queries), insecure cookies, and missing input validation', subagent_type: 'general-purpose' }, toolUseId: taskSecurityId, assistantText: "Spawning a security scanner to check for vulnerabilities." } })

  all.push({ time: 9500, event: { type: 'pre_tool_use' as const, sessionId: SID, cwd: DEMO_CWD, tool: 'Task', toolInput: { description: 'Check test coverage gaps', prompt: 'Analyze which auth functions have tests and which are missing. Check for edge cases: expired tokens, invalid passwords, rate limiting', subagent_type: 'general-purpose' }, toolUseId: taskCoverageId, assistantText: "Spawning a coverage checker to find untested code paths." } })

  all.push({ time: 11000, event: { type: 'pre_tool_use' as const, sessionId: SID, cwd: DEMO_CWD, tool: 'Task', toolInput: { description: 'Audit dependencies for vulnerabilities', prompt: 'Run npm audit on auth-related packages. Check jsonwebtoken, bcrypt, express-session for known CVEs and outdated versions', subagent_type: 'Bash' }, toolUseId: taskDepsId, assistantText: "Spawning a dependency auditor to check for known vulnerabilities." } })

  // --- Reviewer continues reading while sub-agents work ---

  all.push(...timedToolPair({
    sessionId: SID, tool: 'Read',
    toolInput: { file_path: 'src/auth/session.ts' },
    toolResponse: { content: '// Session management...' },
    preTime: 12500, postTime: 13200,
    assistantText: "Reviewing session handling while the sub-agents scan.",
  }))

  all.push(...timedToolPair({
    sessionId: SID, tool: 'Read',
    toolInput: { file_path: 'src/db/queries.ts' },
    toolResponse: { content: '// Database queries...' },
    preTime: 14500, postTime: 15200,
    assistantText: "Checking database queries for patterns.",
  }))

  all.push(...timedToolPair({
    sessionId: SID, tool: 'Grep',
    toolInput: { pattern: 'TODO|FIXME|HACK|XXX', path: 'src/auth/' },
    toolResponse: { matches: ['src/auth/login.ts:42: // TODO: add rate limiting', 'src/auth/session.ts:18: // FIXME: cookie not httpOnly'] },
    preTime: 16500, postTime: 17200,
    assistantText: "Scanning for TODO/FIXME comments left by the team.",
  }))

  // --- Sub-agents report back ---

  all.push({ time: 22000, event: { type: 'post_tool_use' as const, sessionId: SID, cwd: DEMO_CWD, tool: 'Task', toolInput: { description: 'Scan for security vulnerabilities' }, toolResponse: { result: 'Found 3 issues: SQL injection in db/queries.ts:23, XSS in auth/error-page.ts:15 (innerHTML), insecure cookies in session.ts (missing httpOnly/secure)' }, toolUseId: taskSecurityId, success: true, duration: 14000 } })

  all.push({ time: 24000, event: { type: 'post_tool_use' as const, sessionId: SID, cwd: DEMO_CWD, tool: 'Task', toolInput: { description: 'Check test coverage gaps' }, toolResponse: { result: 'Coverage gaps: no tests for token refresh, missing edge case for expired JWT, no rate-limit tests. 4 functions untested.' }, toolUseId: taskCoverageId, success: true, duration: 14500 } })

  all.push({ time: 26000, event: { type: 'post_tool_use' as const, sessionId: SID, cwd: DEMO_CWD, tool: 'Task', toolInput: { description: 'Audit dependencies for vulnerabilities' }, toolResponse: { result: 'npm audit: 1 moderate (jsonwebtoken <9.0.0 has algorithm confusion). bcrypt and express-session up to date.' }, toolUseId: taskDepsId, success: true, duration: 15000 } })

  // --- Fix phase: targeted edits based on sub-agent findings ---

  all.push(...timedToolPair({
    sessionId: SID, tool: 'Edit',
    toolInput: {
      file_path: 'src/db/queries.ts',
      old_string: 'db.query(`SELECT * FROM users WHERE id = ${userId}`)',
      new_string: 'db.query("SELECT * FROM users WHERE id = $1", [userId])',
    },
    preTime: 27500, postTime: 28000,
    assistantText: "Fixing SQL injection found by security scanner: parameterized query.",
  }))

  all.push(...timedToolPair({
    sessionId: SID, tool: 'Edit',
    toolInput: {
      file_path: 'src/auth/error-page.ts',
      old_string: 'el.innerHTML = errorMsg',
      new_string: 'el.textContent = errorMsg',
    },
    preTime: 29500, postTime: 30000,
    assistantText: "Fixing XSS: textContent instead of innerHTML.",
  }))

  all.push(...timedToolPair({
    sessionId: SID, tool: 'Edit',
    toolInput: {
      file_path: 'src/auth/session.ts',
      old_string: "cookie: { secure: false }",
      new_string: "cookie: { secure: true, httpOnly: true, sameSite: 'strict' }",
    },
    preTime: 31500, postTime: 32000,
    assistantText: "Hardening session cookies per security scanner findings.",
  }))

  all.push(...timedToolPair({
    sessionId: SID, tool: 'Bash',
    toolInput: { command: 'npm install jsonwebtoken@latest && npx vitest run src/auth/ src/db/' },
    toolResponse: { stdout: 'updated jsonwebtoken to 9.0.2\nPASS  src/auth/ (4 tests)\nPASS  src/db/ (5 tests)\n\nTests: 9 passed, 9 total' },
    preTime: 33500, postTime: 36500,
    assistantText: "Updating vulnerable jsonwebtoken and running tests to verify fixes.",
  }))

  all.push({
    time: 38000,
    event: { type: 'stop', sessionId: SID, cwd: DEMO_CWD, stopHookActive: false, response: "Comprehensive review complete!\n\nSecurity (via sub-agent): Fixed SQL injection, XSS, insecure cookies\nCoverage (via sub-agent): Identified 4 untested functions, missing edge cases\nDeps (via sub-agent): Updated jsonwebtoken to fix algorithm confusion CVE\n\n9 tests passing, 0 lint errors." },
  })

  // ========================================================================
  // SUB-AGENT 1: Security Scanner
  // ========================================================================

  all.push({ time: 8500, event: { type: 'user_prompt_submit', sessionId: SID_SECURITY, cwd: DEMO_CWD + '/src', prompt: 'Scan src/auth/ and src/db/ for XSS, SQL injection, insecure cookies, and missing input validation' }, spawnBeam: { from: SID, to: SID_SECURITY } })

  all.push(...timedToolPair({
    sessionId: SID_SECURITY, tool: 'Grep',
    toolInput: { pattern: 'innerHTML|dangerouslySetInnerHTML|eval\\(|document\\.write', path: 'src/' },
    toolResponse: { matches: ['src/auth/error-page.ts:15: el.innerHTML = errorMsg', 'src/utils/template.ts:8: document.write(html)'] },
    preTime: 10000, postTime: 11000,
    assistantText: "Scanning for XSS vulnerabilities (innerHTML, eval, document.write).",
  }))

  all.push(...timedToolPair({
    sessionId: SID_SECURITY, tool: 'Grep',
    toolInput: { pattern: 'query\\(.*\\$\\{|execute\\(.*\\+.*\\)', path: 'src/' },
    toolResponse: { matches: ['src/db/queries.ts:23: db.query(`SELECT * FROM users WHERE id = ${userId}`)'] },
    preTime: 12500, postTime: 13500,
    assistantText: "Found SQL injection! Template literal used directly in query.",
  }))

  all.push(...timedToolPair({
    sessionId: SID_SECURITY, tool: 'Read',
    toolInput: { file_path: 'src/auth/session.ts' },
    toolResponse: { content: '// Session config with cookie: { secure: false }...' },
    preTime: 15000, postTime: 15700,
    assistantText: "Checking session cookie security flags.",
  }))

  all.push(...timedToolPair({
    sessionId: SID_SECURITY, tool: 'Grep',
    toolInput: { pattern: 'password.*=.*req\\.|req\\.body\\.password(?!.*hash)', path: 'src/' },
    toolResponse: { matches: ['src/auth/login.ts:18: const password = req.body.password'] },
    preTime: 17500, postTime: 18200,
    assistantText: "Checking password handling patterns.",
  }))

  all.push(...timedToolPair({
    sessionId: SID_SECURITY, tool: 'Read',
    toolInput: { file_path: 'src/auth/login.ts' },
    toolResponse: { content: '// Login handler - password is hashed before compare, OK...' },
    preTime: 19500, postTime: 20200,
    assistantText: "Verifying password is properly hashed. It is - using bcrypt.compare.",
  }))

  all.push({ time: 21500, event: { type: 'stop', sessionId: SID_SECURITY, cwd: DEMO_CWD + '/src', stopHookActive: false, response: "Found 3 security issues:\n1. SQL injection in db/queries.ts:23 (template literal)\n2. XSS in auth/error-page.ts:15 (innerHTML)\n3. Insecure cookies in session.ts (missing httpOnly/secure)" }, deleteZone: SID_SECURITY })

  // ========================================================================
  // SUB-AGENT 2: Test Coverage
  // ========================================================================

  all.push({ time: 10000, event: { type: 'user_prompt_submit', sessionId: SID_COVERAGE, cwd: DEMO_CWD + '/tests', prompt: 'Analyze test coverage for auth functions. Find untested code paths and missing edge cases.' }, spawnBeam: { from: SID, to: SID_COVERAGE } })

  all.push(...timedToolPair({
    sessionId: SID_COVERAGE, tool: 'Glob',
    toolInput: { pattern: 'tests/auth/**/*.test.ts' },
    toolResponse: { matches: ['tests/auth/login.test.ts', 'tests/auth/register.test.ts'] },
    preTime: 11500, postTime: 12000,
    assistantText: "Finding existing auth test files.",
  }))

  all.push(...timedToolPair({
    sessionId: SID_COVERAGE, tool: 'Grep',
    toolInput: { pattern: 'export (async )?function', path: 'src/auth/' },
    toolResponse: { matches: ['src/auth/login.ts:10', 'src/auth/register.ts:8', 'src/auth/refresh.ts:5', 'src/auth/logout.ts:3', 'src/auth/session.ts:12', 'src/auth/validate.ts:7'] },
    preTime: 13500, postTime: 14200,
    assistantText: "Counting exported auth functions to compare against tests.",
  }))

  all.push(...timedToolPair({
    sessionId: SID_COVERAGE, tool: 'Read',
    toolInput: { file_path: 'tests/auth/login.test.ts' },
    toolResponse: { content: '// Tests for login - valid credentials, invalid password...' },
    preTime: 15500, postTime: 16200,
    assistantText: "Reading login tests to check edge case coverage.",
  }))

  all.push(...timedToolPair({
    sessionId: SID_COVERAGE, tool: 'Bash',
    toolInput: { command: 'npx vitest run --coverage tests/auth/' },
    toolResponse: { stdout: 'Coverage: 62% statements, 48% branches\nUncovered: refresh.ts (0%), validate.ts (0%), session.ts:checkExpiry (0%)' },
    preTime: 18000, postTime: 20500,
    assistantText: "Running coverage report to find gaps.",
  }))

  all.push(...timedToolPair({
    sessionId: SID_COVERAGE, tool: 'Grep',
    toolInput: { pattern: 'describe.*expired|describe.*rate.limit|describe.*refresh', path: 'tests/' },
    toolResponse: { matches: [] },
    preTime: 21500, postTime: 22000,
    assistantText: "No tests for token expiry, rate limiting, or refresh. Major gaps.",
  }))

  all.push({ time: 23500, event: { type: 'stop', sessionId: SID_COVERAGE, cwd: DEMO_CWD + '/tests', stopHookActive: false, response: "Coverage: 62% statements, 48% branches.\nGaps: refresh.ts untested, validate.ts untested, no expired JWT tests, no rate-limit tests. 4 functions with 0% coverage." }, deleteZone: SID_COVERAGE })

  // ========================================================================
  // SUB-AGENT 3: Dependency Auditor
  // ========================================================================

  all.push({ time: 11500, event: { type: 'user_prompt_submit', sessionId: SID_DEPS, cwd: DEMO_CWD, prompt: 'Run npm audit on auth packages. Check jsonwebtoken, bcrypt, express-session for CVEs.' }, spawnBeam: { from: SID, to: SID_DEPS } })

  all.push(...timedToolPair({
    sessionId: SID_DEPS, tool: 'Read',
    toolInput: { file_path: 'package.json' },
    toolResponse: { content: '{ "dependencies": { "jsonwebtoken": "^8.5.1", "bcrypt": "^5.1.0", "express-session": "^1.17.3" } }' },
    preTime: 13000, postTime: 13700,
    assistantText: "Checking current package versions.",
  }))

  all.push(...timedToolPair({
    sessionId: SID_DEPS, tool: 'Bash',
    toolInput: { command: 'npm audit --json 2>/dev/null | jq \'.vulnerabilities | to_entries[] | select(.value.severity != "info")\'' },
    toolResponse: { stdout: '{"key":"jsonwebtoken","value":{"severity":"moderate","via":[{"title":"Algorithm confusion"}],"range":"<9.0.0"}}' },
    preTime: 15000, postTime: 17500,
    assistantText: "Running npm audit to check for known vulnerabilities.",
  }))

  all.push(...timedToolPair({
    sessionId: SID_DEPS, tool: 'WebSearch',
    toolInput: { query: 'jsonwebtoken CVE-2022-23529 algorithm confusion vulnerability' },
    toolResponse: { results: [{ title: 'CVE-2022-23529: jsonwebtoken Algorithm Confusion' }] },
    preTime: 19000, postTime: 20500,
    assistantText: "Researching the jsonwebtoken vulnerability details.",
  }))

  all.push(...timedToolPair({
    sessionId: SID_DEPS, tool: 'Bash',
    toolInput: { command: 'npm view jsonwebtoken versions --json | jq .[-3:]' },
    toolResponse: { stdout: '["9.0.0", "9.0.1", "9.0.2"]' },
    preTime: 22000, postTime: 23000,
    assistantText: "Checking latest available versions.",
  }))

  all.push({ time: 25500, event: { type: 'stop', sessionId: SID_DEPS, cwd: DEMO_CWD, stopHookActive: false, response: "Audit: 1 moderate vulnerability.\njsonwebtoken <9.0.0 has algorithm confusion (CVE-2022-23529). Fix: upgrade to 9.0.2.\nbcrypt 5.1.0 - clean. express-session 1.17.3 - clean." }, deleteZone: SID_DEPS })

  return {
    sessionId: SID,
    managedId: MID,
    name: 'Code Review',
    cyclePause: 5000 / SPEED,
    initialDelay: 0,
    steps: toSteps(all),
  }
}

// ============================================================================
// Public API
// ============================================================================

export function createCodeReviewBundle(): DemoScenarioBundle {
  return {
    scenarios: [createReviewScenario()],
    managedSessions: createManagedSessions(),
    sessionIds: SESSION_IDS,
    managedIds: MANAGED_IDS,
  }
}
