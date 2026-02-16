/**
 * Base Adapter Interface
 *
 * All adapters implement this interface to normalize framework-specific
 * events into the universal AgentEvent format.
 */

import type { ToolCategory, UniversalEvent } from '../agent-protocol.js'

/**
 * Adapter interface for normalizing framework-specific events
 * into universal AgentEvent format.
 */
export interface EventAdapter {
  /** Unique identifier for this adapter (e.g., "claude-code", "langchain") */
  readonly name: string

  /**
   * Check if this adapter can handle the given raw event.
   * Used for auto-detection when the source is unknown.
   */
  canHandle(raw: Record<string, unknown>): boolean

  /**
   * Normalize a raw event into a universal AgentEvent.
   * Returns null if the event should be skipped/ignored.
   */
  normalize(raw: Record<string, unknown>): UniversalEvent | null

  /**
   * Categorize a tool name into a ToolCategory.
   * Used for mapping framework-specific tool names to visualization stations.
   */
  categorize(toolName: string): ToolCategory
}
