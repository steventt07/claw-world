/**
 * Demo Scenarios Registry
 *
 * Maps scenario types to their factory functions and metadata.
 */

import type { DemoScenarioType, DemoScenarioBundle } from '../types'
import { resetToolUseCounter } from '../helpers'
import { createAgentSwarmBundle } from './agentSwarm'
import { createPairProgrammingBundle } from './pairProgramming'
import { createResearchSprintBundle } from './researchSprint'
import { createCodeReviewBundle } from './codeReview'

// ============================================================================
// Scenario Metadata (used by the picker UI)
// ============================================================================

export interface ScenarioMeta {
  label: string
  description: string
  icon: string
}

export const SCENARIO_META: Record<DemoScenarioType, ScenarioMeta> = {
  swarm: {
    label: 'Agent Swarm',
    description: '3 orchestrators spawn 7 sub-agents in parallel',
    icon: '\u{1F41D}', // bee
  },
  pair: {
    label: 'Pair Programming',
    description: 'Alice + Bob each delegate side-tasks to sub-agents',
    icon: '\u{1F46F}', // people with bunny ears
  },
  research: {
    label: 'Research Sprint',
    description: '2 sub-agents research in parallel, then build',
    icon: '\u{1F50D}', // magnifying glass
  },
  review: {
    label: 'Code Review',
    description: '3 sub-agents scan security, coverage, and deps',
    icon: '\u{1F50E}', // magnifying glass tilted right
  },
}

// ============================================================================
// Factory
// ============================================================================

/** Create a complete scenario bundle for the given type */
export function createScenarioBundle(type: DemoScenarioType): DemoScenarioBundle {
  // Reset tool-use counter each time a bundle is created
  resetToolUseCounter()

  switch (type) {
    case 'swarm':
      return createAgentSwarmBundle()
    case 'pair':
      return createPairProgrammingBundle()
    case 'research':
      return createResearchSprintBundle()
    case 'review':
      return createCodeReviewBundle()
  }
}
