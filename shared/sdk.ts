/**
 * Vibecraft2 Client SDK
 *
 * Minimal client library for any agent to connect to Vibecraft2.
 * Sends events in the universal AgentEvent format via HTTP.
 *
 * Usage:
 * ```typescript
 * import { Vibecraft2Client } from 'vibecraft2/sdk'
 *
 * const client = new Vibecraft2Client('http://localhost:4003')
 * const agentId = await client.register('My Agent', 'custom')
 *
 * await client.toolStart({ name: 'readFile', category: 'read', id: 'tool-1' })
 * // ... tool executes ...
 * await client.toolEnd({ name: 'readFile', category: 'read', id: 'tool-1', success: true })
 *
 * await client.idle()
 * ```
 */

import type {
  ToolCategory,
  ToolStartEvent,
  ToolEndEvent,
  AgentIdleEvent,
  AgentThinkingEvent,
  UserInputEvent,
  AgentStartEvent,
  AgentEndEvent,
  AgentNotificationEvent,
  SubagentSpawnEvent,
  SubagentEndEvent,
  AgentRegistration,
  RegisteredAgent,
} from './agent-protocol.js'

// ============================================================================
// Types
// ============================================================================

export interface ToolStartOptions {
  /** Tool name */
  name: string
  /** Tool category for visualization */
  category: ToolCategory
  /** Unique ID for this tool invocation */
  id: string
  /** Tool input parameters */
  input?: Record<string, unknown>
  /** Human-readable context (e.g., filename) */
  context?: string
}

export interface ToolEndOptions {
  /** Tool name */
  name: string
  /** Tool category */
  category: ToolCategory
  /** Unique ID matching the toolStart call */
  id: string
  /** Whether the tool succeeded */
  success: boolean
  /** Duration in milliseconds */
  duration?: number
  /** Tool output */
  output?: Record<string, unknown>
}

export interface SubagentSpawnOptions {
  /** Description of the sub-agent's task */
  description?: string
  /** Unique tool use ID for matching spawn/end */
  toolUseId: string
}

// ============================================================================
// Client
// ============================================================================

export class Vibecraft2Client {
  private baseUrl: string
  private agentId: string | null = null
  private source: string = 'custom'

  constructor(url: string = 'http://localhost:4003') {
    this.baseUrl = url.replace(/\/$/, '')
  }

  /**
   * Register this agent with the Vibecraft2 server.
   * Returns the assigned agentId.
   */
  async register(name: string, framework: string, metadata?: Record<string, unknown>): Promise<string> {
    this.source = framework
    const registration: AgentRegistration = { name, framework, metadata }

    const response = await fetch(`${this.baseUrl}/v2/agents/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(registration),
    })

    if (!response.ok) {
      throw new Error(`Registration failed: ${response.status} ${response.statusText}`)
    }

    const result = await response.json() as { ok: boolean; agent: RegisteredAgent }
    this.agentId = result.agent.agentId
    return this.agentId
  }

  /**
   * Set the agent ID directly (skip registration).
   * Useful when the agent ID is already known.
   */
  setAgentId(agentId: string, source: string = 'custom'): void {
    this.agentId = agentId
    this.source = source
  }

  /**
   * Send a tool_start event
   */
  async toolStart(opts: ToolStartOptions): Promise<void> {
    const event: Omit<ToolStartEvent, 'id' | 'timestamp' | 'agentId' | 'source'> & Partial<ToolStartEvent> = {
      type: 'tool_start',
      tool: { name: opts.name, category: opts.category, id: opts.id },
      input: opts.input,
      context: opts.context,
    }
    await this.send(event)
  }

  /**
   * Send a tool_end event
   */
  async toolEnd(opts: ToolEndOptions): Promise<void> {
    const event: Partial<ToolEndEvent> = {
      type: 'tool_end',
      tool: { name: opts.name, category: opts.category, id: opts.id },
      success: opts.success,
      duration: opts.duration,
      output: opts.output,
    }
    await this.send(event)
  }

  /**
   * Signal that the agent is idle
   */
  async idle(reason?: string, response?: string): Promise<void> {
    const event: Partial<AgentIdleEvent> = {
      type: 'agent_idle',
      reason,
      response,
    }
    await this.send(event)
  }

  /**
   * Signal that the agent is thinking
   */
  async thinking(): Promise<void> {
    const event: Partial<AgentThinkingEvent> = {
      type: 'agent_thinking',
    }
    await this.send(event)
  }

  /**
   * Send a user input event
   */
  async userInput(text: string): Promise<void> {
    const event: Partial<UserInputEvent> = {
      type: 'user_input',
      text,
    }
    await this.send(event)
  }

  /**
   * Signal agent start
   */
  async start(trigger?: 'startup' | 'resume' | 'user_input' | 'other'): Promise<void> {
    const event: Partial<AgentStartEvent> = {
      type: 'agent_start',
      trigger,
    }
    await this.send(event)
  }

  /**
   * Signal agent end
   */
  async end(reason?: string): Promise<void> {
    const event: Partial<AgentEndEvent> = {
      type: 'agent_end',
      reason,
    }
    await this.send(event)
  }

  /**
   * Send a notification
   */
  async notify(message: string, level?: 'info' | 'warning' | 'error' | 'success'): Promise<void> {
    const event: Partial<AgentNotificationEvent> = {
      type: 'notification',
      message,
      level,
    }
    await this.send(event)
  }

  /**
   * Spawn a sub-agent
   */
  async subagentSpawn(opts: SubagentSpawnOptions): Promise<void> {
    const event: Partial<SubagentSpawnEvent> = {
      type: 'subagent_spawn',
      parentAgentId: this.getAgentId(),
      description: opts.description,
      toolUseId: opts.toolUseId,
    }
    await this.send(event)
  }

  /**
   * End a sub-agent
   */
  async subagentEnd(toolUseId: string): Promise<void> {
    const event: Partial<SubagentEndEvent> = {
      type: 'subagent_end',
      toolUseId,
    }
    await this.send(event)
  }

  // ============================================================================
  // Internal
  // ============================================================================

  private getAgentId(): string {
    if (!this.agentId) {
      throw new Error('Agent not registered. Call register() or setAgentId() first.')
    }
    return this.agentId
  }

  private async send(partialEvent: Record<string, unknown>): Promise<void> {
    const event = {
      ...partialEvent,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      agentId: this.getAgentId(),
      source: this.source,
    }

    const response = await fetch(`${this.baseUrl}/v2/event`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(event),
    })

    if (!response.ok) {
      throw new Error(`Event send failed: ${response.status} ${response.statusText}`)
    }
  }
}
