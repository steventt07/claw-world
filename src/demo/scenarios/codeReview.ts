/**
 * Code Review Scenario
 *
 * Single session methodically reading many files, grepping for issues,
 * making targeted fixes, running lint+tests. 1 zone, shows careful review workflow.
 *
 * Timeline (~22s cycle at 2x):
 *   Read phase (0-10s):   5x Read in sequence (bookshelf heavy)
 *   Search phase (10-16s): 3x Grep for security patterns (scanner heavy)
 *   Fix phase (16-22s):   3x Edit targeted fixes → Bash lint → Bash test → stop
 */

import type { ManagedSession } from '../../../shared/types'
import type { DemoScenarioBundle } from '../types'
import { SPEED, DEMO_CWD, timedToolPair, toSteps, type TimedEvent } from '../helpers'

// ============================================================================
// Session / Managed IDs
// ============================================================================

const SID = 'demo-review-session-0001'
const MID = 'demo-managed-review-0001'

const SESSION_IDS = [SID] as const
const MANAGED_IDS = [MID] as const

// ============================================================================
// Managed Sessions
// ============================================================================

function createManagedSessions(): ManagedSession[] {
  const now = Date.now()
  return [
    { id: MID, name: 'Code Review', tmuxSession: 'demo-review', status: 'idle', claudeSessionId: SID, createdAt: now, lastActivity: now, cwd: DEMO_CWD },
  ]
}

// ============================================================================
// Scenario
// ============================================================================

function createReviewScenario() {
  const all: TimedEvent[] = []

  all.push({
    time: 0,
    event: { type: 'user_prompt_submit', sessionId: SID, cwd: DEMO_CWD, prompt: 'Review the authentication module for security issues. Check for SQL injection, XSS, and missing input validation.' },
  })

  // --- Read Phase: systematic file reading ---

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

  all.push(...timedToolPair({
    sessionId: SID, tool: 'Read',
    toolInput: { file_path: 'src/auth/session.ts' },
    toolResponse: { content: '// Session management...' },
    preTime: 7500, postTime: 8200,
    assistantText: "Reviewing session handling and cookie security.",
  }))

  all.push(...timedToolPair({
    sessionId: SID, tool: 'Read',
    toolInput: { file_path: 'src/db/queries.ts' },
    toolResponse: { content: '// Database queries...' },
    preTime: 9500, postTime: 10200,
    assistantText: "Checking database queries for SQL injection risks.",
  }))

  // --- Search Phase: scanning for security patterns ---

  all.push(...timedToolPair({
    sessionId: SID, tool: 'Grep',
    toolInput: { pattern: 'innerHTML|dangerouslySetInnerHTML|eval\\(|document\\.write', path: 'src/' },
    toolResponse: { matches: ['src/auth/error-page.ts:15: el.innerHTML = errorMsg', 'src/utils/template.ts:8: document.write(html)'] },
    preTime: 12000, postTime: 13000,
    assistantText: "Scanning for XSS vulnerabilities (innerHTML, eval, document.write).",
  }))

  all.push(...timedToolPair({
    sessionId: SID, tool: 'Grep',
    toolInput: { pattern: 'query\\(.*\\$\\{|execute\\(.*\\+.*\\)', path: 'src/' },
    toolResponse: { matches: ['src/db/queries.ts:23: db.query(`SELECT * FROM users WHERE id = ${userId}`)'] },
    preTime: 14500, postTime: 15500,
    assistantText: "Found a potential SQL injection! Template literal in query without parameterization.",
  }))

  all.push(...timedToolPair({
    sessionId: SID, tool: 'Grep',
    toolInput: { pattern: 'password.*=.*req\\.|req\\.body\\.password(?!.*hash)', path: 'src/' },
    toolResponse: { matches: ['src/auth/login.ts:18: const password = req.body.password'] },
    preTime: 17000, postTime: 18000,
    assistantText: "Checking password handling patterns.",
  }))

  // --- Fix Phase: targeted edits ---

  all.push(...timedToolPair({
    sessionId: SID, tool: 'Edit',
    toolInput: {
      file_path: 'src/db/queries.ts',
      old_string: 'db.query(`SELECT * FROM users WHERE id = ${userId}`)',
      new_string: 'db.query("SELECT * FROM users WHERE id = $1", [userId])',
    },
    preTime: 20000, postTime: 20500,
    assistantText: "Fixing SQL injection: using parameterized query instead of template literal.",
  }))

  all.push(...timedToolPair({
    sessionId: SID, tool: 'Edit',
    toolInput: {
      file_path: 'src/auth/error-page.ts',
      old_string: 'el.innerHTML = errorMsg',
      new_string: 'el.textContent = errorMsg',
    },
    preTime: 22000, postTime: 22500,
    assistantText: "Fixing XSS: using textContent instead of innerHTML for error messages.",
  }))

  all.push(...timedToolPair({
    sessionId: SID, tool: 'Edit',
    toolInput: {
      file_path: 'src/auth/session.ts',
      old_string: "cookie: { secure: false }",
      new_string: "cookie: { secure: true, httpOnly: true, sameSite: 'strict' }",
    },
    preTime: 24000, postTime: 24500,
    assistantText: "Hardening session cookies: enabling secure, httpOnly, and sameSite.",
  }))

  // Lint
  all.push(...timedToolPair({
    sessionId: SID, tool: 'Bash',
    toolInput: { command: 'npx eslint src/auth/ src/db/ --fix' },
    toolResponse: { stdout: '3 problems fixed.\n0 errors remaining.' },
    preTime: 26000, postTime: 28000,
    assistantText: "Running linter on the modified files.",
  }))

  // Tests
  all.push(...timedToolPair({
    sessionId: SID, tool: 'Bash',
    toolInput: { command: 'npx vitest run src/auth/ src/db/' },
    toolResponse: { stdout: 'PASS  src/auth/login.test.ts (4 tests)\nPASS  src/auth/register.test.ts (3 tests)\nPASS  src/db/queries.test.ts (5 tests)\n\nTests: 12 passed, 12 total' },
    preTime: 30000, postTime: 33000,
    assistantText: "Running the test suite to verify fixes don't break anything.",
  }))

  all.push({
    time: 35000,
    event: { type: 'stop', sessionId: SID, cwd: DEMO_CWD, stopHookActive: false, response: "Security review complete! Fixed 3 issues:\n1. SQL injection in db/queries.ts (parameterized query)\n2. XSS in auth/error-page.ts (textContent vs innerHTML)\n3. Insecure cookies in auth/session.ts (secure + httpOnly + sameSite)\n\nAll 12 tests passing, 0 lint errors." },
  })

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
