// World Cup 2026 Group Stage Standings
// 12 groups (A-L) of 4 teams each
// Updated through June 20, 2026 (groups A-F have played 2 of 3 matchdays; G-L have played 1 of 3)

export type QualificationStatus =
  | 'qualified'      // Group winner confirmed
  | 'likely'         // Assured of top 3 (X marker)
  | 'possible'       // Could still qualify
  | 'eliminated'     // (E marker)

export interface GroupTeam {
  name: string
  played: number
  won: number
  drawn: number
  lost: number
  gf: number
  ga: number
  gd: number
  pts: number
  status: QualificationStatus
  note?: string // (H), (A), (X), (E) markers
}

export interface GroupStanding {
  group: string // 'A' through 'L'
  teams: GroupTeam[] // sorted by position (1st to 4th)
}

export const GROUP_STANDINGS: GroupStanding[] = [
  {
    group: 'A',
    teams: [
      { name: 'Mexico', played: 2, won: 2, drawn: 0, lost: 0, gf: 3, ga: 0, gd: 3, pts: 6, status: 'qualified', note: 'H, A' },
      { name: 'South Korea', played: 2, won: 1, drawn: 0, lost: 1, gf: 2, ga: 2, gd: 0, pts: 3, status: 'possible' },
      { name: 'Czech Republic', played: 2, won: 0, drawn: 1, lost: 1, gf: 2, ga: 3, gd: -1, pts: 1, status: 'possible' },
      { name: 'South Africa', played: 2, won: 0, drawn: 1, lost: 1, gf: 1, ga: 3, gd: -2, pts: 1, status: 'possible' },
    ],
  },
  {
    group: 'B',
    teams: [
      { name: 'Canada', played: 2, won: 1, drawn: 1, lost: 0, gf: 7, ga: 1, gd: 6, pts: 4, status: 'likely', note: 'H, X' },
      { name: 'Switzerland', played: 2, won: 1, drawn: 1, lost: 0, gf: 5, ga: 2, gd: 3, pts: 4, status: 'likely', note: 'X' },
      { name: 'Bosnia and Herzegovina', played: 2, won: 0, drawn: 1, lost: 1, gf: 2, ga: 5, gd: -3, pts: 1, status: 'possible' },
      { name: 'Qatar', played: 2, won: 0, drawn: 1, lost: 1, gf: 1, ga: 7, gd: -6, pts: 1, status: 'possible' },
    ],
  },
  {
    group: 'C',
    teams: [
      { name: 'Brazil', played: 2, won: 1, drawn: 1, lost: 0, gf: 4, ga: 1, gd: 3, pts: 4, status: 'likely', note: 'X' },
      { name: 'Morocco', played: 2, won: 1, drawn: 1, lost: 0, gf: 2, ga: 1, gd: 1, pts: 4, status: 'likely', note: 'X' },
      { name: 'Scotland', played: 2, won: 1, drawn: 0, lost: 1, gf: 1, ga: 1, gd: 0, pts: 3, status: 'likely', note: 'X' },
      { name: 'Haiti', played: 2, won: 0, drawn: 0, lost: 2, gf: 0, ga: 4, gd: -4, pts: 0, status: 'eliminated', note: 'E' },
    ],
  },
  {
    group: 'D',
    teams: [
      { name: 'United States', played: 2, won: 2, drawn: 0, lost: 0, gf: 6, ga: 1, gd: 5, pts: 6, status: 'qualified', note: 'H, A' },
      { name: 'Australia', played: 2, won: 1, drawn: 0, lost: 1, gf: 2, ga: 2, gd: 0, pts: 3, status: 'likely', note: 'X' },
      { name: 'Paraguay', played: 2, won: 1, drawn: 0, lost: 1, gf: 2, ga: 4, gd: -2, pts: 3, status: 'likely', note: 'X' },
      { name: 'Turkey', played: 2, won: 0, drawn: 0, lost: 2, gf: 0, ga: 3, gd: -3, pts: 0, status: 'eliminated', note: 'E' },
    ],
  },
  {
    group: 'E',
    teams: [
      { name: 'Germany', played: 2, won: 2, drawn: 0, lost: 0, gf: 9, ga: 2, gd: 7, pts: 6, status: 'qualified', note: 'A' },
      { name: 'Ivory Coast', played: 2, won: 1, drawn: 0, lost: 1, gf: 2, ga: 2, gd: 0, pts: 3, status: 'possible' },
      { name: 'Ecuador', played: 2, won: 0, drawn: 1, lost: 1, gf: 0, ga: 1, gd: -1, pts: 1, status: 'possible' },
      { name: 'Curaçao', played: 2, won: 0, drawn: 1, lost: 1, gf: 1, ga: 7, gd: -6, pts: 1, status: 'possible' },
    ],
  },
  {
    group: 'F',
    teams: [
      { name: 'Netherlands', played: 2, won: 1, drawn: 1, lost: 0, gf: 7, ga: 3, gd: 4, pts: 4, status: 'likely', note: 'X' },
      { name: 'Japan', played: 2, won: 1, drawn: 1, lost: 0, gf: 6, ga: 2, gd: 4, pts: 4, status: 'likely', note: 'X' },
      { name: 'Sweden', played: 2, won: 1, drawn: 0, lost: 1, gf: 6, ga: 6, gd: 0, pts: 3, status: 'likely', note: 'X' },
      { name: 'Tunisia', played: 2, won: 0, drawn: 0, lost: 2, gf: 1, ga: 9, gd: -8, pts: 0, status: 'eliminated', note: 'E' },
    ],
  },
  {
    group: 'G',
    teams: [
      { name: 'New Zealand', played: 1, won: 0, drawn: 1, lost: 0, gf: 2, ga: 2, gd: 0, pts: 1, status: 'possible' },
      { name: 'Iran', played: 1, won: 0, drawn: 1, lost: 0, gf: 2, ga: 2, gd: 0, pts: 1, status: 'possible' },
      { name: 'Belgium', played: 1, won: 0, drawn: 1, lost: 0, gf: 1, ga: 1, gd: 0, pts: 1, status: 'possible' },
      { name: 'Egypt', played: 1, won: 0, drawn: 1, lost: 0, gf: 1, ga: 1, gd: 0, pts: 1, status: 'possible' },
    ],
  },
  {
    group: 'H',
    teams: [
      { name: 'Uruguay', played: 1, won: 0, drawn: 1, lost: 0, gf: 1, ga: 1, gd: 0, pts: 1, status: 'possible' },
      { name: 'Saudi Arabia', played: 1, won: 0, drawn: 1, lost: 0, gf: 1, ga: 1, gd: 0, pts: 1, status: 'possible' },
      { name: 'Spain', played: 1, won: 0, drawn: 1, lost: 0, gf: 0, ga: 0, gd: 0, pts: 1, status: 'possible' },
      { name: 'Cape Verde', played: 1, won: 0, drawn: 1, lost: 0, gf: 0, ga: 0, gd: 0, pts: 1, status: 'possible' },
    ],
  },
  {
    group: 'I',
    teams: [
      { name: 'Norway', played: 1, won: 1, drawn: 0, lost: 0, gf: 4, ga: 1, gd: 3, pts: 3, status: 'likely', note: 'A' },
      { name: 'France', played: 1, won: 1, drawn: 0, lost: 0, gf: 3, ga: 1, gd: 2, pts: 3, status: 'likely', note: 'A' },
      { name: 'Senegal', played: 1, won: 0, drawn: 0, lost: 1, gf: 1, ga: 3, gd: -2, pts: 0, status: 'possible' },
      { name: 'Iraq', played: 1, won: 0, drawn: 0, lost: 1, gf: 1, ga: 4, gd: -3, pts: 0, status: 'possible' },
    ],
  },
  {
    group: 'J',
    teams: [
      { name: 'Argentina', played: 1, won: 1, drawn: 0, lost: 0, gf: 3, ga: 0, gd: 3, pts: 3, status: 'likely', note: 'A' },
      { name: 'Austria', played: 1, won: 1, drawn: 0, lost: 0, gf: 3, ga: 1, gd: 2, pts: 3, status: 'likely', note: 'A' },
      { name: 'Jordan', played: 1, won: 0, drawn: 0, lost: 1, gf: 1, ga: 3, gd: -2, pts: 0, status: 'possible' },
      { name: 'Algeria', played: 1, won: 0, drawn: 0, lost: 1, gf: 0, ga: 3, gd: -3, pts: 0, status: 'possible' },
    ],
  },
  {
    group: 'K',
    teams: [
      { name: 'Colombia', played: 1, won: 1, drawn: 0, lost: 0, gf: 3, ga: 1, gd: 2, pts: 3, status: 'likely', note: 'A' },
      { name: 'DR Congo', played: 1, won: 0, drawn: 1, lost: 0, gf: 1, ga: 1, gd: 0, pts: 1, status: 'possible' },
      { name: 'Portugal', played: 1, won: 0, drawn: 1, lost: 0, gf: 1, ga: 1, gd: 0, pts: 1, status: 'possible' },
      { name: 'Uzbekistan', played: 1, won: 0, drawn: 0, lost: 1, gf: 1, ga: 3, gd: -2, pts: 0, status: 'possible' },
    ],
  },
  {
    group: 'L',
    teams: [
      { name: 'England', played: 1, won: 1, drawn: 0, lost: 0, gf: 4, ga: 2, gd: 2, pts: 3, status: 'likely', note: 'A' },
      { name: 'Ghana', played: 1, won: 1, drawn: 0, lost: 0, gf: 1, ga: 0, gd: 1, pts: 3, status: 'likely', note: 'A' },
      { name: 'Panama', played: 1, won: 0, drawn: 0, lost: 1, gf: 0, ga: 1, gd: -1, pts: 0, status: 'possible' },
      { name: 'Croatia', played: 1, won: 0, drawn: 0, lost: 1, gf: 2, ga: 4, gd: -2, pts: 0, status: 'possible' },
    ],
  },
]

// Get the confirmed group winner (status === 'qualified')
export function getConfirmedWinner(group: string): string | null {
  const g = GROUP_STANDINGS.find((x) => x.group === group)
  if (!g) return null
  const winner = g.teams.find((t) => t.status === 'qualified')
  return winner?.name ?? null
}

// Get the top team of a group (current leader, even if not confirmed)
export function getGroupLeader(group: string): string | null {
  const g = GROUP_STANDINGS.find((x) => x.group === group)
  return g?.teams[0]?.name ?? null
}

// Get all teams from a group
export function getGroupTeams(group: string): GroupTeam[] {
  return GROUP_STANDINGS.find((x) => x.group === group)?.teams ?? []
}
