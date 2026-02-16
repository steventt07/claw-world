/**
 * Demo Mode Engine
 *
 * Orchestrates demo playback by feeding synthetic events through
 * the existing handleEvent() pipeline. All systems (EventBus handlers,
 * character movement, sounds, feed, timeline, notifications) work
 * identically to live mode.
 */

import type { ClaudeEvent, ManagedSession } from '../../shared/types'
import type { DemoScenario, DemoScenarioBundle, DemoScenarioType, DemoEducation } from './types'
import { createScenarioBundle } from './scenarios'
import { computeScenarioDuration, computePhaseSegments } from './helpers'

// ============================================================================
// Types
// ============================================================================

export interface DemoModeConfig {
  handleEvent: (event: ClaudeEvent) => void
  setManagedSessions: (sessions: ManagedSession[]) => void
  setClaudeToManagedLinks: (links: Map<string, string>) => void
  hideOverlay: () => void
  /** Delete a zone and its session state (for sub-agent cleanup) */
  deleteZone?: (sessionId: string) => void
  /** Launch a spawn beam arc from one session's portal to another session's zone */
  spawnBeam?: (from: string, to: string) => void
  /** Enable follow-active camera mode for multi-zone demos */
  enableFollowActive?: () => void
  /** Force camera focus to a specific session's zone */
  focusZone?: (sessionId: string) => void
  /** Update the phase banner with current phase */
  updatePhase?: (name: string, description: string) => void
  /** Show a narration toast */
  showNarration?: (text: string, duration?: number) => void
  /** Report playback progress (0-1) and current phase name */
  onProgress?: (percent: number, phaseName: string) => void
  /** Show intro card before scenario starts */
  showIntroCard?: (intro: DemoEducation['intro']) => Promise<void>
  /** Show summary card at cycle end */
  showSummaryCard?: (summary: DemoEducation['summary']) => void
}

export interface DemoModeOptions {
  explicit?: boolean
  scenarioType?: DemoScenarioType
  /** Pre-built bundle (for replay mode) — skips createScenarioBundle() */
  bundle?: DemoScenarioBundle
  /** Callback when all steps finish (for non-looping bundles) */
  onComplete?: () => void
  /** Skip the intro card (e.g. when switching scenarios) */
  skipIntro?: boolean
}

// ============================================================================
// State
// ============================================================================

let _isDemoMode = false
let _isExplicitDemo = false  // Started via ?demo=true URL param (don't auto-stop)
let _isReplayMode = false    // Started with a pre-built bundle (replay)
let _timers: ReturnType<typeof setTimeout>[] = []
let _onComplete: (() => void) | null = null

// ============================================================================
// Public API
// ============================================================================

/** Check if demo mode is currently active */
export function isDemoMode(): boolean {
  return _isDemoMode
}

/** Check if demo was explicitly requested (e.g. ?demo=true) and shouldn't auto-stop */
export function isExplicitDemo(): boolean {
  return _isExplicitDemo
}

/** Check if replay mode is active (demo mode with a pre-built bundle) */
export function isReplayMode(): boolean {
  return _isReplayMode
}

/** Start demo mode — injects fake sessions and begins event playback */
export function startDemoMode(
  config: DemoModeConfig,
  options?: DemoModeOptions,
): void {
  if (_isDemoMode) return

  _isDemoMode = true
  _isExplicitDemo = options?.explicit ?? false
  _isReplayMode = !!options?.bundle
  _timers = []
  _onComplete = options?.onComplete ?? null

  // Hide any connection overlay
  config.hideOverlay()

  // Use provided bundle or create one from scenario type
  const bundle = options?.bundle ?? createScenarioBundle(options?.scenarioType ?? 'swarm')

  // Inject fake managed sessions
  config.setManagedSessions(bundle.managedSessions)

  // Pre-populate claude-to-managed links
  const links = new Map<string, string>()
  for (let i = 0; i < bundle.sessionIds.length; i++) {
    links.set(bundle.sessionIds[i], bundle.managedIds[i])
  }
  config.setClaudeToManagedLinks(links)

  // Add CSS class for DEMO badge
  document.body.classList.add('demo-mode')

  // Enable follow-active camera for multi-zone demos
  config.enableFollowActive?.()

  // Pre-compute duration and phase segments for each scenario
  for (const scenario of bundle.scenarios) {
    scenario.totalDuration = computeScenarioDuration(scenario.steps)
    scenario.phases = computePhaseSegments(scenario.steps)
  }

  // Determine intro delay (show intro card before scenarios start)
  const showIntro = !options?.skipIntro && bundle.education?.intro
  const introDelay = showIntro ? 2000 : 0

  // Show intro card if available
  if (showIntro && config.showIntroCard) {
    config.showIntroCard(bundle.education!.intro)
  }

  // Initialize progress bar phase segments from the first scenario with phases
  const primaryScenario = bundle.scenarios.find(s => s.phases && s.phases.length > 0) ?? bundle.scenarios[0]
  if (primaryScenario?.phases && config.onProgress) {
    config.onProgress(0, primaryScenario.phases[0]?.name ?? '')
  }

  // Start each scenario with staggered timing (+ intro delay)
  for (const scenario of bundle.scenarios) {
    const timer = setTimeout(() => {
      runScenario(scenario, config, bundle)
    }, scenario.initialDelay + introDelay)
    _timers.push(timer)
  }

  const label = options?.bundle ? 'replay bundle' : `type: ${options?.scenarioType ?? 'swarm'}`
  console.log('[Demo] Started demo mode with', bundle.scenarios.length, 'scenarios (' + label + ')')
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

  // Hide phase banner and progress bar
  document.getElementById('demo-phase')?.classList.remove('visible')
  document.getElementById('demo-progress')?.classList.remove('visible')

  _isDemoMode = false
  _isExplicitDemo = false
  _isReplayMode = false
  _onComplete = null
  console.log('[Demo] Stopped demo mode')
}

// ============================================================================
// Playback Engine
// ============================================================================

/** Run a single scenario's cycles in a loop */
function runScenario(scenario: DemoScenario, config: DemoModeConfig, bundle?: DemoScenarioBundle): void {
  if (!_isDemoMode) return

  let cumulativeDelay = 0
  let currentPhaseName = ''
  // Track cumulative step delay for progress (not jittered)
  let nominalElapsed = 0

  for (let i = 0; i < scenario.steps.length; i++) {
    const step = scenario.steps[i]

    // Add jitter: ±20% of the step delay
    const jitter = step.delay * (0.8 + Math.random() * 0.4)
    cumulativeDelay += jitter
    nominalElapsed += step.delay

    // Capture nominal elapsed for progress callback
    const stepElapsed = nominalElapsed

    const timer = setTimeout(() => {
      if (!_isDemoMode) return

      // Process phase transition
      if (step.phase) {
        currentPhaseName = step.phase.name
        config.updatePhase?.(step.phase.name, step.phase.description)
      }

      // Process narration
      if (step.narration) {
        config.showNarration?.(step.narration.text, step.narration.duration)
      }

      // Process camera focus
      if (step.focusZone) {
        config.focusZone?.(step.focusZone)
      }

      // Report progress (only for the first scenario in the bundle to avoid conflicts)
      const isPrimary = !bundle || bundle.scenarios[0] === scenario
      if (isPrimary && scenario.totalDuration && scenario.totalDuration > 0) {
        const percent = Math.min(1, stepElapsed / scenario.totalDuration)
        config.onProgress?.(percent, currentPhaseName)
      }

      // Stamp event with unique id and current timestamp
      const event = {
        ...step.event,
        id: `demo-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        timestamp: Date.now(),
      } as ClaudeEvent

      config.handleEvent(event)

      // Launch spawn beam after a short delay (zone needs to exist first)
      if (step.spawnBeam && config.spawnBeam) {
        const { from, to } = step.spawnBeam
        const beamTimer = setTimeout(() => {
          if (!_isDemoMode) return
          config.spawnBeam!(from, to)
        }, 200)
        _timers.push(beamTimer)
      }

      // Delete zone after event fires (sub-agent cleanup)
      if (step.deleteZone && config.deleteZone) {
        // Small delay so the stop event renders before zone exits
        const cleanupTimer = setTimeout(() => {
          if (!_isDemoMode) return
          config.deleteZone!(step.deleteZone!)
        }, 500)
        _timers.push(cleanupTimer)
      }
    }, cumulativeDelay)

    _timers.push(timer)
  }

  // Non-looping mode: if cyclePause is Infinity (or very large), fire onComplete instead
  if (!isFinite(scenario.cyclePause)) {
    const completeTimer = setTimeout(() => {
      if (!_isDemoMode) return
      if (_onComplete) _onComplete()
    }, cumulativeDelay + 500) // small buffer after last step
    _timers.push(completeTimer)
    return
  }

  // At cycle end, show summary card if available (only for first scenario in the bundle)
  const nextCycleDelay = cumulativeDelay + scenario.cyclePause
  const isFirstScenario = bundle?.scenarios?.[0] === scenario
  if (isFirstScenario && bundle?.education?.summary && config.showSummaryCard) {
    const summaryTimer = setTimeout(() => {
      if (!_isDemoMode) return
      config.showSummaryCard!(bundle.education!.summary)
    }, cumulativeDelay + 500)
    _timers.push(summaryTimer)
  }

  // After all steps complete, schedule the next cycle
  const timer = setTimeout(() => {
    if (!_isDemoMode) return
    runScenario(scenario, config, bundle)
  }, nextCycleDelay)
  _timers.push(timer)
}
