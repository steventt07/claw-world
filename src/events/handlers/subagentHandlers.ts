/**
 * Subagent Event Handlers
 *
 * Handles spawning and removing subagent visualizations
 * when Task tools start and complete.
 *
 * Supports both legacy Claude Code events (Task tool) and
 * universal agent protocol events (delegate category / subagent_spawn).
 */

import { eventBus } from '../EventBus'
import type { PreToolUseEvent, PostToolUseEvent } from '../../../shared/types'
import type { ToolStartEvent, ToolEndEvent, SubagentSpawnEvent, SubagentEndEvent } from '../../../shared/agent-protocol'

/**
 * Register subagent-related event handlers
 */
export function registerSubagentHandlers(): void {
  // Spawn subagent when Task tool starts (legacy)
  eventBus.on('pre_tool_use', (event: PreToolUseEvent, ctx) => {
    if (!ctx.session) return
    if (event.tool !== 'Task') return

    const description = (event.toolInput as { description?: string }).description
    ctx.session.subagents.spawn(event.toolUseId, description)
    ctx.session.stats.activeSubagents = ctx.session.subagents.count
  })

  // Remove subagent when Task tool completes (legacy)
  eventBus.on('post_tool_use', (event: PostToolUseEvent, ctx) => {
    if (!ctx.session) return
    if (event.tool !== 'Task') return

    ctx.session.subagents.remove(event.toolUseId)
    ctx.session.stats.activeSubagents = ctx.session.subagents.count
  })

  // Spawn subagent when delegate tool starts (universal)
  eventBus.on('tool_start', (event: ToolStartEvent, ctx) => {
    if (!ctx.session) return
    if (event.tool.category !== 'delegate') return

    const description = event.context || event.input?.description as string | undefined
    ctx.session.subagents.spawn(event.tool.id, description)
    ctx.session.stats.activeSubagents = ctx.session.subagents.count
  })

  // Remove subagent when delegate tool completes (universal)
  eventBus.on('tool_end', (event: ToolEndEvent, ctx) => {
    if (!ctx.session) return
    if (event.tool.category !== 'delegate') return

    ctx.session.subagents.remove(event.tool.id)
    ctx.session.stats.activeSubagents = ctx.session.subagents.count
  })

  // Explicit subagent spawn event (universal)
  eventBus.on('subagent_spawn', (event: SubagentSpawnEvent, ctx) => {
    if (!ctx.session) return
    const id = event.toolUseId || event.id
    ctx.session.subagents.spawn(id, event.description)
    ctx.session.stats.activeSubagents = ctx.session.subagents.count
  })

  // Explicit subagent end event (universal)
  eventBus.on('subagent_end', (event: SubagentEndEvent, ctx) => {
    if (!ctx.session) return
    const id = event.toolUseId || event.id
    ctx.session.subagents.remove(id)
    ctx.session.stats.activeSubagents = ctx.session.subagents.count
  })
}
