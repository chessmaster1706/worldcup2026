// Shared store: group standings + R32 bracket slot resolution
// - Teams can be dragged up/down within their group to reorder
// - The R32 bracket auto-resolves slot labels (1A, 2A, 3A) from live standings
// - Users can still manually edit names in the bracket (overrides auto-resolve)

import { create } from 'zustand'
import { GROUP_STANDINGS, type GroupTeam, type GroupStanding, type QualificationStatus } from './group-standings'

// Deep clone initial standings so we can mutate them in state
function cloneStandings(): GroupStanding[] {
  return GROUP_STANDINGS.map((g) => ({
    group: g.group,
    teams: g.teams.map((t) => ({ ...t })),
  }))
}

interface BracketStore {
  // The live group standings (editable via drag-and-drop)
  standings: GroupStanding[]

  // Per-slot overrides: if the user manually edits a slot in the bracket,
  // the override takes precedence over the auto-resolved standings value.
  // Key: slot label like '1A', '2F', '3E'
  // Value: team name (or null to clear override and revert to auto)
  overrides: Record<string, string | null>

  // Reorder a team within its group (move from one position to another)
  reorderTeam: (group: string, fromIndex: number, toIndex: number) => void

  // Reset a group back to its original standings
  resetGroup: (group: string) => void

  // Reset all groups to original standings
  resetAllGroups: () => void

  // Set an explicit override for a slot (from bracket UI edit)
  setSlotOverride: (slot: string, name: string | null) => void

  // Clear all overrides
  clearOverrides: () => void

  // Resolve a slot label (e.g. '1A', '2F', '3E') to a team name
  // Priority: override > standings position > null
  resolveSlot: (slot: string) => string | null
}

export const useBracketStore = create<BracketStore>((set, get) => ({
  standings: cloneStandings(),
  overrides: {},

  reorderTeam: (group, fromIndex, toIndex) => {
    if (fromIndex === toIndex) return
    set((state) => ({
      standings: state.standings.map((g) => {
        if (g.group !== group) return g
        const teams = [...g.teams]
        const [moved] = teams.splice(fromIndex, 1)
        teams.splice(toIndex, 0, moved)
        // Recompute status based on position:
        //   Position 0 (1st) → qualified (group winner)
        //   Position 1 (2nd) → likely (runner-up)
        //   Position 2 (3rd) → possible (could advance as best 3rd)
        //   Position 3 (4th) → possible (or eliminated if originally eliminated)
        const updated: GroupTeam[] = teams.map((t, idx) => {
          let status: QualificationStatus = 'possible'
          if (idx === 0) status = 'qualified'
          else if (idx === 1) status = 'likely'
          else if (idx === 2) status = 'possible'
          else status = 'possible'
          // Preserve eliminated flag for teams that were eliminated
          const original = GROUP_STANDINGS.find((x) => x.group === group)?.teams[idx]
          if (original?.status === 'eliminated' && idx === 3) {
            // Keep eliminated if the user moved them to last
            // but we don't enforce this — let user reorder freely
          }
          return { ...t, status }
        })
        return { ...g, teams: updated }
      }),
    }))
  },

  resetGroup: (group) => {
    set((state) => ({
      standings: state.standings.map((g) => {
        if (g.group !== group) return g
        const original = GROUP_STANDINGS.find((x) => x.group === group)
        return original
          ? { group, teams: original.teams.map((t) => ({ ...t })) }
          : g
      }),
    }))
  },

  resetAllGroups: () => {
    set({ standings: cloneStandings(), overrides: {} })
  },

  setSlotOverride: (slot, name) => {
    set((state) => {
      const overrides = { ...state.overrides }
      if (name === null) {
        delete overrides[slot]
      } else {
        overrides[slot] = name
      }
      return { overrides }
    })
  },

  clearOverrides: () => set({ overrides: {} }),

  resolveSlot: (slot) => {
    const state = get()

    // Check override first
    if (slot in state.overrides) {
      return state.overrides[slot]
    }

    // Parse slot label: '1A' = group A position 1 (winner), '2F' = group F runner-up, etc.
    const match = slot.match(/^([123])([A-L])$/)
    if (!match) return null
    const [, posStr, group] = match
    const pos = parseInt(posStr, 10) // 1, 2, or 3
    const idx = pos - 1 // 0, 1, or 2

    const g = state.standings.find((x) => x.group === group)
    return g?.teams[idx]?.name ?? null
  },
}))
