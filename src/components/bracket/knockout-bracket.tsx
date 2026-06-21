'use client'

import { useState, useCallback, useMemo } from 'react'
import { cn } from '@/lib/utils'
import { RotateCcw, Trophy, Zap, Info } from 'lucide-react'
import type { Match, Round, Side, Slot } from '@/lib/bracket-data'
import {
  buildInitialBracket,
  applyStandingsToBracket,
  clearDownstream,
  getChampion,
  ROUND_LABELS,
} from '@/lib/bracket-data'
import { DEFAULT_SCENARIO } from '@/lib/third-place-scenarios'
import { useBracketStore } from '@/lib/bracket-store'
import { MatchCard } from './match-card'

// Compute the CSS grid-row value for a match based on round, position
function getGridRow(round: Round, position: number): string {
  switch (round) {
    case 'r32':
      return `${2 * position - 1} / ${2 * position + 1}`
    case 'r16':
      return `${4 * position - 3} / ${4 * position + 1}`
    case 'qf':
      return `${8 * position - 7} / ${8 * position + 1}`
    case 'sf':
    case 'final':
      return `1 / 17`
  }
}

interface SideBracketProps {
  side: Side
  matches: Match[]
  onPickWinner: (matchId: string, team: 'team1' | 'team2') => void
  onResetMatch: (matchId: string) => void
  onEditTeam: (matchId: string, slot: Slot, name: string) => void
}

function SideBracket({ side, matches, onPickWinner, onResetMatch, onEditTeam }: SideBracketProps) {
  const r32 = matches.filter((m) => m.round === 'r32').sort((a, b) => a.position - b.position)
  const r16 = matches.filter((m) => m.round === 'r16').sort((a, b) => a.position - b.position)
  const qf = matches.filter((m) => m.round === 'qf').sort((a, b) => a.position - b.position)
  const sf = matches.filter((m) => m.round === 'sf').sort((a, b) => a.position - b.position)

  const columns = side === 'left'
    ? [
        { round: 'r32' as Round, title: ROUND_LABELS.r32, items: r32 },
        { round: 'r16' as Round, title: ROUND_LABELS.r16, items: r16 },
        { round: 'qf' as Round, title: ROUND_LABELS.qf, items: qf },
        { round: 'sf' as Round, title: ROUND_LABELS.sf, items: sf },
      ]
    : [
        { round: 'sf' as Round, title: ROUND_LABELS.sf, items: sf },
        { round: 'qf' as Round, title: ROUND_LABELS.qf, items: qf },
        { round: 'r16' as Round, title: ROUND_LABELS.r16, items: r16 },
        { round: 'r32' as Round, title: ROUND_LABELS.r32, items: r32 },
      ]

  return (
    <div className="flex items-stretch gap-2 sm:gap-4">
      {columns.map((col) => (
        <div key={col.round} className="flex w-[200px] flex-col">
          <div className="mb-2 text-center text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
            {col.title}
          </div>
          <div
            className="grid flex-1"
            style={{ gridTemplateRows: 'repeat(16, minmax(0, 1fr))', rowGap: '0.5rem' }}
          >
            {col.items.map((m) => (
              <div
                key={m.id}
                className="flex items-center justify-center"
                style={{ gridRow: getGridRow(m.round, m.position) }}
              >
                <MatchCard
                  match={m}
                  onPickWinner={onPickWinner}
                  onResetMatch={onResetMatch}
                  onEditTeam={onEditTeam}
                />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

export function KnockoutBracket() {
  // Winners are the only user-picked state. Everything else (R32 team names)
  // is derived from the shared store (standings + overrides) via useMemo.
  // Keyed by matchId. Value is 'team1' | 'team2' | null.
  const [winnerPicks, setWinnerPicks] = useState<Record<string, 'team1' | 'team2' | null>>({})

  // Subscribe to store values so we re-render when standings or overrides change
  const standings = useBracketStore((s) => s.standings)
  const overrides = useBracketStore((s) => s.overrides)
  const resolveSlot = useBracketStore((s) => s.resolveSlot)
  const setSlotOverride = useBracketStore((s) => s.setSlotOverride)

  // Compute the full bracket from the store + winner picks
  // - Start with the initial bracket structure
  // - Apply live standings to R32 (auto-resolve slot labels)
  // - Apply winner picks on top (and propagate downstream)
  const matches = useMemo<Match[]>(() => {
    // Step 1: Start with the initial bracket (R32 with auto-resolved names from store)
    let result = applyStandingsToBracket(buildInitialBracket(), resolveSlot)

    // Step 2: Apply winner picks in round order (R32 → R16 → QF → SF → F)
    // so downstream propagation works correctly
    const rounds: Round[] = ['r32', 'r16', 'qf', 'sf', 'final']
    for (const round of rounds) {
      const roundMatches = result.filter((m) => m.round === round)
      for (const m of roundMatches) {
        const pick = winnerPicks[m.id]
        if (!pick) continue

        const winnerName = m[pick]
        if (!winnerName) continue

        const idx = result.findIndex((x) => x.id === m.id)
        if (idx === -1) continue

        // If there was a previous winner that's different, clear downstream first
        if (result[idx].winner && result[idx].winner !== winnerName) {
          clearDownstream(result, m.id)
        }

        result[idx] = { ...result[idx], winner: winnerName }

        // Propagate to next match
        const updated = result[idx]
        if (updated.nextMatchId && updated.nextSlot) {
          const nextIdx = result.findIndex((x) => x.id === updated.nextMatchId)
          if (nextIdx !== -1) {
            result[nextIdx] = { ...result[nextIdx], [updated.nextSlot]: winnerName }
          }
        }
      }
    }

    return result
  }, [standings, overrides, resolveSlot, winnerPicks])

  const champion = useMemo(() => getChampion(matches), [matches])

  const pickWinner = useCallback((matchId: string, slot: 'team1' | 'team2') => {
    setWinnerPicks((prev) => ({ ...prev, [matchId]: slot }))
  }, [])

  const resetMatch = useCallback((matchId: string) => {
    setWinnerPicks((prev) => {
      const next = { ...prev }
      // Clear this pick AND any downstream picks (picks in matches that depend on this one)
      // Find all matches that could be downstream
      const allMatches = buildInitialBracket()
      const toClear = new Set<string>([matchId])

      // Walk forward from this match
      let current = allMatches.find((m) => m.id === matchId)
      while (current?.nextMatchId) {
        toClear.add(current.nextMatchId)
        current = allMatches.find((m) => m.id === current!.nextMatchId)
      }

      for (const id of toClear) {
        delete next[id]
      }
      return next
    })
  }, [])

  // Edit a team name in the bracket — sets an override in the store
  // so the change persists across standings updates.
  const editTeam = useCallback((matchId: string, slot: Slot, name: string) => {
    // Find the slot label for this match+slot by looking at the static bracket
    const staticMatch = buildInitialBracket().find((m) => m.id === matchId)
    if (!staticMatch) return
    const slotLabel = slot === 'team1' ? staticMatch.slot1 : staticMatch.slot2
    if (!slotLabel) return

    setSlotOverride(slotLabel, name || null)
  }, [setSlotOverride])

  const resetAll = useCallback(() => {
    useBracketStore.getState().resetAllGroups()
    useBracketStore.getState().clearOverrides()
    setWinnerPicks({})
  }, [])

  const leftMatches = matches.filter((m) => m.side === 'left')
  const rightMatches = matches.filter((m) => m.side === 'right')
  const finalMatch = matches.find((m) => m.round === 'final')

  const decided = matches.filter((m) => m.winner).length
  const total = matches.length

  return (
    <div className="w-full text-white">
      {/* Section header */}
      <div className="border-y border-amber-500/20 bg-slate-950/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-[1900px] items-center justify-between gap-4 px-4 py-2.5 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-gradient-to-br from-amber-400 to-amber-600 shadow-lg shadow-amber-500/30">
              <Trophy className="h-4 w-4 text-slate-900" />
            </div>
            <div className="flex flex-col leading-tight">
              <h2 className="text-sm font-extrabold uppercase tracking-wider text-white sm:text-base">
                Knockout Stage
              </h2>
              <p className="text-[10px] font-medium uppercase tracking-[0.25em] text-amber-400/80">
                Round of 32 → Final · Mirror layout
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-2 rounded-md border border-white/10 bg-white/5 px-3 py-1.5 sm:flex">
              <Zap className="h-3.5 w-3.5 text-amber-400" />
              <span className="text-xs font-semibold text-slate-300">
                {decided}<span className="text-slate-500"> / {total} decided</span>
              </span>
            </div>
            <button
              onClick={resetAll}
              className="flex items-center gap-1.5 rounded-md border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-slate-300 transition-colors hover:border-amber-500/40 hover:bg-amber-500/10 hover:text-amber-300"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reset
            </button>
          </div>
        </div>
      </div>

      {/* Scenario info banner */}
      <div className="border-b border-white/5 bg-slate-900/50">
        <div className="mx-auto flex max-w-[1900px] items-center justify-center gap-2 px-4 py-2 text-center">
          <Info className="h-3.5 w-3.5 shrink-0 text-sky-400" />
          <p className="text-[11px] text-slate-400">
            <span className="font-semibold text-slate-300">3rd-place scenario #{DEFAULT_SCENARIO.id}:</span>{' '}
            3rd-placed teams from groups{' '}
            <span className="font-semibold text-amber-300">
              {DEFAULT_SCENARIO.advancingGroups.join(', ')}
            </span>{' '}
            advance to R32. Group winners{' '}
            <span className="text-slate-300">A, B, D, E, G, I, K, L</span> play 3rd-place teams;{' '}
            <span className="text-slate-300">C, F, H, J</span> play runners-up.
          </p>
        </div>
      </div>

      {/* Champion banner */}
      {champion && (
        <div className="border-b border-amber-500/20 bg-gradient-to-r from-amber-500/10 via-amber-400/15 to-amber-500/10">
          <div className="mx-auto flex max-w-[1900px] items-center justify-center gap-3 px-4 py-2">
            <Trophy className="h-4 w-4 animate-pulse text-amber-400" />
            <span className="text-xs font-bold uppercase tracking-[0.3em] text-amber-300">
              Champion · {champion}
            </span>
            <Trophy className="h-4 w-4 animate-pulse text-amber-400" />
          </div>
        </div>
      )}

      {/* Bracket */}
      <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 px-4 py-6 sm:px-6">
        <div className="bracket-scroll overflow-x-auto pb-6">
          <div className="flex min-w-[1700px] items-stretch gap-3 sm:gap-6">

            {/* LEFT side */}
            <SideBracket
              side="left"
              matches={leftMatches}
              onPickWinner={pickWinner}
              onResetMatch={resetMatch}
              onEditTeam={editTeam}
            />

            {/* FINAL — center */}
            <div className="flex w-[210px] flex-col">
              <div className="mb-2 text-center text-[10px] font-bold uppercase tracking-[0.3em] text-amber-400">
                {ROUND_LABELS.final}
              </div>
              <div
                className="grid flex-1"
                style={{ gridTemplateRows: 'repeat(16, minmax(0, 1fr))' }}
              >
                <div
                  className="relative flex items-center justify-center"
                  style={{ gridRow: '1 / 17' }}
                >
                  <div className="absolute -inset-8 -z-10 rounded-full bg-amber-500/10 blur-3xl" />
                  {finalMatch && (
                    <MatchCard
                      match={finalMatch}
                      onPickWinner={pickWinner}
                      onResetMatch={resetMatch}
                      onEditTeam={editTeam}
                      isChampion={!!champion}
                    />
                  )}
                </div>
              </div>
            </div>

            {/* RIGHT side */}
            <SideBracket
              side="right"
              matches={rightMatches}
              onPickWinner={pickWinner}
              onResetMatch={resetMatch}
              onEditTeam={editTeam}
            />

          </div>
        </div>

        {/* Champion display */}
        {champion && (
          <div className="mt-6 flex flex-col items-center gap-1.5">
            <Trophy className="h-8 w-8 text-amber-400 drop-shadow-[0_0_12px_rgba(251,191,36,0.6)]" />
            <div className="text-center">
              <div className="text-[9px] font-bold uppercase tracking-[0.3em] text-amber-500/80">Champion</div>
              <div className="text-xl font-extrabold text-amber-300">{champion}</div>
            </div>
          </div>
        )}

        {/* How to use footer */}
        <div className="mt-8 flex flex-col items-center gap-2 text-center">
          <p className="text-xs text-slate-500 max-w-2xl">
            <span className="font-semibold text-slate-400">How to play:</span> Drag teams in the group grid above to reorder — positions 1 and 2 auto-fill the bracket. Click a team to advance them; hover a decided match and click <span className="text-amber-400">reset</span> to undo. Click the pencil icon on any slot to override the auto-resolved name.
          </p>
          <p className="text-[10px] text-slate-600">
            32 teams · 31 matches · 12 groups · 8 best 3rd-placed teams advance · Scenario #{DEFAULT_SCENARIO.id} of 495
          </p>
        </div>
      </div>
    </div>
  )
}
