/**
 * WaitlistModal - Beta waitlist signup modal
 *
 * A floating "Join Beta" button that opens a modal for email signup.
 * Stores signups in the waitlist table via Supabase.
 */

import { supabase } from '../integrations/supabase/client'

// ============================================================================
// State
// ============================================================================

let isVisible = false

// ============================================================================
// Public API
// ============================================================================

/**
 * Initialize the waitlist modal and floating button
 */
export function setupWaitlistModal(): void {
  const modal = document.getElementById('waitlist-modal')
  const closeBtn = document.getElementById('waitlist-close')
  const form = document.getElementById('waitlist-form') as HTMLFormElement
  const fab = document.getElementById('waitlist-fab')

  // FAB opens modal
  fab?.addEventListener('click', () => openWaitlistModal())

  // Close button
  closeBtn?.addEventListener('click', () => closeWaitlistModal())

  // Click outside to close
  modal?.addEventListener('click', (e) => {
    if (e.target === modal) closeWaitlistModal()
  })

  // Escape to close
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isVisible) closeWaitlistModal()
  })

  // Form submit
  form?.addEventListener('submit', async (e) => {
    e.preventDefault()
    await handleSubmit()
  })

  // Check if already signed up
  const alreadySignedUp = localStorage.getItem('vibecraft2-waitlist-signed-up')
  if (alreadySignedUp && fab) {
    fab.classList.add('signed-up')
    fab.innerHTML = '<span class="fab-icon">✓</span><span class="fab-label">Joined!</span>'
    fab.title = 'You\'re on the waitlist!'
  }
}

/**
 * Open the waitlist modal
 */
export function openWaitlistModal(): void {
  const modal = document.getElementById('waitlist-modal')
  if (!modal) return

  modal.classList.add('visible')
  isVisible = true

  // Reset form state
  const form = document.getElementById('waitlist-form') as HTMLFormElement
  const statusEl = document.getElementById('waitlist-status')
  const submitBtn = document.getElementById('waitlist-submit') as HTMLButtonElement

  form?.reset()
  if (statusEl) {
    statusEl.textContent = ''
    statusEl.className = 'waitlist-status'
  }
  if (submitBtn) {
    submitBtn.disabled = false
    submitBtn.textContent = 'Join the Waitlist'
  }

  // Focus email input
  setTimeout(() => {
    const emailInput = document.getElementById('waitlist-email') as HTMLInputElement
    emailInput?.focus()
  }, 50)
}

/**
 * Close the waitlist modal
 */
export function closeWaitlistModal(): void {
  const modal = document.getElementById('waitlist-modal')
  modal?.classList.remove('visible')
  isVisible = false
}

// ============================================================================
// Private Functions
// ============================================================================

async function handleSubmit(): Promise<void> {
  const emailInput = document.getElementById('waitlist-email') as HTMLInputElement
  const nameInput = document.getElementById('waitlist-name') as HTMLInputElement
  const statusEl = document.getElementById('waitlist-status')
  const submitBtn = document.getElementById('waitlist-submit') as HTMLButtonElement

  const email = emailInput?.value.trim()
  const name = nameInput?.value.trim() || null

  if (!email) return

  // Basic email validation
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    if (statusEl) {
      statusEl.textContent = 'Please enter a valid email address.'
      statusEl.className = 'waitlist-status waitlist-error'
    }
    return
  }

  // Disable button
  if (submitBtn) {
    submitBtn.disabled = true
    submitBtn.textContent = 'Joining...'
  }

  try {
    const { error } = await supabase
      .from('waitlist')
      .insert({ email, name })

    if (error) {
      if (error.code === '23505') {
        // Unique constraint - already signed up
        if (statusEl) {
          statusEl.textContent = 'You\'re already on the list! 🎉'
          statusEl.className = 'waitlist-status waitlist-success'
        }
        markSignedUp()
      } else {
        throw error
      }
    } else {
      if (statusEl) {
        statusEl.textContent = 'You\'re in! We\'ll be in touch soon. 🚀'
        statusEl.className = 'waitlist-status waitlist-success'
      }
      markSignedUp()
    }

    // Auto-close after success
    setTimeout(() => closeWaitlistModal(), 2500)
  } catch (err) {
    console.error('[Waitlist] Error:', err)
    if (statusEl) {
      statusEl.textContent = 'Something went wrong. Please try again.'
      statusEl.className = 'waitlist-status waitlist-error'
    }
    if (submitBtn) {
      submitBtn.disabled = false
      submitBtn.textContent = 'Join the Waitlist'
    }
  }
}

function markSignedUp(): void {
  localStorage.setItem('vibecraft2-waitlist-signed-up', 'true')
  const fab = document.getElementById('waitlist-fab')
  if (fab) {
    fab.classList.add('signed-up')
    fab.innerHTML = '<span class="fab-icon">✓</span><span class="fab-label">Joined!</span>'
    fab.title = 'You\'re on the waitlist!'
  }
}
