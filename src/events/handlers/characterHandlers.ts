/**
 * Character Movement Event Handlers
 *
 * Handles Claude character movement in response to tool use events.
 * Moves character to appropriate stations and sets context labels.
 *
 * Supports both legacy Claude Code events (pre_tool_use/post_tool_use)
 * and universal agent protocol events (tool_start/tool_end).
 */

import { eventBus } from '../EventBus'
import { soundManager } from '../../audio'
import { getToolContext } from '../../utils/ToolUtils'
import { getStationForTool } from '../../../shared/types'
import { getStationForCategory } from '../../../shared/agent-protocol'
import type { StationType, PreToolUseEvent, PostToolUseEvent, StopEvent, UserPromptSubmitEvent } from '../../../shared/types'
import type { ToolStartEvent, ToolEndEvent, AgentIdleEvent, UserInputEvent, ToolCategory } from '../../../shared/agent-protocol'

/**
 * Resolve station from either a tool name (legacy) or tool category (universal).
 */
function resolveStation(toolName: string, category?: string): StationType {
  // If category is available, prefer it (universal protocol)
  if (category) {
    return getStationForCategory(category as ToolCategory) as StationType
  }
  // Fall back to tool name lookup (legacy)
  return getStationForTool(toolName)
}

/**
 * Register character movement event handlers
 */
export function registerCharacterHandlers(): void {
  // Move character to station when tool starts (legacy)
  eventBus.on('pre_tool_use', (event: PreToolUseEvent, ctx) => {
    if (!ctx.session) return

    const station = resolveStation(event.tool)

    // Move character to station (skip 'center' - those are MCP browser tools)
    if (station !== 'center') {
      const zoneStation = ctx.session.zone.stations.get(station)
      if (zoneStation) {
        ctx.session.claude.moveToPosition(zoneStation.position, station)
        // Play walking sound
        if (ctx.soundEnabled) {
          soundManager.play('walking')
        }
      }
    }

    // Set context text above station
    if (ctx.scene && station !== 'center') {
      const context = getToolContext(event.tool, event.toolInput)
      if (context) {
        ctx.scene.setStationContext(station, context, event.sessionId)
      }

      // Pulse station ring to highlight activity
      ctx.scene.pulseStation(event.sessionId, station)
    }
  })

  // Move character to station when tool starts (universal)
  eventBus.on('tool_start', (event: ToolStartEvent, ctx) => {
    if (!ctx.session) return

    const station = resolveStation(event.tool.name, event.tool.category)

    if (station !== 'center') {
      const zoneStation = ctx.session.zone.stations.get(station)
      if (zoneStation) {
        ctx.session.claude.moveToPosition(zoneStation.position, station)
        if (ctx.soundEnabled) {
          soundManager.play('walking')
        }
      }
    }

    if (ctx.scene && station !== 'center') {
      const context = event.context || getToolContext(event.tool.name, event.input || {})
      if (context) {
        ctx.scene.setStationContext(station, context, event.agentId)
      }
      ctx.scene.pulseStation(event.agentId, station)
    }
  })

  // Set idle state when tool completes (legacy)
  eventBus.on('post_tool_use', (_event: PostToolUseEvent, ctx) => {
    if (!ctx.session) return

    // Only set idle if character isn't walking
    if (ctx.session.claude.state !== 'walking') {
      ctx.session.claude.setState('idle')
    }
  })

  // Set idle state when tool completes (universal)
  eventBus.on('tool_end', (_event: ToolEndEvent, ctx) => {
    if (!ctx.session) return
    if (ctx.session.claude.state !== 'walking') {
      ctx.session.claude.setState('idle')
    }
  })

  // Move character back to center when stopped (legacy)
  eventBus.on('stop', (event: StopEvent, ctx) => {
    if (!ctx.session || !ctx.scene) return

    // Move to zone center
    const centerStation = ctx.session.zone.stations.get('center')
    if (centerStation) {
      ctx.session.claude.moveToPosition(centerStation.position, 'center')
    }

    // Clear station context labels
    ctx.scene.clearAllContexts(event.sessionId)
  })

  // Move character back to center when idle (universal)
  eventBus.on('agent_idle', (event: AgentIdleEvent, ctx) => {
    if (!ctx.session || !ctx.scene) return

    const centerStation = ctx.session.zone.stations.get('center')
    if (centerStation) {
      ctx.session.claude.moveToPosition(centerStation.position, 'center')
    }
    ctx.scene.clearAllContexts(event.agentId)
  })

  // Set thinking state when user submits prompt (legacy)
  eventBus.on('user_prompt_submit', (_event: UserPromptSubmitEvent, ctx) => {
    if (!ctx.session) return
    ctx.session.claude.setState('thinking')
  })

  // Set thinking state when user sends input (universal)
  eventBus.on('user_input', (_event: UserInputEvent, ctx) => {
    if (!ctx.session) return
    ctx.session.claude.setState('thinking')
  })
}
