

# Mobile-First Demo Experience

## Problem
On mobile, the 3D scene and activity feed each get only ~50% of the screen, making both feel cramped. There's no way to focus on one at a time, the demo bar overflows, and useful context (timeline, phases) is hidden. For someone trying to learn how agents work, this creates a frustrating experience rather than a fun one.

## Solution: Swipeable Full-Screen Panels with Mobile Tab Bar

Transform the mobile demo experience into an app-like interface where users can switch between full-screen views of the 3D scene and the activity feed.

### 1. Mobile Tab Bar (bottom navigation)
Add a fixed bottom tab bar on phones (640px and below) with three tabs:
- **Scene** (3D view icon) -- full-screen 3D scene with demo overlay
- **Feed** (activity icon) -- full-screen activity feed with sessions
- **Info** (lightbulb icon) -- scenario description, "watch for" tips, and current phase

When a tab is active, only that panel is shown at 100vh, giving each view maximum real estate.

### 2. Scene View Improvements
- Show the demo progress bar and phase banner (currently hidden on small screens)
- Add a floating "what's happening" pill that shows the current phase name, tappable to switch to the Info tab
- Keep the compact HUD but restore the timeline in a minimal horizontal strip above the tab bar

### 3. Feed View Improvements  
- Full-height feed with the session switcher as a compact horizontal scroll strip at the top
- Larger, more readable feed items with better touch targets
- The prompt area stays at the bottom above the tab bar

### 4. Info Tab (new, mobile-only)
- Shows the scenario's intro content (title, description, agent count, "watch for" list) persistently so users can reference it anytime
- Displays the current phase and progress
- Shows the scenario picker buttons so users can switch demos
- This replaces the auto-dismissing intro card on mobile -- the card still appears but the content lives here permanently

### 5. Swipe Gestures
- Horizontal swipe between Scene and Feed tabs for quick switching
- Visual indicator dots showing which panel is active

### 6. Demo Card Improvements
- On mobile, the intro card becomes a bottom sheet that slides up instead of a centered overlay
- Tapping "Start" slides it down and switches to the Scene tab
- Summary card also uses bottom sheet pattern

## Technical Details

### Files to modify:
- **`src/styles/mobile.css`** -- Major additions: tab bar styles, full-screen panel modes, bottom sheet cards, swipe indicators, Info tab layout. All within `@media (max-width: 640px)` block.
- **`index.html`** -- Add the mobile tab bar HTML (`#mobile-tab-bar` with 3 tab buttons) and the Info panel (`#mobile-info-panel`) inside `#app`.
- **`src/main.ts`** -- Initialize the mobile tab controller on small screens; wire up tab clicks and swipe gestures.
- **`src/ui/MobileTabController.ts`** (new file) -- Class that manages tab switching: toggles `display` on `#scene-panel`, `#feed-panel`, `#mobile-info-panel`; handles touch swipe detection; syncs current phase/scenario info to the Info tab; manages active tab state.
- **`src/ui/DemoCards.ts`** -- On mobile, render intro/summary as bottom sheets (add `mobile-bottom-sheet` class, animate from bottom).
- **`src/demo/DemoMode.ts`** -- Pass phase updates to the MobileTabController so the Info tab stays current.

### Tab switching logic:
```text
+------------------+    +------------------+    +------------------+
|                  |    |   Session Strip   |    |  Scenario Title  |
|   3D Scene       |    |   Activity Feed   |    |  Description     |
|   (full height)  |    |   (scrollable)    |    |  Watch For...    |
|                  |    |                   |    |  Current Phase   |
|   Phase pill     |    |                   |    |  [Switch Demo]   |
|                  |    |   Prompt Bar      |    |                  |
+------------------+    +------------------+    +------------------+
| Scene | Feed | Info |  | Scene | Feed | Info |  | Scene | Feed | Info |
+------------------+    +------------------+    +------------------+
```

### Swipe detection:
- Track `touchstart` and `touchend` X coordinates
- Threshold: 50px horizontal swipe
- Switch to adjacent tab on swipe left/right

### CSS approach:
- On phones, `#scene-panel` and `#feed-panel` become `position: absolute; inset: 0; height: calc(100vh - 52px)` (52px for tab bar)
- Hidden panels get `display: none`
- Active panel gets `display: flex`
- Tab bar is `position: fixed; bottom: 0; height: 52px`
- Body gets `padding-bottom: 52px` on mobile to prevent content behind tab bar

### Notification dot on tabs:
- When new activity arrives while viewing the Scene tab, show a pulsing dot on the Feed tab
- When a phase changes while viewing the Feed tab, show a dot on the Scene tab
- Creates a sense of "things are happening" that draws users to explore both views

