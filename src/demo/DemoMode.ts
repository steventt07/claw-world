/**
 * Demo Mode Engine
 *
 * Orchestrates demo playback by feeding synthetic events through
 * the existing handleEvent() pipeline. All systems (EventBus handlers,
 * character movement, sounds, feed, timeline, notifications) work
 * identically to live mode.
 */

import type { ClaudeEvent, ManagedSession } from '../../shared/types'
import {
  createDemoManagedSessions,
  createDemoScenarios,
  DEMO_SESSION_IDS,
  DEMO_MANAGED_IDS,
  type DemoScenario,
} from './scenarios'

// ============================================================================
// Types
// ============================================================================

export interface DemoModeConfig {
  handleEvent: (event: ClaudeEvent) => void
  setManagedSessions: (sessions: ManagedSession[]) => void
  setClaudeToManagedLinks: (links: Map<string, string>) => void
  hideOverlay: () => void
}

// ============================================================================
// State
// ============================================================================

let _isDemoMode = false
let _timers: ReturnType<typeof setTimeout>[] = []

// ============================================================================
// Public API
// ============================================================================

/** Check if demo mode is currently active */
export function isDemoMode(): boolean {
  return _isDemoMode
}

/** Start demo mode — injects fake sessions and begins event playback */
export function startDemoMode(config: DemoModeConfig): void {
  if (_isDemoMode) return

  _isDemoMode = true
  _timers = []

  // Hide any connection overlay
  config.hideOverlay()

  // Create and inject fake managed sessions
  const sessions = createDemoManagedSessions()
  config.setManagedSessions(sessions)

  // Pre-populate claude-to-managed links
  const links = new Map<string, string>()
  for (let i = 0; i < DEMO_SESSION_IDS.length; i++) {
    links.set(DEMO_SESSION_IDS[i], DEMO_MANAGED_IDS[i])
  }
  config.setClaudeToManagedLinks(links)

  // Add CSS class for DEMO badge
  document.body.classList.add('demo-mode')

  // Start each scenario with staggered timing
  const scenarios = createDemoScenarios()
  for (const scenario of scenarios) {
    const timer = setTimeout(() => {
      runScenario(scenario, config)
    }, scenario.initialDelay)
    _timers.push(timer)
  }

  console.log('[Demo] Started demo mode with', scenarios.length, 'scenarios')
}

/** Stop demo mode — clears all timers and resets state */
export function stopDemoMode(): void {
  if (!_isDemoMode) return

  // Clear all scheduled timers
  for (const timer of _timers) {
    clearTimeout(timer)
  }
  _timers = []

  // Remove CSS class
  document.body.classList.remove('demo-mode')

  _isDemoMode = false
  console.log('[Demo] Stopped demo mode')
}

// ============================================================================
// Playback Engine
// ============================================================================

/** Run a single scenario's cycles in a loop */
function runScenario(scenario: DemoScenario, config: DemoModeConfig): void {
  if (!_isDemoMode) return

  let cumulativeDelay = 0

  for (let i = 0; i < scenario.steps.length; i++) {
    const step = scenario.steps[i]

    // Add jitter: ±20% of the step delay
    const jitter = step.delay * (0.8 + Math.random() * 0.4)
    cumulativeDelay += jitter

    const timer = setTimeout(() => {
      if (!_isDemoMode) return

      // Stamp event with unique id and current timestamp
      const event = {
        ...step.event,
        id: `demo-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        timestamp: Date.now(),
      } as ClaudeEvent

      config.handleEvent(event)
    }, cumulativeDelay)

    _timers.push(timer)
  }

  // After all steps complete, schedule the next cycle
  const nextCycleDelay = cumulativeDelay + scenario.cyclePause
  const timer = setTimeout(() => {
    if (!_isDemoMode) return
    runScenario(scenario, config)
  }, nextCycleDelay)
  _timers.push(timer)
}
