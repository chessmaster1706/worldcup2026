// Third-place qualification scenarios for 2026 FIFA World Cup Round of 32
// Parsed from "pick best 8 3rd scenario.csv"
//
// The CSV contains 495 scenarios. Each scenario shows:
//   - Which 8 of 12 groups (A-L) send their 3rd-place team to the R32
//   - Which 3rd-place team plays which group winner
//
// === FIFA OFFICIAL R32 SCHEDULE (Match 73-88) ===
//
// The 8 group winners that play 3rd-place teams are: 1A, 1B, 1D, 1E, 1G, 1I, 1K, 1L
//   (same set of slots as in the CSV — so all 495 scenarios still apply)
//
// The 4 group winners that play runners-up (FIFA schedule):
//   - Match 75: 1F vs 2C
//   - Match 76: 1C vs 2F
//   - Match 84: 1H vs 2J
//   - Match 86: 1J vs 2H
//
// The 4 runner-up vs runner-up matches (FIFA schedule):
//   - Match 73: 2A vs 2B
//   - Match 78: 2E vs 2I
//   - Match 83: 2K vs 2L
//   - Match 88: 2D vs 2G
//
// 3rd-place eligibility constraints (which groups' 3rd-placed team CAN play in each match):
//   Match 74 (1E vs ?): 3rd from A/B/C/D/F
//   Match 77 (1I vs ?): 3rd from C/D/F/G/H
//   Match 79 (1A vs ?): 3rd from C/E/F/H/I
//   Match 80 (1L vs ?): 3rd from E/H/I/J/K
//   Match 81 (1D vs ?): 3rd from B/E/F/I/J
//   Match 82 (1G vs ?): 3rd from A/E/H/I/J
//   Match 85 (1B vs ?): 3rd from E/F/G/I/J
//   Match 87 (1K vs ?): 3rd from D/E/I/J/L

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

// The 8 group winners that play 3rd-place teams (FIFA schedule, matches 74/77/79/80/81/82/85/87)
export const WINNERS_VS_THIRD = ['1A', '1B', '1D', '1E', '1G', '1I', '1K', '1L']

// 3rd-place eligibility constraints per FIFA-published schedule.
// Key: group-winner slot. Value: set of groups whose 3rd-placed team is eligible to play here.
export const THIRD_PLACE_CONSTRAINTS: Record<string, string[]> = {
  '1E': ['A', 'B', 'C', 'D', 'F'], // Match 74
  '1I': ['C', 'D', 'F', 'G', 'H'], // Match 77
  '1A': ['C', 'E', 'F', 'H', 'I'], // Match 79
  '1L': ['E', 'H', 'I', 'J', 'K'], // Match 80
  '1D': ['B', 'E', 'F', 'I', 'J'], // Match 81
  '1G': ['A', 'E', 'H', 'I', 'J'], // Match 82
  '1B': ['E', 'F', 'G', 'I', 'J'], // Match 85
  '1K': ['D', 'E', 'I', 'J', 'L'], // Match 87
}

// The 4 group winners that play runners-up (FIFA schedule), and their opponents.
// Match 75: 1F vs 2C
// Match 76: 1C vs 2F
// Match 84: 1H vs 2J
// Match 86: 1J vs 2H
export const WINNERS_VS_RUNNERUP: Record<string, string> = {
  '1C': '2F',
  '1F': '2C',
  '1H': '2J',
  '1J': '2H',
}

// The 4 runner-up vs runner-up matches (FIFA schedule).
// Match 73: 2A vs 2B
// Match 78: 2E vs 2I
// Match 83: 2K vs 2L
// Match 88: 2D vs 2G
export const RUNNERUP_VS_RUNNERUP: [string, string][] = [
  ['2A', '2B'],
  ['2E', '2I'],
  ['2K', '2L'],
  ['2D', '2G'],
]
