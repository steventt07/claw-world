/**
 * Universal Agent Protocol
 *
 * Agent-agnostic event types for visualizing any AI agent's activity.
 * Different agent frameworks (Claude Code, LangChain, custom) emit
 * events in their own format. Adapters normalize them to these types.
 *
 * This sits alongside the existing Claude-specific types in types.ts.
 * The two coexist: Claude events are normalized to universal events
 * at the server boundary before broadcasting to clients.
 */

// ============================================================================
// Tool Categories
// ============================================================================

/**
 * Universal tool categories that map to visualization stations.
 * Different frameworks have different tool names but they all
 * perform operations that fall into these categories.
 */
export type ToolCategory =
  | 'read'      // Reading files, inspecting data
  | 'write'     // Creating new files
  | 'edit'      // Modifying existing files
  | 'execute'   // Running commands, scripts
  | 'search'    // Searching files, patterns, web
  | 'network'   // HTTP requests, web fetching
  | 'delegate'  // Spawning sub-agents, tasks
  | 'plan'      // Task management, todos, planning
  | 'interact'  // User interaction, questions, prompts
  | 'other'     // Uncategorized tools

/**
 * Map tool categories to station types for visualization.
 * This replaces the hardcoded TOOL_STATION_MAP for universal events.
 */
export const CATEGORY_STATION_MAP: Record<ToolCategory, string> = {
  read: 'bookshelf',
  write: 'desk',
  edit: 'workbench',
  execute: 'terminal',
  search: 'scanner',
  network: 'antenna',
  delegate: 'portal',
  plan: 'taskboard',
  interact: 'center',
  other: 'center',
}

/**
 * Get station for a tool category
 */
export function getStationForCategory(category: ToolCategory): string {
  return CATEGORY_STATION_MAP[category] ?? 'center'
}

// ============================================================================
// Universal Event Types
// ============================================================================

export type AgentEventType =
  | 'tool_start'
  | 'tool_end'
  | 'agent_idle'
  | 'agent_thinking'
  | 'user_input'
  | 'agent_start'
  | 'agent_end'
  | 'notification'
  | 'subagent_spawn'
  | 'subagent_end'

// ============================================================================
// Base Event
// ============================================================================

export interface AgentEvent {
  /** Unique event ID */
  id: string
  /** Unix timestamp in milliseconds */
  timestamp: number
  /** Event type */
  type: AgentEventType
  /** Agent identifier (maps to session/zone) */
  agentId: string
  /** Source framework identifier (e.g., "claude-code", "langchain", "custom") */
  source: string
  /** Current working directory (optional) */
  cwd?: string
  /** Arbitrary metadata from the source framework */
  metadata?: Record<string, unknown>
}

// ============================================================================
// Tool Events
// ============================================================================

export interface ToolInfo {
  /** Tool name as reported by the framework */
  name: string
  /** Normalized category for visualization */
  category: ToolCategory
  /** Unique ID for this tool invocation (for matching start/end) */
  id: string
}

export interface ToolStartEvent extends AgentEvent {
  type: 'tool_start'
  tool: ToolInfo
  /** Tool input parameters */
  input?: Record<string, unknown>
  /** Human-readable context (e.g., filename, command) */
  context?: string
}

export interface ToolEndEvent extends AgentEvent {
  type: 'tool_end'
  tool: ToolInfo
  /** Whether the tool succeeded */
  success: boolean
  /** Duration in milliseconds */
  duration?: number
  /** Tool output/response */
  output?: Record<string, unknown>
}

// ============================================================================
// Agent Lifecycle Events
// ============================================================================

export interface AgentIdleEvent extends AgentEvent {
  type: 'agent_idle'
  /** Reason for becoming idle */
  reason?: string
  /** Agent's text response (if completing a task) */
  response?: string
}

export interface AgentThinkingEvent extends AgentEvent {
  type: 'agent_thinking'
}

export interface AgentStartEvent extends AgentEvent {
  type: 'agent_start'
  /** How the agent was started */
  trigger?: 'startup' | 'resume' | 'user_input' | 'other'
}

export interface AgentEndEvent extends AgentEvent {
  type: 'agent_end'
  /** Why the agent ended */
  reason?: string
}

// ============================================================================
// User Interaction Events
// ============================================================================

export interface UserInputEvent extends AgentEvent {
  type: 'user_input'
  /** The user's input text */
  text: string
}

// ============================================================================
// Notification Events
// ============================================================================

export interface AgentNotificationEvent extends AgentEvent {
  type: 'notification'
  /** Notification message */
  message: string
  /** Notification severity/type */
  level?: 'info' | 'warning' | 'error' | 'success'
}

// ============================================================================
// Sub-agent Events
// ============================================================================

export interface SubagentSpawnEvent extends AgentEvent {
  type: 'subagent_spawn'
  /** Parent agent that spawned this sub-agent */
  parentAgentId: string
  /** Description of the sub-agent's task */
  description?: string
  /** Tool use ID (for matching with tool_end) */
  toolUseId?: string
}

export interface SubagentEndEvent extends AgentEvent {
  type: 'subagent_end'
  /** Tool use ID (for matching) */
  toolUseId?: string
}

// ============================================================================
// Union Type
// ============================================================================

export type UniversalEvent =
  | ToolStartEvent
  | ToolEndEvent
  | AgentIdleEvent
  | AgentThinkingEvent
  | AgentStartEvent
  | AgentEndEvent
  | UserInputEvent
  | AgentNotificationEvent
  | SubagentSpawnEvent
  | SubagentEndEvent

// ============================================================================
// Agent Registration
// ============================================================================

/**
 * Information provided when an agent registers with the server.
 * Used to set up visualization zones and configure display.
 */
export interface AgentRegistration {
  /** Agent display name */
  name: string
  /** Framework identifier (e.g., "claude-code", "langchain", "crewai") */
  framework: string
  /** Working directory */
  cwd?: string
  /** Additional metadata */
  metadata?: Record<string, unknown>
}

export interface RegisteredAgent extends AgentRegistration {
  /** Server-assigned agent ID */
  agentId: string
  /** Registration timestamp */
  registeredAt: number
}

// ============================================================================
// Sound Mapping (category-based)
// ============================================================================

/**
 * Map tool categories to sound names.
 * Used by sound handlers to play appropriate sounds for universal events.
 */
export const CATEGORY_SOUND_MAP: Record<ToolCategory, string> = {
  read: 'read',
  write: 'write',
  edit: 'edit',
  execute: 'bash',
  search: 'grep',
  network: 'webfetch',
  delegate: 'task',
  plan: 'todo',
  interact: 'notification',
  other: 'read',   // Fallback
}

// ============================================================================
// Icon Mapping (category-based)
// ============================================================================

/**
 * Map tool categories to display icons.
 * Used by UI components to show appropriate icons for universal events.
 */
export const CATEGORY_ICON_MAP: Record<ToolCategory, string> = {
  read: '\u{1F4D6}',      // 📖
  write: '\u{1F4DD}',     // 📝
  edit: '\u{270F}\uFE0F', // ✏️
  execute: '\u{1F4BB}',   // 💻
  search: '\u{1F50D}',    // 🔍
  network: '\u{1F310}',   // 🌐
  delegate: '\u{1F916}',  // 🤖
  plan: '\u{1F4CB}',      // 📋
  interact: '\u{2753}',   // ❓
  other: '\u{1F527}',     // 🔧
}
