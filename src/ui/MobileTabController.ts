/**
 * MobileTabController - Manages tab-based navigation on mobile (≤640px)
 *
 * Provides full-screen panel switching between Scene, Feed, and Info tabs,
 * with swipe gestures and notification dots.
 */

import type { DemoEducation } from '../demo/types'

export type MobileTab = 'scene' | 'feed' | 'info'

export class MobileTabController {
  private activeTab: MobileTab = 'scene'
  private tabBar: HTMLElement | null = null
  private infoPanel: HTMLElement | null = null
  private touchStartX = 0
  private touchStartY = 0
  private enabled = false
  private touchStartedOnCanvas = false

  /** Current phase info for the Info tab */
  private currentPhase: { name: string; description: string } | null = null
  private currentScenarioEducation: DemoEducation | null = null
  private currentProgress = 0

  constructor() {
    this.checkEnabled()
    window.addEventListener('resize', () => this.checkEnabled())
  }

  private checkEnabled(): void {
    const shouldEnable = window.innerWidth <= 640
    if (shouldEnable && !this.enabled) {
      this.enable()
    } else if (!shouldEnable && this.enabled) {
      this.disable()
    }
  }

  private enable(): void {
    this.enabled = true
    document.body.classList.add('mobile-tabs-active')
    this.tabBar = document.getElementById('mobile-tab-bar')
    this.infoPanel = document.getElementById('mobile-info-panel')

    // Wire up tab clicks
    this.tabBar?.querySelectorAll('.mobile-tab').forEach(tab => {
      tab.addEventListener('click', (e) => {
        const target = (e.currentTarget as HTMLElement).dataset.tab as MobileTab
        if (target) this.switchTab(target)
      })
    })

    // Wire up swipe gestures on the app container
    const app = document.getElementById('app')
    if (app) {
      app.addEventListener('touchstart', this.onTouchStart, { passive: true })
      app.addEventListener('touchend', this.onTouchEnd, { passive: true })
    }

    this.switchTab('scene')
  }

  private disable(): void {
    this.enabled = false
    document.body.classList.remove('mobile-tabs-active')

    // Show both panels normally
    const scenePanel = document.getElementById('scene-panel')
    const feedPanel = document.getElementById('feed-panel')
    if (scenePanel) scenePanel.style.display = ''
    if (feedPanel) feedPanel.style.display = ''
    if (this.infoPanel) this.infoPanel.style.display = 'none'

    const app = document.getElementById('app')
    if (app) {
      app.removeEventListener('touchstart', this.onTouchStart)
      app.removeEventListener('touchend', this.onTouchEnd)
    }
  }

  private onTouchStart = (e: TouchEvent): void => {
    // Ignore touches on the Three.js canvas — let OrbitControls handle those
    const target = e.target as HTMLElement
    this.touchStartedOnCanvas = target.tagName === 'CANVAS'
    this.touchStartX = e.touches[0].clientX
    this.touchStartY = e.touches[0].clientY
  }

  private onTouchEnd = (e: TouchEvent): void => {
    // Don't intercept swipes that started on the 3D canvas
    if (this.touchStartedOnCanvas) return

    const dx = e.changedTouches[0].clientX - this.touchStartX
    const dy = e.changedTouches[0].clientY - this.touchStartY

    // Only swipe if horizontal movement > vertical and > threshold
    if (Math.abs(dx) < 50 || Math.abs(dx) < Math.abs(dy)) return

    const tabs: MobileTab[] = ['scene', 'feed', 'info']
    const currentIndex = tabs.indexOf(this.activeTab)
    if (dx < 0 && currentIndex < tabs.length - 1) {
      this.switchTab(tabs[currentIndex + 1])
    } else if (dx > 0 && currentIndex > 0) {
      this.switchTab(tabs[currentIndex - 1])
    }
  }

  switchTab(tab: MobileTab): void {
    if (!this.enabled) return
    this.activeTab = tab

    const scenePanel = document.getElementById('scene-panel')
    const feedPanel = document.getElementById('feed-panel')

    // Toggle panel visibility
    if (scenePanel) scenePanel.style.display = tab === 'scene' ? 'flex' : 'none'
    if (feedPanel) feedPanel.style.display = tab === 'feed' ? 'flex' : 'none'
    if (this.infoPanel) this.infoPanel.style.display = tab === 'info' ? 'flex' : 'none'

    // Update active tab styling
    this.tabBar?.querySelectorAll('.mobile-tab').forEach(t => {
      const el = t as HTMLElement
      el.classList.toggle('active', el.dataset.tab === tab)
    })

    // Clear notification dot on the tab we're switching to
    this.clearDot(tab)

    // Trigger resize so Three.js recalculates
    if (tab === 'scene') {
      window.dispatchEvent(new Event('resize'))
    }

    // Update info panel content when switching to it
    if (tab === 'info') {
      this.renderInfoPanel()
    }
  }

  /** Show a notification dot on a tab */
  showDot(tab: MobileTab): void {
    if (!this.enabled || this.activeTab === tab) return
    const tabEl = this.tabBar?.querySelector(`[data-tab="${tab}"]`)
    tabEl?.classList.add('has-dot')
  }

  /** Clear notification dot */
  clearDot(tab: MobileTab): void {
    const tabEl = this.tabBar?.querySelector(`[data-tab="${tab}"]`)
    tabEl?.classList.remove('has-dot')
  }

  /** Update the current phase (called from DemoMode progress) */
  updatePhase(name: string, description: string): void {
    this.currentPhase = { name, description }
    if (this.activeTab !== 'scene') {
      this.showDot('scene')
    }
    // Update info panel if visible
    if (this.activeTab === 'info') {
      this.renderInfoPanel()
    }
  }

  /** Update progress */
  updateProgress(percent: number): void {
    this.currentProgress = percent
    if (this.activeTab === 'info') {
      const bar = document.getElementById('mobile-info-progress-fill')
      if (bar) bar.style.width = `${Math.min(100, percent * 100)}%`
    }
  }

  /** Set scenario education content for the Info tab */
  setEducation(education: DemoEducation | null): void {
    this.currentScenarioEducation = education
    if (this.activeTab === 'info') {
      this.renderInfoPanel()
    }
  }

  /** Notify that feed has new activity */
  notifyFeedActivity(): void {
    if (this.activeTab !== 'feed') {
      this.showDot('feed')
    }
  }

  /** Get current active tab */
  getActiveTab(): MobileTab {
    return this.activeTab
  }

  isEnabled(): boolean {
    return this.enabled
  }

  /** Set up scenario switcher callback */
  private onSwitchScenario: ((type: string) => void) | null = null
  setScenarioSwitcher(callback: (type: string) => void): void {
    this.onSwitchScenario = callback
  }

  /** Render the info panel content */
  private renderInfoPanel(): void {
    if (!this.infoPanel) return
    const edu = this.currentScenarioEducation

    let html = ''

    if (edu) {
      html += `<div class="mobile-info-header">
        <h2>${edu.intro.title}</h2>
        <p>${edu.intro.description}</p>
      </div>`

      html += `<div class="mobile-info-agents">
        <span class="mobile-info-badge">${edu.intro.agentCount.orchestrators} orchestrator${edu.intro.agentCount.orchestrators > 1 ? 's' : ''}</span>
        <span class="mobile-info-badge">${edu.intro.agentCount.subagents} sub-agent${edu.intro.agentCount.subagents > 1 ? 's' : ''}</span>
      </div>`

      if (edu.intro.watchFor.length > 0) {
        html += `<div class="mobile-info-section">
          <div class="mobile-info-section-title">👀 Watch for</div>
          <ul class="mobile-info-watch-list">
            ${edu.intro.watchFor.map(w => `<li>${w}</li>`).join('')}
          </ul>
        </div>`
      }
    }

    // Current phase
    if (this.currentPhase) {
      html += `<div class="mobile-info-section">
        <div class="mobile-info-section-title">📍 Current Phase</div>
        <div class="mobile-info-phase">
          <strong>${this.currentPhase.name}</strong>
          <span>${this.currentPhase.description}</span>
        </div>
        <div class="mobile-info-progress">
          <div class="mobile-info-progress-fill" id="mobile-info-progress-fill" style="width: ${Math.min(100, this.currentProgress * 100)}%"></div>
        </div>
      </div>`
    }

    // Scenario switcher
    html += `<div class="mobile-info-section">
      <div class="mobile-info-section-title">🎬 Switch Demo</div>
      <div class="mobile-info-scenarios" id="mobile-info-scenarios"></div>
    </div>`

    this.infoPanel.innerHTML = html

    // Wire up scenario buttons (populate from demo bar buttons)
    const scenarioContainer = document.getElementById('mobile-info-scenarios')
    if (scenarioContainer && this.onSwitchScenario) {
      const demoBarBtns = document.querySelectorAll('.demo-bar-btn[data-scenario]')
      demoBarBtns.forEach(btn => {
        const el = btn as HTMLElement
        const type = el.dataset.scenario
        if (!type) return
        const clone = document.createElement('button')
        clone.className = 'mobile-info-scenario-btn' + (el.classList.contains('active') ? ' active' : '')
        clone.textContent = el.textContent
        clone.addEventListener('click', () => {
          this.onSwitchScenario?.(type)
          this.switchTab('scene')
        })
        scenarioContainer.appendChild(clone)
      })
    }
  }
}

/** Singleton instance */
let _instance: MobileTabController | null = null

export function getMobileTabController(): MobileTabController {
  if (!_instance) {
    _instance = new MobileTabController()
  }
  return _instance
}

export function initMobileTabController(): MobileTabController {
  return getMobileTabController()
}
