/**
 * HexArtAPI - Pure API layer for hex art (collaborative canvas)
 *
 * All functions are pure HTTP calls with no DOM/state dependencies.
 */

import type { HexArtState } from '../../shared/types'

export interface SimpleResponse {
  ok: boolean
  error?: string
}

/**
 * Create a HexArtAPI instance bound to a specific API URL
 */
export function createHexArtAPI(apiUrl: string) {
  return {
    /**
     * Get full hex art state from server
     */
    async getHexArt(): Promise<HexArtState> {
      try {
        const response = await fetch(`${apiUrl}/hexart`)
        const data = await response.json()
        return {
          hexes: data.hexes || [],
          zoneElevations: data.zoneElevations || {},
        }
      } catch (e) {
        console.error('Error fetching hex art:', e)
        return { hexes: [], zoneElevations: {} }
      }
    },

    /**
     * Upload full hex art state (for migration from localStorage)
     */
    async uploadHexArt(state: HexArtState): Promise<boolean> {
      try {
        const response = await fetch(`${apiUrl}/hexart`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(state),
        })
        const data = await response.json()
        return data.ok === true
      } catch (e) {
        console.error('Error uploading hex art:', e)
        return false
      }
    },

    /**
     * Clear all hex art on server
     */
    async clearHexArt(): Promise<boolean> {
      try {
        const response = await fetch(`${apiUrl}/hexart`, {
          method: 'DELETE',
        })
        const data = await response.json()
        return data.ok === true
      } catch (e) {
        console.error('Error clearing hex art:', e)
        return false
      }
    },
  }
}

export type HexArtAPI = ReturnType<typeof createHexArtAPI>
