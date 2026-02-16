/**
 * Claude Code Adapter
 *
 * Normalizes Claude Code hook events (pre_tool_use, post_tool_use, etc.)
 * into the universal AgentEvent format. This migrates the existing
 * TOOL_STATION_MAP and getToolContext logic into adapter form.
 */

import type { EventAdapter } from './base-adapter.js'
import type {
  ToolCategory,
  UniversalEvent,
  ToolStartEvent,
  ToolEndEvent,
  AgentIdleEvent,
  AgentStartEvent,
  AgentEndEvent,
  UserInputEvent,
  AgentNotificationEvent,
  SubagentSpawnEvent,
  SubagentEndEvent,
  AgentThinkingEvent,
} from '../agent-protocol.js'

// ============================================================================
// Tool Categorization
// ============================================================================

/**
 * Map Claude Code tool names to universal categories.
 * This replaces TOOL_STATION_MAP with a category-based approach.
 */
const CLAUDE_TOOL_CATEGORIES: Record<string, ToolCategory> = {
  Read: 'read',
  Write: 'write',
  Edit: 'edit',
  Bash: 'execute',
  Grep: 'search',
  Glob: 'search',
  WebFetch: 'network',
  WebSearch: 'network',
  Task: 'delegate',
  TodoWrite: 'plan',
  AskUserQuestion: 'interact',
  NotebookEdit: 'edit',
}

// ============================================================================
// Context Extraction
// ============================================================================

/**
 * Extract human-readable context from Claude Code tool input.
 * Migrated from src/utils/ToolUtils.ts getToolContext().
 */
function extractContext(tool: string, input: Record<string, unknown>): string | undefined {
  switch (tool) {
    case 'Read':
    case 'Write':
    case 'Edit':
    case 'NotebookEdit': {
      const path = (input.file_path || input.notebook_path) as string
      if (path) return path.split('/').pop() || path
      return undefined
    }
    case 'Bash': {
      const cmd = input.command as string
      if (cmd) {
        const firstLine = cmd.split('\n')[0]
        return firstLine.length > 30 ? firstLine.slice(0, 30) + '...' : firstLine
      }
      return undefined
    }
    case 'Grep': {
      const pattern = input.pattern as string
      return pattern ? `/${pattern}/` : undefined
    }
    case 'Glob': {
      const pattern = input.pattern as string
      return pattern || undefined
    }
    case 'WebFetch': {
      const url = input.url as string
      if (url) {
        try { return new URL(url).hostname } catch { return url.slice(0, 30) }
      }
      return undefined
    }
    case 'WebSearch': {
      const query = input.query as string
      return query ? `"${query}"` : undefined
    }
    case 'Task': {
      const desc = input.description as string
      return desc || undefined
    }
    case 'TodoWrite':
      return 'Updating tasks'
    default:
      return undefined
  }
}

// ============================================================================
// Claude Code Adapter
// ============================================================================

export class ClaudeCodeAdapter implements EventAdapter {
  readonly name = 'claude-code'

  /**
   * Detect Claude Code events by checking for known fields.
   * Claude Code events have `type` matching HookEventType and `sessionId`.
   */
  canHandle(raw: Record<string, unknown>): boolean {
    const type = raw.type as string
    if (!type || !raw.sessionId) return false

    const claudeTypes = [
      'pre_tool_use', 'post_tool_use', 'stop', 'subagent_stop',
      'session_start', 'session_end', 'user_prompt_submit',
      'notification', 'pre_compact',
    ]
    return claudeTypes.includes(type)
  }

  /**
   * Categorize a Claude Code tool name into a ToolCategory.
   */
  categorize(toolName: string): ToolCategory {
    // Check known Claude tools first
    if (toolName in CLAUDE_TOOL_CATEGORIES) {
      return CLAUDE_TOOL_CATEGORIES[toolName]
    }

    // MCP tools (mcp__*) - try to infer category from name
    if (toolName.startsWith('mcp__')) {
      const lower = toolName.toLowerCase()
      if (lower.includes('browser') || lower.includes('playwright')) return 'interact'
      if (lower.includes('search') || lower.includes('query')) return 'search'
      if (lower.includes('fetch') || lower.includes('http') || lower.includes('api')) return 'network'
      if (lower.includes('read') || lower.includes('get')) return 'read'
      if (lower.includes('write') || lower.includes('create') || lower.includes('set')) return 'write'
      if (lower.includes('edit') || lower.includes('update') || lower.includes('modify')) return 'edit'
      if (lower.includes('run') || lower.includes('exec')) return 'execute'
    }

    return 'other'
  }

  /**
   * Normalize a Claude Code event into a universal event.
   */
  normalize(raw: Record<string, unknown>): UniversalEvent | null {
    const type = raw.type as string
    const sessionId = raw.sessionId as string
    const id = raw.id as string || crypto.randomUUID()
    const timestamp = raw.timestamp as number || Date.now()
    const cwd = raw.cwd as string | undefined

    const base = {
      id,
      timestamp,
      agentId: sessionId,
      source: 'claude-code' as const,
      cwd,
    }

    switch (type) {
      case 'pre_tool_use': {
        const toolName = raw.tool as string
        const toolInput = (raw.toolInput || {}) as Record<string, unknown>
        const toolUseId = raw.toolUseId as string
        const category = this.categorize(toolName)

        // Check if this is a Task tool (subagent spawn)
        if (toolName === 'Task') {
          const spawnEvent: SubagentSpawnEvent = {
            ...base,
            type: 'subagent_spawn',
            parentAgentId: sessionId,
            description: (toolInput.description as string) || undefined,
            toolUseId,
          }
          // Also emit tool_start - return both via metadata
          const toolStart: ToolStartEvent = {
            ...base,
            id: id + '_tool',
            type: 'tool_start',
            tool: { name: toolName, category, id: toolUseId },
            input: toolInput,
            context: extractContext(toolName, toolInput),
            metadata: { _alsoEmit: spawnEvent },
          }
          return toolStart
        }

        const event: ToolStartEvent = {
          ...base,
          type: 'tool_start',
          tool: { name: toolName, category, id: toolUseId },
          input: toolInput,
          context: extractContext(toolName, toolInput),
        }
        return event
      }

      case 'post_tool_use': {
        const toolName = raw.tool as string
        const toolUseId = raw.toolUseId as string
        const category = this.categorize(toolName)
        const success = raw.success as boolean
        const duration = raw.duration as number | undefined

        // Check if this is a Task tool (subagent end)
        if (toolName === 'Task') {
          const endEvent: SubagentEndEvent = {
            ...base,
            type: 'subagent_end',
            toolUseId,
          }
          const toolEnd: ToolEndEvent = {
            ...base,
            id: id + '_tool',
            type: 'tool_end',
            tool: { name: toolName, category, id: toolUseId },
            success,
            duration,
            metadata: { _alsoEmit: endEvent },
          }
          return toolEnd
        }

        const event: ToolEndEvent = {
          ...base,
          type: 'tool_end',
          tool: { name: toolName, category, id: toolUseId },
          success,
          duration,
          output: (raw.toolResponse || undefined) as Record<string, unknown> | undefined,
        }
        return event
      }

      case 'stop': {
        const event: AgentIdleEvent = {
          ...base,
          type: 'agent_idle',
          reason: 'stop',
          response: raw.response as string | undefined,
        }
        return event
      }

      case 'subagent_stop': {
        const event: AgentIdleEvent = {
          ...base,
          type: 'agent_idle',
          reason: 'subagent_stop',
        }
        return event
      }

      case 'session_start': {
        const event: AgentStartEvent = {
          ...base,
          type: 'agent_start',
          trigger: this.mapStartSource(raw.source as string),
        }
        return event
      }

      case 'session_end': {
        const event: AgentEndEvent = {
          ...base,
          type: 'agent_end',
          reason: raw.reason as string,
        }
        return event
      }

      case 'user_prompt_submit': {
        const event: UserInputEvent = {
          ...base,
          type: 'user_input',
          text: raw.prompt as string || '',
        }
        return event
      }

      case 'notification': {
        const event: AgentNotificationEvent = {
          ...base,
          type: 'notification',
          message: raw.message as string || '',
          level: 'info',
        }
        return event
      }

      case 'pre_compact': {
        // Map to a thinking event (compaction = internal processing)
        const event: AgentThinkingEvent = {
          ...base,
          type: 'agent_thinking',
          metadata: { trigger: raw.trigger },
        }
        return event
      }

      default:
        return null
    }
  }

  private mapStartSource(source: string): 'startup' | 'resume' | 'user_input' | 'other' {
    switch (source) {
      case 'startup': return 'startup'
      case 'resume': return 'resume'
      case 'clear': return 'other'
      case 'compact': return 'other'
      default: return 'other'
    }
  }
}
