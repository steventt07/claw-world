/**
 * ToolUtils - Pure utility functions for tool display
 *
 * These are stateless helpers used for rendering tool information
 * in the UI (icons, context strings, etc.)
 *
 * Supports both legacy tool name lookup and category-based lookup
 * for the universal agent protocol.
 */

import { CATEGORY_ICON_MAP } from '../../shared/agent-protocol'
import type { ToolCategory } from '../../shared/agent-protocol'

/**
 * Get emoji icon for a tool name (legacy)
 */
export function getToolIcon(tool: string): string {
  const icons: Record<string, string> = {
    Read: '\u{1F4D6}',
    Edit: '\u270F\uFE0F',
    Write: '\u{1F4DD}',
    Bash: '\u{1F4BB}',
    Grep: '\u{1F50D}',
    Glob: '\u{1F4C1}',
    WebFetch: '\u{1F310}',
    WebSearch: '\u{1F50E}',
    Task: '\u{1F916}',
    TodoWrite: '\u{1F4CB}',
    NotebookEdit: '\u{1F4D3}',
    AskFollowupQuestion: '\u2753',
  }
  return icons[tool] ?? '\u{1F527}'
}

/**
 * Get emoji icon for a tool category (universal)
 */
export function getToolIconByCategory(category: ToolCategory): string {
  return CATEGORY_ICON_MAP[category] ?? '\u{1F527}'
}

/**
 * Extract context string from tool input for display
 * Returns a short, human-readable summary of what the tool is operating on
 */
export function getToolContext(tool: string, input: Record<string, unknown>): string | null {
  switch (tool) {
    case 'Read':
    case 'Write':
    case 'Edit':
    case 'NotebookEdit': {
      const path = (input.file_path || input.notebook_path) as string
      if (path) {
        // Show just filename or last path component
        return path.split('/').pop() || path
      }
      return null
    }
    case 'Bash': {
      const cmd = input.command as string
      if (cmd) {
        // Show first part of command
        const firstLine = cmd.split('\n')[0]
        return firstLine.length > 30 ? firstLine.slice(0, 30) + '...' : firstLine
      }
      return null
    }
    case 'Grep': {
      const pattern = input.pattern as string
      return pattern ? `/${pattern}/` : null
    }
    case 'Glob': {
      const pattern = input.pattern as string
      return pattern || null
    }
    case 'WebFetch': {
      const url = input.url as string
      if (url) {
        try {
          const hostname = new URL(url).hostname
          return hostname
        } catch {
          return url.slice(0, 30)
        }
      }
      return null
    }
    case 'WebSearch': {
      const query = input.query as string
      return query ? `"${query}"` : null
    }
    case 'Task': {
      const desc = input.description as string
      return desc || null
    }
    case 'TodoWrite':
      return 'Updating tasks'
    default:
      return null
  }
}

/**
 * Extract context string from tool input based on category (universal).
 * Used when the tool name isn't a known Claude Code tool.
 */
export function getToolContextByCategory(
  category: ToolCategory,
  input: Record<string, unknown>,
): string | null {
  switch (category) {
    case 'read':
    case 'write':
    case 'edit': {
      const path = (input.file_path || input.path || input.filename) as string
      if (path) return path.split('/').pop() || path
      return null
    }
    case 'execute': {
      const cmd = (input.command || input.cmd) as string
      if (cmd) {
        const firstLine = cmd.split('\n')[0]
        return firstLine.length > 30 ? firstLine.slice(0, 30) + '...' : firstLine
      }
      return null
    }
    case 'search': {
      const pattern = (input.pattern || input.query || input.search) as string
      return pattern ? `/${pattern}/` : null
    }
    case 'network': {
      const url = (input.url || input.endpoint) as string
      if (url) {
        try { return new URL(url).hostname } catch { return url.slice(0, 30) }
      }
      return null
    }
    case 'delegate': {
      const desc = (input.description || input.task) as string
      return desc || null
    }
    case 'plan':
      return (input.description || input.task) as string || null
    default:
      return null
  }
}
