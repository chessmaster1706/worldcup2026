// World Cup 2026 Knockout Bracket Data Structure
// 32 teams, mirror layout: Left half (R32 → R16 → QF → SF) meets Right half at the Final

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
}

// 32 plausible Round-of-32 participants for World Cup 2026
// Ordered so that the bracket reads naturally (top seed vs runner-up pattern)
export const INITIAL_TEAMS: Record<string, [string, string]> = {
  // LEFT side — Round of 32 (8 matches, top to bottom)
  'r32-L-1': ['Argentina', 'Australia'],
  'r32-L-2': ['Spain', 'Morocco'],
  'r32-L-3': ['France', 'Ecuador'],
  'r32-L-4': ['England', 'Paraguay'],
  'r32-L-5': ['Brazil', 'South Korea'],
  'r32-L-6': ['Netherlands', 'Iran'],
  'r32-L-7': ['Portugal', 'Uruguay'],
  'r32-L-8': ['Germany', 'Colombia'],
  // RIGHT side — Round of 32 (8 matches, top to bottom)
  'r32-R-1': ['Mexico', 'Japan'],
  'r32-R-2': ['Italy', 'USA'],
  'r32-R-3': ['Belgium', 'Canada'],
  'r32-R-4': ['Croatia', 'Costa Rica'],
  'r32-R-5': ['Switzerland', 'Senegal'],
  'r32-R-6': ['Denmark', 'Nigeria'],
  'r32-R-7': ['Poland', 'Egypt'],
  'r32-R-8': ['Sweden', 'Cameroon'],
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

// Build the 31-match bracket with proper progression links
export function buildInitialBracket(): Match[] {
  const matches: Match[] = []

  // Helper to create a match
  const make = (
    id: string,
    round: Round,
    side: Side,
    position: number,
    nextMatchId: string | null,
    nextSlot: Slot | null,
    team1: string | null = null,
    team2: string | null = null,
  ): Match => ({ id, round, side, position, team1, team2, winner: null, nextMatchId, nextSlot })

  // ===== ROUND OF 32 (16 matches) =====
  // LEFT side: 8 matches
  for (let i = 1; i <= 8; i++) {
    const teams = INITIAL_TEAMS[`r32-L-${i}`] ?? [null, null]
    matches.push(make(`r32-L-${i}`, 'r32', 'left', i, `r16-L-${Math.ceil(i / 2)}`, i % 2 === 1 ? 'team1' : 'team2', teams[0], teams[1]))
  }
  // RIGHT side: 8 matches
  for (let i = 1; i <= 8; i++) {
    const teams = INITIAL_TEAMS[`r32-R-${i}`] ?? [null, null]
    matches.push(make(`r32-R-${i}`, 'r32', 'right', i, `r16-R-${Math.ceil(i / 2)}`, i % 2 === 1 ? 'team1' : 'team2', teams[0], teams[1]))
  }

  // ===== ROUND OF 16 (8 matches) =====
  // LEFT: 4 matches
  for (let i = 1; i <= 4; i++) {
    matches.push(make(`r16-L-${i}`, 'r16', 'left', i, `qf-L-${Math.ceil(i / 2)}`, i % 2 === 1 ? 'team1' : 'team2'))
  }
  // RIGHT: 4 matches
  for (let i = 1; i <= 4; i++) {
    matches.push(make(`r16-R-${i}`, 'r16', 'right', i, `qf-R-${Math.ceil(i / 2)}`, i % 2 === 1 ? 'team1' : 'team2'))
  }

  // ===== QUARTERFINALS (4 matches) =====
  // LEFT: 2 matches
  for (let i = 1; i <= 2; i++) {
    matches.push(make(`qf-L-${i}`, 'qf', 'left', i, `sf-L-1`, i === 1 ? 'team1' : 'team2'))
  }
  // RIGHT: 2 matches
  for (let i = 1; i <= 2; i++) {
    matches.push(make(`qf-R-${i}`, 'qf', 'right', i, `sf-R-1`, i === 1 ? 'team1' : 'team2'))
  }

  // ===== SEMIFINALS (2 matches) =====
  matches.push(make(`sf-L-1`, 'sf', 'left', 1, `final-1`, 'team1'))
  matches.push(make(`sf-R-1`, 'sf', 'right', 1, `final-1`, 'team2'))

  // ===== FINAL (1 match) =====
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
