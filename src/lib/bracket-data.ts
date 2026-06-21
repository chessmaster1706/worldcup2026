// World Cup 2026 Knockout Bracket Data Structure
// 32 teams: 12 group winners + 12 runners-up + 8 best 3rd-place teams
// 16 R32 matches → 8 R16 → 4 QF → 2 SF → 1 Final
//
// Mirror layout:
//   LEFT side: 8 R32 matches → 4 R16 → 2 QF → 1 SF
//   RIGHT side: 8 R32 matches → 4 R16 → 2 QF → 1 SF
//   Final at center: left SF winner vs right SF winner
//
// === FIFA OFFICIAL R32 SCHEDULE (Match 73-88) ===
//
// LEFT side (matches 73-80, feeding R16-L-1..4):
//   M73 (r32-L-1): 2A vs 2B            → R16-L-1
//   M74 (r32-L-2): 1E vs 3rd(A/B/C/D/F)→ R16-L-1
//   M75 (r32-L-3): 1F vs 2C            → R16-L-2
//   M76 (r32-L-4): 1C vs 2F            → R16-L-2
//   M77 (r32-L-5): 1I vs 3rd(C/D/F/G/H)→ R16-L-3
//   M78 (r32-L-6): 2E vs 2I            → R16-L-3
//   M79 (r32-L-7): 1A vs 3rd(C/E/F/H/I)→ R16-L-4
//   M80 (r32-L-8): 1L vs 3rd(E/H/I/J/K)→ R16-L-4
//
// RIGHT side (matches 81-88, feeding R16-R-1..4):
//   M81 (r32-R-1): 1D vs 3rd(B/E/F/I/J)→ R16-R-1
//   M82 (r32-R-2): 1G vs 3rd(A/E/H/I/J)→ R16-R-1
//   M83 (r32-R-3): 2K vs 2L            → R16-R-2
//   M84 (r32-R-4): 1H vs 2J            → R16-R-2
//   M85 (r32-R-5): 1B vs 3rd(E/F/G/I/J)→ R16-R-3
//   M86 (r32-R-6): 1J vs 2H            → R16-R-3
//   M87 (r32-R-7): 1K vs 3rd(D/E/I/J/L)→ R16-R-4
//   M88 (r32-R-8): 2D vs 2G            → R16-R-4

import { DEFAULT_SCENARIO, WINNERS_VS_RUNNERUP, RUNNERUP_VS_RUNNERUP, THIRD_PLACE_CONSTRAINTS } from './third-place-scenarios'
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
  // FIFA match number (73-88 for R32) — for display
  fifaMatchNumber?: number
  // Human-readable constraint for 3rd-place slots, e.g. "Best 3rd of A/B/C/D/F"
  slot1Constraint?: string
  slot2Constraint?: string
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

// Slot definitions for R32 matches (FIFA official schedule)
// Structure only — team names are filled in by applyStandingsToBracket + the store's resolver
interface R32SlotDef {
  id: string
  side: 'left' | 'right'
  pos: number
  slot1: string
  slot2: string
  fifaMatchNumber: number
  // Optional constraint label for 3rd-place slots, e.g. "3rd(A/B/C/D/F)"
  slot1Constraint?: string
  slot2Constraint?: string
}

// Helper to format the 3rd-place constraint label
function thirdLabel(winnerSlot: string): string | undefined {
  const groups = THIRD_PLACE_CONSTRAINTS[winnerSlot]
  if (!groups) return undefined
  return `3rd(${groups.join('/')})`
}

// LEFT side — FIFA matches 73-80
// Pairing: (73,74)→R16-L-1, (75,76)→R16-L-2, (77,78)→R16-L-3, (79,80)→R16-L-4
export const LEFT_R32_SLOTS: R32SlotDef[] = [
  // M73: 2A vs 2B
  { id: 'r32-L-1', side: 'left', pos: 1, fifaMatchNumber: 73, slot1: '2A', slot2: '2B' },
  // M74: 1E vs 3rd(A/B/C/D/F)
  { id: 'r32-L-2', side: 'left', pos: 2, fifaMatchNumber: 74, slot1: '1E', slot2: DEFAULT_SCENARIO.assignments['1E'], slot2Constraint: thirdLabel('1E') },
  // M75: 1F vs 2C
  { id: 'r32-L-3', side: 'left', pos: 3, fifaMatchNumber: 75, slot1: '1F', slot2: WINNERS_VS_RUNNERUP['1F'] },
  // M76: 1C vs 2F
  { id: 'r32-L-4', side: 'left', pos: 4, fifaMatchNumber: 76, slot1: '1C', slot2: WINNERS_VS_RUNNERUP['1C'] },
  // M77: 1I vs 3rd(C/D/F/G/H)
  { id: 'r32-L-5', side: 'left', pos: 5, fifaMatchNumber: 77, slot1: '1I', slot2: DEFAULT_SCENARIO.assignments['1I'], slot2Constraint: thirdLabel('1I') },
  // M78: 2E vs 2I
  { id: 'r32-L-6', side: 'left', pos: 6, fifaMatchNumber: 78, slot1: '2E', slot2: '2I' },
  // M79: 1A vs 3rd(C/E/F/H/I)
  { id: 'r32-L-7', side: 'left', pos: 7, fifaMatchNumber: 79, slot1: '1A', slot2: DEFAULT_SCENARIO.assignments['1A'], slot2Constraint: thirdLabel('1A') },
  // M80: 1L vs 3rd(E/H/I/J/K)
  { id: 'r32-L-8', side: 'left', pos: 8, fifaMatchNumber: 80, slot1: '1L', slot2: DEFAULT_SCENARIO.assignments['1L'], slot2Constraint: thirdLabel('1L') },
]

// RIGHT side — FIFA matches 81-88
// Pairing: (81,82)→R16-R-1, (83,84)→R16-R-2, (85,86)→R16-R-3, (87,88)→R16-R-4
export const RIGHT_R32_SLOTS: R32SlotDef[] = [
  // M81: 1D vs 3rd(B/E/F/I/J)
  { id: 'r32-R-1', side: 'right', pos: 1, fifaMatchNumber: 81, slot1: '1D', slot2: DEFAULT_SCENARIO.assignments['1D'], slot2Constraint: thirdLabel('1D') },
  // M82: 1G vs 3rd(A/E/H/I/J)
  { id: 'r32-R-2', side: 'right', pos: 2, fifaMatchNumber: 82, slot1: '1G', slot2: DEFAULT_SCENARIO.assignments['1G'], slot2Constraint: thirdLabel('1G') },
  // M83: 2K vs 2L
  { id: 'r32-R-3', side: 'right', pos: 3, fifaMatchNumber: 83, slot1: '2K', slot2: '2L' },
  // M84: 1H vs 2J
  { id: 'r32-R-4', side: 'right', pos: 4, fifaMatchNumber: 84, slot1: '1H', slot2: WINNERS_VS_RUNNERUP['1H'] },
  // M85: 1B vs 3rd(E/F/G/I/J)
  { id: 'r32-R-5', side: 'right', pos: 5, fifaMatchNumber: 85, slot1: '1B', slot2: DEFAULT_SCENARIO.assignments['1B'], slot2Constraint: thirdLabel('1B') },
  // M86: 1J vs 2H
  { id: 'r32-R-6', side: 'right', pos: 6, fifaMatchNumber: 86, slot1: '1J', slot2: WINNERS_VS_RUNNERUP['1J'] },
  // M87: 1K vs 3rd(D/E/I/J/L)
  { id: 'r32-R-7', side: 'right', pos: 7, fifaMatchNumber: 87, slot1: '1K', slot2: DEFAULT_SCENARIO.assignments['1K'], slot2Constraint: thirdLabel('1K') },
  // M88: 2D vs 2G
  { id: 'r32-R-8', side: 'right', pos: 8, fifaMatchNumber: 88, slot1: '2D', slot2: '2G' },
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
// R32 matchups follow the FIFA official 2026 World Cup schedule (matches 73-88)
export function buildInitialBracket(): Match[] {
  const matches: Match[] = []

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
    fifaMatchNumber?: number,
    slot1Constraint?: string,
    slot2Constraint?: string,
  ): Match => ({
    id, round, side, position, team1, team2, winner: null,
    nextMatchId, nextSlot, slot1, slot2, fifaMatchNumber, slot1Constraint, slot2Constraint,
  })

  // ========================================================================
  // ROUND OF 32 — 16 matches (FIFA official schedule, M73-M88)
  // ========================================================================
  // Pairing into R16:
  //   LEFT:  (M73,M74)→R16-L-1, (M75,M76)→R16-L-2, (M77,M78)→R16-L-3, (M79,M80)→R16-L-4
  //   RIGHT: (M81,M82)→R16-R-1, (M83,M84)→R16-R-2, (M85,M86)→R16-R-3, (M87,M88)→R16-R-4

  for (const s of LEFT_R32_SLOTS) {
    matches.push(make(
      s.id, 'r32', 'left', s.pos,
      `r16-L-${Math.ceil(s.pos / 2)}`,
      s.pos % 2 === 1 ? 'team1' : 'team2',
      resolveSlot(s.slot1),
      resolveSlot(s.slot2),
      s.slot1, s.slot2,
      s.fifaMatchNumber,
      s.slot1Constraint,
      s.slot2Constraint,
    ))
  }

  for (const s of RIGHT_R32_SLOTS) {
    matches.push(make(
      s.id, 'r32', 'right', s.pos,
      `r16-R-${Math.ceil(s.pos / 2)}`,
      s.pos % 2 === 1 ? 'team1' : 'team2',
      resolveSlot(s.slot1),
      resolveSlot(s.slot2),
      s.slot1, s.slot2,
      s.fifaMatchNumber,
      s.slot1Constraint,
      s.slot2Constraint,
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
