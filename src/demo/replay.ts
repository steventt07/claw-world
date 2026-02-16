/**
 * Replay Mode — Convert real session history into DemoScenarioBundle format
 *
 * Fetches events from the server's /replay endpoints and converts them into
 * the same DemoScenarioBundle format used by the synthetic demo system.
 */

import type { ClaudeEvent, ManagedSession, ReplaySessionSummary } from '../../shared/types'
import type { DemoStep, DemoScenarioBundle } from './types'

// ============================================================================
// Types
// ============================================================================

export type ReplaySpeed = 1 | 2 | 4 | 8 | 16

// ============================================================================
// API Functions
// ============================================================================

/** Fetch the list of past sessions available for replay */
export async function fetchReplaySessions(apiUrl: string): Promise<ReplaySessionSummary[]> {
  const res = await fetch(`${apiUrl}/replay/sessions`)
  if (!res.ok) throw new Error(`Failed to fetch replay sessions: ${res.status}`)
  const data = await res.json()
  return data.sessions ?? []
}

/** Fetch all events for a specific session */
async function fetchSessionEvents(apiUrl: string, sessionId: string): Promise<ClaudeEvent[]> {
  const res = await fetch(`${apiUrl}/replay/sessions/${encodeURIComponent(sessionId)}/events`)
  if (!res.ok) throw new Error(`Failed to fetch session events: ${res.status}`)
  const data = await res.json()
  return data.events ?? []
}

// ============================================================================
// Bundle Creation
// ============================================================================

/** Max real-time gap between events before capping (in ms) — prevents long pauses */
const MAX_GAP_MS = 20_000

/**
 * Create a DemoScenarioBundle from real session events.
 *
 * Converts server events into DemoStep[] with timing derived from real timestamps,
 * scaled by the given speed factor and capped to avoid long pauses.
 */
export async function createReplayBundle(
  apiUrl: string,
  sessionId: string,
  sessionName: string,
  options?: { speed?: ReplaySpeed },
): Promise<DemoScenarioBundle> {
  const speed = options?.speed ?? 4
  const events = await fetchSessionEvents(apiUrl, sessionId)

  if (events.length === 0) {
    throw new Error('No events found for this session')
  }

  // Rewrite sessionId with replay- prefix to avoid collision with live sessions
  const replaySessionId = `replay-${sessionId}`
  const replayManagedId = `replay-managed-${sessionId}`

  // Convert events to DemoSteps with timing
  const steps: DemoStep[] = []
  for (let i = 0; i < events.length; i++) {
    const event = events[i]

    // Calculate delay from previous event
    let delay = 0
    if (i > 0) {
      const gap = event.timestamp - events[i - 1].timestamp
      // Cap the gap, then scale by speed
      delay = Math.min(gap, MAX_GAP_MS) / speed
    }

    // Rewrite sessionId in the event and strip id/timestamp (stamped at playback)
    const { id: _id, timestamp: _ts, ...rest } = event as any
    const demoEvent = {
      ...rest,
      sessionId: replaySessionId,
    }

    steps.push({ delay, event: demoEvent })
  }

  // Create synthetic ManagedSession
  const managedSession: ManagedSession = {
    id: replayManagedId,
    name: `[Replay] ${sessionName}`,
    tmuxSession: 'replay',
    status: 'idle',
    createdAt: Date.now(),
    lastActivity: Date.now(),
    cwd: events[0]?.cwd,
  }

  return {
    scenarios: [
      {
        sessionId: replaySessionId,
        managedId: replayManagedId,
        name: sessionName,
        cyclePause: Infinity, // Don't loop
        initialDelay: 0,
        steps,
      },
    ],
    managedSessions: [managedSession],
    sessionIds: [replaySessionId] as const,
    managedIds: [replayManagedId] as const,
  }
}
