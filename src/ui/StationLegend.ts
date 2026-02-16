/**
 * StationLegend - Toggleable overlay labeling each station with its purpose
 *
 * Uses THREE.Vector3.project() to convert station world positions to screen coordinates.
 * Updates positions each frame via requestAnimationFrame.
 */

import * as THREE from 'three'
import type { WorkshopScene } from '../scene/WorkshopScene'

/** Map station types to human-readable labels with icons */
const STATION_LABELS: Record<string, { label: string; icon: string }> = {
  bookshelf: { label: 'Read Files', icon: '\u{1F4DA}' },
  terminal: { label: 'Run Commands', icon: '\u{1F4BB}' },
  workbench: { label: 'Edit Files', icon: '\u{1F527}' },
  desk: { label: 'Write Files', icon: '\u{270D}\uFE0F' },
  scanner: { label: 'Search Code', icon: '\u{1F50D}' },
  antenna: { label: 'Web Access', icon: '\u{1F4E1}' },
  portal: { label: 'Spawn Sub-agents', icon: '\u{1F300}' },
  taskboard: { label: 'Task Tracking', icon: '\u{1F4CB}' },
}

export class StationLegend {
  private container: HTMLElement
  private labels: HTMLElement[] = []
  private scene: WorkshopScene | null = null
  private visible = false
  private animationId: number | null = null
  private autoHideTimeout: ReturnType<typeof setTimeout> | null = null

  constructor() {
    this.container = document.createElement('div')
    this.container.id = 'station-legend'
    // Insert into scene-panel so labels are relative to the 3D viewport
    const scenePanel = document.getElementById('scene-panel')
    if (scenePanel) {
      scenePanel.appendChild(this.container)
    } else {
      document.body.appendChild(this.container)
    }
  }

  /** Connect to the WorkshopScene for position queries */
  setScene(scene: WorkshopScene): void {
    this.scene = scene
  }

  /** Show the legend */
  show(): void {
    if (this.visible) return
    this.visible = true
    this.createLabels()
    this.container.classList.add('visible')
    this.startTracking()
  }

  /** Hide the legend */
  hide(): void {
    if (!this.visible) return
    this.visible = false
    this.container.classList.remove('visible')
    this.stopTracking()
    if (this.autoHideTimeout) {
      clearTimeout(this.autoHideTimeout)
      this.autoHideTimeout = null
    }
  }

  /** Toggle visibility */
  toggle(): void {
    if (this.visible) {
      this.hide()
    } else {
      this.show()
    }
  }

  /** Auto-show for a duration then fade out */
  autoShow(duration = 8000): void {
    this.show()
    if (this.autoHideTimeout) clearTimeout(this.autoHideTimeout)
    this.autoHideTimeout = setTimeout(() => {
      this.hide()
    }, duration)
  }

  isVisible(): boolean {
    return this.visible
  }

  dispose(): void {
    this.hide()
    this.container.remove()
  }

  private createLabels(): void {
    // Clear existing
    this.labels = []
    this.container.innerHTML = ''

    for (const [type, info] of Object.entries(STATION_LABELS)) {
      const el = document.createElement('div')
      el.className = 'station-legend-label'
      el.innerHTML = `<span class="station-legend-icon">${info.icon}</span>${info.label}`
      el.dataset.stationType = type
      this.container.appendChild(el)
      this.labels.push(el)
    }
  }

  private startTracking(): void {
    if (this.animationId !== null) return
    const update = () => {
      if (!this.visible) return
      this.updatePositions()
      this.animationId = requestAnimationFrame(update)
    }
    this.animationId = requestAnimationFrame(update)
  }

  private stopTracking(): void {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId)
      this.animationId = null
    }
  }

  private updatePositions(): void {
    if (!this.scene) return

    // Find the focused zone (or first zone)
    const focusedId = this.scene.focusedZoneId
    const zone = focusedId ? this.scene.zones.get(focusedId) : this.scene.zones.values().next().value
    if (!zone) return

    const camera = this.scene.camera
    const renderer = this.scene.renderer
    const width = renderer.domElement.clientWidth
    const height = renderer.domElement.clientHeight
    const tempVec = new THREE.Vector3()

    for (const label of this.labels) {
      const type = label.dataset.stationType
      if (!type) continue

      const station = zone.stations.get(type as any)
      if (!station) {
        label.style.display = 'none'
        continue
      }

      // Get world position of station (above the station mesh)
      tempVec.copy(station.position)
      tempVec.y += 2.5 // Above the station

      // Project to screen
      tempVec.project(camera)

      // Check if behind camera
      if (tempVec.z > 1) {
        label.style.display = 'none'
        continue
      }

      const x = (tempVec.x * 0.5 + 0.5) * width
      const y = (-tempVec.y * 0.5 + 0.5) * height

      label.style.display = ''
      label.style.left = `${x}px`
      label.style.top = `${y}px`
    }
  }
}
