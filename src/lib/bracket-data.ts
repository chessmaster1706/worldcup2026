// World Cup 2026 Knockout Bracket Data Structure
// 32 teams: 12 group winners + 12 runners-up + 8 best 3rd-place teams
// 16 R32 matches → 8 R16 → 4 QF → 2 SF → 1 Final
//
// Mirror layout:
//   LEFT side: 8 R32 matches → 4 R16 → 2 QF → 1 SF
//   RIGHT side: 8 R32 matches → 4 R16 → 2 QF → 1 SF
//   Final at center: left SF winner vs right SF winner
//
// R32 match composition (based on FIFA's published bracket + CSV scenario):
//   - 8 matches: group winner vs 3rd-place team
//       (1A, 1B, 1D, 1E, 1G, 1I, 1K, 1L play 3rd-place teams)
//   - 4 matches: group winner vs runner-up
//       (1C vs 2F, 1F vs 2E, 1H vs 2G, 1J vs 2K)
//   - 4 matches: runner-up vs runner-up
//       (2A vs 2B, 2C vs 2D, 2H vs 2I, 2J vs 2L)

import { DEFAULT_SCENARIO, WINNERS_VS_RUNNERUP, RUNNERUP_VS_RUNNERUP } from './third-place-scenarios'
import { getConfirmedWinner } from './group-standings'

export type Round = 'r32' | 'r16' | 'qf' | 'sf' | 'final'
export type Side = 'left' | 'right' | 'final'
export type Slot = 'team1' | 'team2'

export interface Match {
  id: string
  round: Round
  side: Side
  position: number // position within the round (and side)
  team1: string | null
  team2: string | null
  winner: string | null
  nextMatchId: string | null
  nextSlot: Slot | null
  // Slot labels for R32 matches (e.g. '1A', '3E', '2F')
  // Used to show the group-stage slot the team comes from
  slot1?: string
  slot2?: string
}

export const ROUND_LABELS: Record<Round, string> = {
  r32: 'Round of 32',
  r16: 'Round of 16',
  qf: 'Quarterfinals',
  sf: 'Semifinals',
  final: 'Final',
}

export const ROUND_SHORT: Record<Round, string> = {
  r32: 'R32',
  r16: 'R16',
  qf: 'QF',
  sf: 'SF',
  final: 'F',
}

// Resolve a slot label (e.g. '1A', '2F', '3E') to a team name if confirmed, else null
// This is the INITIAL resolver — uses only confirmed group winners from static standings.
// For live updates after drag-and-drop, use `applyStandingsToBracket` with the store's resolver.
function resolveSlot(slot: string): string | null {
  // Only group winners with status 'qualified' are confirmed at initial load
  const match = slot.match(/^([123])([A-L])$/)
  if (!match) return null
  const [, position, group] = match
  if (position === '1') {
    return getConfirmedWinner(group)
  }
  return null
}

// Slot definitions for R32 matches (structure only — no team names)
// This is the FIFA-published 2026 World Cup bracket structure
interface R32SlotDef {
  id: string
  side: 'left' | 'right'
  pos: number
  slot1: string
  slot2: string
}

export const LEFT_R32_SLOTS: R32SlotDef[] = [
  { id: 'r32-L-1', side: 'left', pos: 1, slot1: '1A', slot2: DEFAULT_SCENARIO.assignments['1A'] },
  { id: 'r32-L-2', side: 'left', pos: 2, slot1: '2A', slot2: '2B' },
  { id: 'r32-L-3', side: 'left', pos: 3, slot1: '1C', slot2: WINNERS_VS_RUNNERUP['1C'] },
  { id: 'r32-L-4', side: 'left', pos: 4, slot1: '1B', slot2: DEFAULT_SCENARIO.assignments['1B'] },
  { id: 'r32-L-5', side: 'left', pos: 5, slot1: '1D', slot2: DEFAULT_SCENARIO.assignments['1D'] },
  { id: 'r32-L-6', side: 'left', pos: 6, slot1: '2C', slot2: '2D' },
  { id: 'r32-L-7', side: 'left', pos: 7, slot1: '1E', slot2: DEFAULT_SCENARIO.assignments['1E'] },
  { id: 'r32-L-8', side: 'left', pos: 8, slot1: '1G', slot2: DEFAULT_SCENARIO.assignments['1G'] },
]

export const RIGHT_R32_SLOTS: R32SlotDef[] = [
  { id: 'r32-R-1', side: 'right', pos: 1, slot1: '1F', slot2: WINNERS_VS_RUNNERUP['1F'] },
  { id: 'r32-R-2', side: 'right', pos: 2, slot1: '2H', slot2: '2I' },
  { id: 'r32-R-3', side: 'right', pos: 3, slot1: '1H', slot2: WINNERS_VS_RUNNERUP['1H'] },
  { id: 'r32-R-4', side: 'right', pos: 4, slot1: '1I', slot2: DEFAULT_SCENARIO.assignments['1I'] },
  { id: 'r32-R-5', side: 'right', pos: 5, slot1: '2J', slot2: '2L' },
  { id: 'r32-R-6', side: 'right', pos: 6, slot1: '1J', slot2: WINNERS_VS_RUNNERUP['1J'] },
  { id: 'r32-R-7', side: 'right', pos: 7, slot1: '1K', slot2: DEFAULT_SCENARIO.assignments['1K'] },
  { id: 'r32-R-8', side: 'right', pos: 8, slot1: '1L', slot2: DEFAULT_SCENARIO.assignments['1L'] },
]

// Apply live standings to an existing bracket's R32 matches.
// - `resolver` is a function that maps slot labels to team names (from the store).
// - Only updates R32 matches; preserves winners and downstream teams where possible.
// - If a slot's team changes and the old team was a winner, the winner is cleared
//   (along with downstream occurrences) — but manual overrides via the bracket's
//   edit feature are preserved via the store's override mechanism.
export function applyStandingsToBracket(
  matches: Match[],
  resolver: (slot: string) => string | null,
): Match[] {
  const next = matches.map((m) => ({ ...m }))
  const allR32 = [...LEFT_R32_SLOTS, ...RIGHT_R32_SLOTS]

  for (const def of allR32) {
    const idx = next.findIndex((m) => m.id === def.id)
    if (idx === -1) continue

    const match = next[idx]
    const newTeam1 = resolver(def.slot1)
    const newTeam2 = resolver(def.slot2)

    // If team1 changed and the old name was the winner, we need to clear downstream
    if (match.team1 !== newTeam1) {
      if (match.winner === match.team1 && match.team1 !== null) {
        clearDownstream(next, match.id)
      }
      next[idx] = { ...next[idx], team1: newTeam1 }
      // If winner was the old team, clear it (clearDownstream already did)
      if (next[idx].winner === match.team1) {
        next[idx].winner = null
      }
    }

    if (match.team2 !== newTeam2) {
      if (match.winner === match.team2 && match.team2 !== null) {
        clearDownstream(next, match.id)
      }
      next[idx] = { ...next[idx], team2: newTeam2 }
      if (next[idx].winner === match.team2) {
        next[idx].winner = null
      }
    }

    // Re-propagate winner to next match if it exists
    const updated = next[idx]
    if (updated.winner && updated.nextMatchId && updated.nextSlot) {
      const nextIdx = next.findIndex((m) => m.id === updated.nextMatchId)
      if (nextIdx !== -1) {
        next[nextIdx] = { ...next[nextIdx], [updated.nextSlot]: updated.winner }
      }
    }
  }

  return next
}

// Build the 31-match bracket with proper progression links
// Uses DEFAULT_SCENARIO (scenario 1 from the CSV) for 3rd-place assignments
export function buildInitialBracket(): Match[] {
  const matches: Match[] = []
  const scenario = DEFAULT_SCENARIO

  const make = (
    id: string,
    round: Round,
    side: Side,
    position: number,
    nextMatchId: string | null,
    nextSlot: Slot | null,
    team1: string | null = null,
    team2: string | null = null,
    slot1?: string,
    slot2?: string,
  ): Match => ({ id, round, side, position, team1, team2, winner: null, nextMatchId, nextSlot, slot1, slot2 })

  // ========================================================================
  // ROUND OF 32 — 16 matches
  // ========================================================================
  // LEFT side (8 matches, top to bottom):
  //   L1: 1A vs 3E    L2: 2A vs 2B    L3: 1C vs 2F    L4: 1B vs 3J
  //   L5: 1D vs 3I    L6: 2C vs 2D    L7: 1E vs 3F    L8: 1G vs 3H
  //
  // RIGHT side (8 matches, top to bottom):
  //   R1: 1F vs 2E    R2: 2H vs 2I    R3: 1H vs 2G    R4: 1I vs 3G
  //   R5: 2J vs 2L    R6: 1J vs 2K    R7: 1K vs 3L    R8: 1L vs 3K

  // LEFT R32
  const leftR32Slots: Array<{ id: string; pos: number; slot1: string; slot2: string }> = [
    { id: 'r32-L-1', pos: 1, slot1: '1A', slot2: scenario.assignments['1A'] }, // 1A vs 3E
    { id: 'r32-L-2', pos: 2, slot1: '2A', slot2: '2B' },
    { id: 'r32-L-3', pos: 3, slot1: '1C', slot2: WINNERS_VS_RUNNERUP['1C'] }, // 1C vs 2F
    { id: 'r32-L-4', pos: 4, slot1: '1B', slot2: scenario.assignments['1B'] }, // 1B vs 3J
    { id: 'r32-L-5', pos: 5, slot1: '1D', slot2: scenario.assignments['1D'] }, // 1D vs 3I
    { id: 'r32-L-6', pos: 6, slot1: '2C', slot2: '2D' },
    { id: 'r32-L-7', pos: 7, slot1: '1E', slot2: scenario.assignments['1E'] }, // 1E vs 3F
    { id: 'r32-L-8', pos: 8, slot1: '1G', slot2: scenario.assignments['1G'] }, // 1G vs 3H
  ]
  for (const s of leftR32Slots) {
    matches.push(make(
      s.id, 'r32', 'left', s.pos,
      `r16-L-${Math.ceil(s.pos / 2)}`,
      s.pos % 2 === 1 ? 'team1' : 'team2',
      resolveSlot(s.slot1),
      resolveSlot(s.slot2),
      s.slot1, s.slot2,
    ))
  }

  // RIGHT R32
  const rightR32Slots: Array<{ id: string; pos: number; slot1: string; slot2: string }> = [
    { id: 'r32-R-1', pos: 1, slot1: '1F', slot2: WINNERS_VS_RUNNERUP['1F'] }, // 1F vs 2E
    { id: 'r32-R-2', pos: 2, slot1: '2H', slot2: '2I' },
    { id: 'r32-R-3', pos: 3, slot1: '1H', slot2: WINNERS_VS_RUNNERUP['1H'] }, // 1H vs 2G
    { id: 'r32-R-4', pos: 4, slot1: '1I', slot2: scenario.assignments['1I'] }, // 1I vs 3G
    { id: 'r32-R-5', pos: 5, slot1: '2J', slot2: '2L' },
    { id: 'r32-R-6', pos: 6, slot1: '1J', slot2: WINNERS_VS_RUNNERUP['1J'] }, // 1J vs 2K
    { id: 'r32-R-7', pos: 7, slot1: '1K', slot2: scenario.assignments['1K'] }, // 1K vs 3L
    { id: 'r32-R-8', pos: 8, slot1: '1L', slot2: scenario.assignments['1L'] }, // 1L vs 3K
  ]
  for (const s of rightR32Slots) {
    matches.push(make(
      s.id, 'r32', 'right', s.pos,
      `r16-R-${Math.ceil(s.pos / 2)}`,
      s.pos % 2 === 1 ? 'team1' : 'team2',
      resolveSlot(s.slot1),
      resolveSlot(s.slot2),
      s.slot1, s.slot2,
    ))
  }

  // ========================================================================
  // ROUND OF 16 — 8 matches
  // ========================================================================
  for (let i = 1; i <= 4; i++) {
    matches.push(make(`r16-L-${i}`, 'r16', 'left', i, `qf-L-${Math.ceil(i / 2)}`, i % 2 === 1 ? 'team1' : 'team2'))
  }
  for (let i = 1; i <= 4; i++) {
    matches.push(make(`r16-R-${i}`, 'r16', 'right', i, `qf-R-${Math.ceil(i / 2)}`, i % 2 === 1 ? 'team1' : 'team2'))
  }

  // ========================================================================
  // QUARTERFINALS — 4 matches
  // ========================================================================
  for (let i = 1; i <= 2; i++) {
    matches.push(make(`qf-L-${i}`, 'qf', 'left', i, `sf-L-1`, i === 1 ? 'team1' : 'team2'))
  }
  for (let i = 1; i <= 2; i++) {
    matches.push(make(`qf-R-${i}`, 'qf', 'right', i, `sf-R-1`, i === 1 ? 'team1' : 'team2'))
  }

  // ========================================================================
  // SEMIFINALS — 2 matches
  // ========================================================================
  matches.push(make(`sf-L-1`, 'sf', 'left', 1, `final-1`, 'team1'))
  matches.push(make(`sf-R-1`, 'sf', 'right', 1, `final-1`, 'team2'))

  // ========================================================================
  // FINAL — 1 match
  // ========================================================================
  matches.push(make(`final-1`, 'final', 'final', 1, null, null))

  return matches
}

// Find a match by id
export function getMatchById(matches: Match[], id: string): Match | undefined {
  return matches.find((m) => m.id === id)
}

// Champion is the winner of the final
export function getChampion(matches: Match[]): string | null {
  const final = getMatchById(matches, 'final-1')
  return final?.winner ?? null
}

// Helper: recursively clear winners downstream from a match
// Used when a team is removed/changed and was previously the winner
export function clearDownstream(matches: Match[], matchId: string): void {
  const match = matches.find((m) => m.id === matchId)
  if (!match) return

  const idx = matches.findIndex((m) => m.id === matchId)
  if (idx !== -1) {
    matches[idx] = { ...matches[idx], winner: null }
  }

  if (match.nextMatchId && match.nextSlot) {
    const nextIdx = matches.findIndex((m) => m.id === match.nextMatchId)
    if (nextIdx !== -1) {
      const nextMatch = matches[nextIdx]
      matches[nextIdx] = {
        ...nextMatch,
        [match.nextSlot]: null,
        winner: null,
      }
      clearDownstream(matches, nextMatch.id)
    }
  }
}
