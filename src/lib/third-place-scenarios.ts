// Third-place qualification scenarios for 2026 FIFA World Cup Round of 32
// Parsed from "pick best 8 3rd scenario.csv"
//
// The CSV contains 495 scenarios. Each scenario shows:
//   - Which 8 of 12 groups (A-L) send their 3rd-place team to the R32
//   - Which 3rd-place team plays which group winner
//
// The 8 group winners that play 3rd-place teams are: 1A, 1B, 1D, 1E, 1G, 1I, 1K, 1L
// The 4 group winners that play runners-up are: 1C, 1F, 1H, 1J
//   - 1C vs 2F
//   - 1F vs 2E
//   - 1H vs 2G
//   - 1J vs 2K
// The 4 runner-up vs runner-up matches are:
//   - 2A vs 2B
//   - 2C vs 2D
//   - 2H vs 2I
//   - 2J vs 2L

export interface ThirdPlaceScenario {
  id: number
  // The 8 groups whose 3rd-place team advances (sorted)
  advancingGroups: string[]
  // Map from group-winner slot (e.g. '1A') to the 3rd-place slot they play (e.g. '3E')
  assignments: Record<string, string>
}

// Parse the CSV content into structured scenarios
export function parseScenarios(csvContent: string): ThirdPlaceScenario[] {
  const lines = csvContent.split('\n').filter((line) => line.trim())
  const scenarios: ThirdPlaceScenario[] = []

  // Data rows start at line 6 (after header + 4 metadata lines)
  // Columns (0-indexed):
  //   0: No.
  //   1-12: Groups A-L (mark which advance as 3rd)
  //   13-20: 1A, 1B, 1D, 1E, 1G, 1I, 1K, 1L assignments
  for (let i = 5; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue

    // Split by comma, handling the BOM
    const cols = line.split(',')
    const id = parseInt(cols[0]?.trim()?.replace(/\uFEFF/g, '') || '0', 10)
    if (!id) continue

    // Columns 1-12 are groups A-L
    const advancingGroups: string[] = []
    const groupLetters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L']
    for (let j = 0; j < 12; j++) {
      const val = cols[1 + j]?.trim()
      if (val) advancingGroups.push(groupLetters[j])
    }

    // Columns 13-20 are the assignments for 1A, 1B, 1D, 1E, 1G, 1I, 1K, 1L
    const winners = ['1A', '1B', '1D', '1E', '1G', '1I', '1K', '1L']
    const assignments: Record<string, string> = {}
    for (let j = 0; j < 8; j++) {
      const val = cols[13 + j]?.trim()
      if (val) assignments[winners[j]] = val
    }

    scenarios.push({ id, advancingGroups, assignments })
  }

  return scenarios
}

// Hardcoded scenario 1 (the first row of the CSV) as a fallback / default
// In scenario 1: groups E, F, G, H, I, J, K, L advance as 3rd place
export const DEFAULT_SCENARIO: ThirdPlaceScenario = {
  id: 1,
  advancingGroups: ['E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'],
  assignments: {
    '1A': '3E',
    '1B': '3J',
    '1D': '3I',
    '1E': '3F',
    '1G': '3H',
    '1I': '3G',
    '1K': '3L',
    '1L': '3K',
  },
}

// The 8 group winners that play 3rd-place teams
export const WINNERS_VS_THIRD = ['1A', '1B', '1D', '1E', '1G', '1I', '1K', '1L']

// The 4 group winners that play runners-up, and their opponents
export const WINNERS_VS_RUNNERUP: Record<string, string> = {
  '1C': '2F',
  '1F': '2E',
  '1H': '2G',
  '1J': '2K',
}

// The 4 runner-up vs runner-up matches
export const RUNNERUP_VS_RUNNERUP: [string, string][] = [
  ['2A', '2B'],
  ['2C', '2D'],
  ['2H', '2I'],
  ['2J', '2L'],
]
