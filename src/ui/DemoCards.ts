/**
 * DemoCards - Intro & Summary card overlays for demo mode
 *
 * Shows an intro card before demos explaining what to watch for,
 * and a summary card after each cycle showing achievements.
 */

import type { DemoEducation } from '../demo/types'

// ============================================================================
// Intro Card
// ============================================================================

let _introTimeout: ReturnType<typeof setTimeout> | null = null

/**
 * Show an intro card overlay. Auto-dismisses after 5s or on click.
 * Returns a promise that resolves when the card is dismissed.
 */
export function showIntroCard(intro: DemoEducation['intro']): Promise<void> {
  return new Promise<void>((resolve) => {
    // Remove any existing card
    hideIntroCard()

    const overlay = document.createElement('div')
    overlay.className = 'demo-card-overlay'
    overlay.id = 'demo-intro-overlay'

    const card = document.createElement('div')
    card.className = 'demo-card demo-intro-card'

    // Title
    const title = document.createElement('h2')
    title.className = 'demo-card-title'
    title.textContent = intro.title
    card.appendChild(title)

    // Description
    const desc = document.createElement('p')
    desc.className = 'demo-card-description'
    desc.textContent = intro.description
    card.appendChild(desc)

    // Agent count badge
    const badge = document.createElement('div')
    badge.className = 'demo-card-agents'
    badge.innerHTML = `<span class="demo-card-agent-count">${intro.agentCount.orchestrators}</span> orchestrator${intro.agentCount.orchestrators > 1 ? 's' : ''} + <span class="demo-card-agent-count">${intro.agentCount.subagents}</span> sub-agent${intro.agentCount.subagents > 1 ? 's' : ''}`
    card.appendChild(badge)

    // Watch for section
    if (intro.watchFor.length > 0) {
      const watchSection = document.createElement('div')
      watchSection.className = 'demo-card-watch'

      const watchTitle = document.createElement('div')
      watchTitle.className = 'demo-card-watch-title'
      watchTitle.textContent = 'Watch for'
      watchSection.appendChild(watchTitle)

      const watchList = document.createElement('ul')
      watchList.className = 'demo-card-watch-list'
      for (const item of intro.watchFor) {
        const li = document.createElement('li')
        li.textContent = item
        watchList.appendChild(li)
      }
      watchSection.appendChild(watchList)
      card.appendChild(watchSection)
    }

    // Dismiss hint
    const hint = document.createElement('div')
    hint.className = 'demo-card-hint'
    hint.textContent = 'Click anywhere to start'
    card.appendChild(hint)

    overlay.appendChild(card)
    document.body.appendChild(overlay)

    // Animate in
    requestAnimationFrame(() => overlay.classList.add('visible'))

    const dismiss = () => {
      if (_introTimeout) {
        clearTimeout(_introTimeout)
        _introTimeout = null
      }
      hideIntroCard()
      resolve()
    }

    overlay.addEventListener('click', dismiss)
    _introTimeout = setTimeout(dismiss, 3000)
  })
}

function hideIntroCard(): void {
  const overlay = document.getElementById('demo-intro-overlay')
  if (!overlay) return
  overlay.classList.remove('visible')
  setTimeout(() => overlay.remove(), 300)
}

// ============================================================================
// Summary Card
// ============================================================================

let _summaryTimeout: ReturnType<typeof setTimeout> | null = null

/**
 * Show a summary card overlay. Auto-dismisses after 6s or on click.
 */
export function showSummaryCard(summary: DemoEducation['summary']): void {
  // Remove any existing card
  hideSummaryCard()

  const overlay = document.createElement('div')
  overlay.className = 'demo-card-overlay'
  overlay.id = 'demo-summary-overlay'

  const card = document.createElement('div')
  card.className = 'demo-card demo-summary-card'

  // Title
  const title = document.createElement('h2')
  title.className = 'demo-card-title'
  title.textContent = 'Cycle Complete'
  card.appendChild(title)

  // Achievements
  if (summary.achievements.length > 0) {
    const achieveSection = document.createElement('div')
    achieveSection.className = 'demo-card-achievements'

    for (const achievement of summary.achievements) {
      const item = document.createElement('div')
      item.className = 'demo-card-achievement'
      item.textContent = achievement
      achieveSection.appendChild(item)
    }
    card.appendChild(achieveSection)
  }

  // Parallel time saved
  if (summary.parallelTimeSaved) {
    const timeSaved = document.createElement('div')
    timeSaved.className = 'demo-card-time-saved'
    timeSaved.innerHTML = `<span class="demo-card-time-label">Parallel time saved:</span> <span class="demo-card-time-value">${summary.parallelTimeSaved}</span>`
    card.appendChild(timeSaved)
  }

  // Dismiss hint
  const hint = document.createElement('div')
  hint.className = 'demo-card-hint'
  hint.textContent = 'Restarting demo...'
  card.appendChild(hint)

  overlay.appendChild(card)
  document.body.appendChild(overlay)

  // Animate in
  requestAnimationFrame(() => overlay.classList.add('visible'))

  const dismiss = () => {
    if (_summaryTimeout) {
      clearTimeout(_summaryTimeout)
      _summaryTimeout = null
    }
    hideSummaryCard()
  }

  overlay.addEventListener('click', dismiss)
  _summaryTimeout = setTimeout(dismiss, 6000)
}

function hideSummaryCard(): void {
  const overlay = document.getElementById('demo-summary-overlay')
  if (!overlay) return
  overlay.classList.remove('visible')
  setTimeout(() => overlay.remove(), 300)
}
