/**
 * SubagentManager - Manages subagent visualizations
 *
 * Tracks Task tool spawns and creates mini-Claude instances for each active subagent.
 * Sub-agents use lighter tints of their parent orchestrator's zone color.
 */

import * as THREE from 'three'
import type { WorkshopScene } from '../scene/WorkshopScene'
import { Claude, type ClaudeOptions } from './Claude'

export interface Subagent {
  id: string
  toolUseId: string
  claude: Claude
  spawnTime: number
  description?: string
}

/** Lightness steps for successive sub-agents (blend toward white) */
const TINT_LEVELS = [0.35, 0.5, 0.65, 0.8]

/** Create a lighter tint of a color by blending toward white */
function lightenColor(baseHex: number, amount: number): number {
  const base = new THREE.Color(baseHex)
  const white = new THREE.Color(0xffffff)
  base.lerp(white, amount)
  return base.getHex()
}

export class SubagentManager {
  private scene: WorkshopScene
  private subagents: Map<string, Subagent> = new Map()
  private spawnIndex = 0
  private parentColor: number

  constructor(scene: WorkshopScene, parentColor?: number) {
    this.scene = scene
    this.parentColor = parentColor ?? 0x4ac8e8 // fallback cyan
  }

  /** Update parent color (e.g. when zone color is assigned after construction) */
  setParentColor(color: number): void {
    this.parentColor = color
  }

  /**
   * Spawn a new subagent when a Task tool starts
   */
  spawn(toolUseId: string, description?: string): Subagent {
    // Don't spawn duplicates
    if (this.subagents.has(toolUseId)) {
      return this.subagents.get(toolUseId)!
    }

    // Lighter tint of parent color for each successive sub-agent
    const tint = TINT_LEVELS[this.spawnIndex % TINT_LEVELS.length]
    const color = lightenColor(this.parentColor, tint)
    this.spawnIndex++

    // Create mini-Claude at portal station
    const options: ClaudeOptions = {
      scale: 0.6, // Smaller than main Claude
      color: color,
      statusColor: color,
      startStation: 'portal',
    }

    const claude = new Claude(this.scene, options)
    claude.setState('thinking')

    // Offset position slightly so they don't overlap
    const offset = this.subagents.size * 0.5
    const angle = (this.subagents.size * Math.PI * 0.4) // Fan out
    claude.mesh.position.x += Math.sin(angle) * offset
    claude.mesh.position.z += Math.cos(angle) * offset

    const subagent: Subagent = {
      id: claude.id,
      toolUseId,
      claude,
      spawnTime: Date.now(),
      description,
    }

    this.subagents.set(toolUseId, subagent)
    console.log(`Subagent spawned: ${toolUseId}`, description)

    return subagent
  }

  /**
   * Remove a subagent when its Task completes
   */
  remove(toolUseId: string): void {
    const subagent = this.subagents.get(toolUseId)
    if (subagent) {
      subagent.claude.dispose()
      this.subagents.delete(toolUseId)
      console.log(`Subagent removed: ${toolUseId}`)
    }
  }

  /**
   * Get a subagent by toolUseId
   */
  get(toolUseId: string): Subagent | undefined {
    return this.subagents.get(toolUseId)
  }

  /**
   * Get all active subagents
   */
  getAll(): Subagent[] {
    return Array.from(this.subagents.values())
  }

  /**
   * Get count of active subagents
   */
  get count(): number {
    return this.subagents.size
  }

  /**
   * Clean up all subagents
   */
  dispose(): void {
    for (const subagent of this.subagents.values()) {
      subagent.claude.dispose()
    }
    this.subagents.clear()
  }
}
