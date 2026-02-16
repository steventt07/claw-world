/**
 * Generic Adapter
 *
 * Pass-through adapter for events already in the universal AgentEvent format.
 * Validates the event structure and returns it as-is.
 */

import type { EventAdapter } from './base-adapter.js'
import type { ToolCategory, UniversalEvent, AgentEventType } from '../agent-protocol.js'

const VALID_EVENT_TYPES: AgentEventType[] = [
  'tool_start', 'tool_end', 'agent_idle', 'agent_thinking',
  'user_input', 'agent_start', 'agent_end', 'notification',
  'subagent_spawn', 'subagent_end',
]

const VALID_CATEGORIES: ToolCategory[] = [
  'read', 'write', 'edit', 'execute', 'search',
  'network', 'delegate', 'plan', 'interact', 'other',
]

export class GenericAdapter implements EventAdapter {
  readonly name = 'generic'

  /**
   * Detect universal-format events by checking for AgentEvent fields.
   * Universal events have `agentId` and `source` fields with a valid `type`.
   */
  canHandle(raw: Record<string, unknown>): boolean {
    return (
      typeof raw.agentId === 'string' &&
      typeof raw.source === 'string' &&
      typeof raw.type === 'string' &&
      VALID_EVENT_TYPES.includes(raw.type as AgentEventType)
    )
  }

  /**
   * Default categorization: just return 'other'.
   * Generic events should already have category set in their tool info.
   */
  categorize(_toolName: string): ToolCategory {
    return 'other'
  }

  /**
   * Pass through events already in universal format.
   * Validates required fields and fills defaults.
   */
  normalize(raw: Record<string, unknown>): UniversalEvent | null {
    const type = raw.type as AgentEventType
    if (!VALID_EVENT_TYPES.includes(type)) return null

    // Ensure required base fields
    const event: UniversalEvent = {
      id: (raw.id as string) || crypto.randomUUID(),
      timestamp: (raw.timestamp as number) || Date.now(),
      type,
      agentId: raw.agentId as string,
      source: raw.source as string,
      cwd: raw.cwd as string | undefined,
      metadata: raw.metadata as Record<string, unknown> | undefined,
    } as UniversalEvent

    // Validate tool events have required tool info
    if (type === 'tool_start' || type === 'tool_end') {
      const tool = raw.tool as Record<string, unknown> | undefined
      if (!tool || typeof tool.name !== 'string') return null

      // Validate and default category
      const category = (tool.category as string) || 'other'
      if (!VALID_CATEGORIES.includes(category as ToolCategory)) {
        (tool as Record<string, unknown>).category = 'other'
      }

      // Ensure tool.id exists
      if (!tool.id) {
        (tool as Record<string, unknown>).id = crypto.randomUUID()
      }
    }

    // Copy all fields from raw to preserve tool-specific data
    return { ...raw, ...event } as UniversalEvent
  }
}
