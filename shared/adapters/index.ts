/**
 * Adapter System - Barrel Export
 *
 * Provides adapter auto-detection for normalizing events from
 * any framework into the universal AgentEvent format.
 */

export type { EventAdapter } from './base-adapter.js'
export { ClaudeCodeAdapter } from './claude-code-adapter.js'
export { GenericAdapter } from './generic-adapter.js'

import type { EventAdapter } from './base-adapter.js'
import type { UniversalEvent } from '../agent-protocol.js'
import { GenericAdapter } from './generic-adapter.js'
import { ClaudeCodeAdapter } from './claude-code-adapter.js'

/**
 * Registry of all available adapters.
 * Order matters: more specific adapters should come first.
 */
const adapters: EventAdapter[] = [
  new ClaudeCodeAdapter(),
  new GenericAdapter(),
]

/**
 * Auto-detect the appropriate adapter for a raw event
 * and normalize it to a UniversalEvent.
 *
 * Returns null if no adapter can handle the event.
 */
export function normalizeEvent(raw: Record<string, unknown>): UniversalEvent | null {
  for (const adapter of adapters) {
    if (adapter.canHandle(raw)) {
      return adapter.normalize(raw)
    }
  }
  return null
}

/**
 * Get an adapter by name
 */
export function getAdapter(name: string): EventAdapter | undefined {
  return adapters.find(a => a.name === name)
}

/**
 * Register a custom adapter.
 * Custom adapters are checked before built-in ones.
 */
export function registerAdapter(adapter: EventAdapter): void {
  // Insert at the beginning so custom adapters take priority
  adapters.unshift(adapter)
}
