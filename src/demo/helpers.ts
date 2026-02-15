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
export const SPEED = 2

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
    }
  })
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
