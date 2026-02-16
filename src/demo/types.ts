/**
 * Demo Mode - Shared Types
 */

import type { ClaudeEvent, ManagedSession } from '../../shared/types'

/** Distributive Omit that preserves discriminated union members */
type DistributiveOmit<T, K extends keyof any> = T extends any ? Omit<T, K> : never

/** A ClaudeEvent minus its id and timestamp (stamped at playback time) */
export type DemoEvent = DistributiveOmit<ClaudeEvent, 'id' | 'timestamp'>

/** A single step in a demo scenario — the event plus its delay from the previous step */
export interface DemoStep {
  delay: number
  event: DemoEvent
  /** Optional: delete this zone after the event fires (for sub-agent cleanup) */
  deleteZone?: string
  /** Optional: launch a spawn beam arc from one session's portal to another session's zone */
  spawnBeam?: { from: string; to: string }
  /** Optional: mark a phase transition at this step */
  phase?: { name: string; description: string }
  /** Optional: show narration text at this step */
  narration?: { text: string; duration?: number }
  /** Optional: force camera focus to this session's zone */
  focusZone?: string
}

/** A full demo scenario with metadata and repeating cycles */
export interface DemoScenario {
  sessionId: string
  managedId: string
  name: string
  /** Pause (ms) between cycle loops */
  cyclePause: number
  /** Initial delay before first cycle starts */
  initialDelay: number
  /** Steps for one complete work cycle */
  steps: DemoStep[]
  /** Total duration of all steps (ms), computed from delays */
  totalDuration?: number
  /** Phase segments with percentage positions, computed from steps */
  phases?: Array<{ name: string; startPercent: number; endPercent: number }>
}

/** Available demo scenario types */
export type DemoScenarioType = 'swarm' | 'pair' | 'research' | 'review'

/** Educational metadata for demo intro/summary cards */
export interface DemoEducation {
  intro: {
    title: string
    description: string
    watchFor: string[]
    agentCount: { orchestrators: number; subagents: number }
  }
  summary: {
    achievements: string[]
    parallelTimeSaved?: string
  }
}

/** A complete bundle of everything DemoMode needs to run a scenario type */
export interface DemoScenarioBundle {
  scenarios: DemoScenario[]
  managedSessions: ManagedSession[]
  sessionIds: readonly string[]
  managedIds: readonly string[]
  /** Educational content for intro/summary cards */
  education?: DemoEducation
}
