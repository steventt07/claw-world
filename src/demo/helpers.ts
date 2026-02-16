/**
 * Demo Mode - Shared Helpers
 *
 * Constants, counter state, and utility functions used by all scenario files.
 */

import type { DemoEvent, DemoStep } from './types'

// ============================================================================
// Constants
// ============================================================================

/** Speed multiplier — all absolute times are divided by this */
export const SPEED = 1

export const DEMO_CWD = '/home/user/project'

// ============================================================================
// Tool-use counter (shared across scenarios within a single creation call)
// ============================================================================

let _toolUseCounter = 0

export function resetToolUseCounter(): void {
  _toolUseCounter = 0
}

export function nextToolUseId(): string {
  return `demo-tool-${++_toolUseCounter}`
}

// ============================================================================
// TimedEvent helpers
// ============================================================================

/** An event placed at an absolute time (ms) in the scenario timeline */
export interface TimedEvent {
  time: number
  event: DemoEvent
  /** Optional: delete this zone after the event fires */
  deleteZone?: string
  /** Optional: launch a spawn beam arc from one session's portal to another session's zone */
  spawnBeam?: { from: string; to: string }
  /** Optional: mark a phase transition at this event */
  phase?: { name: string; description: string }
  /** Optional: show narration text at this event */
  narration?: { text: string; duration?: number }
  /** Optional: force camera focus to a session's zone */
  focusZone?: string
}

/** Convert absolute-time events to relative-delay steps (sorted chronologically) */
export function toSteps(events: TimedEvent[]): DemoStep[] {
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
      ...(e.phase ? { phase: e.phase } : {}),
      ...(e.narration ? { narration: e.narration } : {}),
      ...(e.focusZone ? { focusZone: e.focusZone } : {}),
    }
  })
}

// ============================================================================
// Duration & Phase Computation
// ============================================================================

/** Compute total duration of a set of steps (sum of all delays) */
export function computeScenarioDuration(steps: DemoStep[]): number {
  return steps.reduce((sum, s) => sum + s.delay, 0)
}

/** Derive phase segments with percentage positions from steps that have phase markers */
export function computePhaseSegments(steps: DemoStep[]): Array<{ name: string; startPercent: number; endPercent: number }> {
  const totalDuration = computeScenarioDuration(steps)
  if (totalDuration === 0) return []

  const segments: Array<{ name: string; startPercent: number; endPercent: number }> = []
  let elapsed = 0

  for (const step of steps) {
    if (step.phase) {
      // Close previous segment
      if (segments.length > 0) {
        segments[segments.length - 1].endPercent = elapsed / totalDuration
      }
      segments.push({
        name: step.phase.name,
        startPercent: elapsed / totalDuration,
        endPercent: 1, // Will be overwritten by next phase or end
      })
    }
    elapsed += step.delay
  }

  return segments
}

/** Create a pre/post tool pair as two TimedEvents at absolute times */
export function timedToolPair(opts: {
  sessionId: string
  tool: string
  toolInput: Record<string, unknown>
  toolResponse?: Record<string, unknown>
  success?: boolean
  preTime: number
  postTime: number
  assistantText?: string
}): [TimedEvent, TimedEvent] {
  const toolUseId = nextToolUseId()
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
