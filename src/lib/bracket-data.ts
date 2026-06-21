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
function resolveSlot(slot: string): string | null {
  // Only group winners with status 'qualified' are confirmed
  // 1A = group A winner, 1B = group B winner, etc.
  const match = slot.match(/^([123])([A-L])$/)
  if (!match) return null
  const [, position, group] = match
  if (position === '1') {
    return getConfirmedWinner(group)
  }
  // Runners-up and 3rd-place teams are not yet confirmed
  return null
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
