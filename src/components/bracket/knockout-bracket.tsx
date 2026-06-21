'use client'

import { useState, useCallback, useMemo } from 'react'
import { cn } from '@/lib/utils'
import { RotateCcw, Trophy, Zap, Info } from 'lucide-react'
import type { Match, Round, Side, Slot } from '@/lib/bracket-data'
import {
  buildInitialBracket,
  getChampion,
  ROUND_LABELS,
} from '@/lib/bracket-data'
import { DEFAULT_SCENARIO } from '@/lib/third-place-scenarios'
import { MatchCard } from './match-card'
import { StandingsPanel } from './standings-panel'

// Compute the CSS grid-row value for a match based on round, position
function getGridRow(round: Round, position: number): string {
  switch (round) {
    case 'r32':
      // 8 matches in 16 rows: each spans 2 rows
      return `${2 * position - 1} / ${2 * position + 1}`
    case 'r16':
      // 4 matches in 16 rows: each spans 4 rows
      return `${4 * position - 3} / ${4 * position + 1}`
    case 'qf':
      // 2 matches in 16 rows: each spans 8 rows
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
  const [matches, setMatches] = useState<Match[]>(() => buildInitialBracket())

  const champion = useMemo(() => getChampion(matches), [matches])

  const pickWinner = useCallback((matchId: string, slot: 'team1' | 'team2') => {
    setMatches((prev) => {
      const next = prev.map((m) => ({ ...m }))
      const idx = next.findIndex((m) => m.id === matchId)
      if (idx === -1) return prev

      const match = next[idx]
      const winnerName = match[slot]
      if (!winnerName) return prev

      if (match.winner && match.winner !== winnerName) {
        clearDownstream(next, matchId)
      }

      const updatedMatch = { ...next[idx], winner: winnerName }
      next[idx] = updatedMatch

      if (updatedMatch.nextMatchId && updatedMatch.nextSlot) {
        const nextIdx = next.findIndex((m) => m.id === updatedMatch.nextMatchId)
        if (nextIdx !== -1) {
          const nextMatch = next[nextIdx]
          next[nextIdx] = {
            ...nextMatch,
            [updatedMatch.nextSlot]: winnerName,
          }
        }
      }

      return next
    })
  }, [])

  const resetMatch = useCallback((matchId: string) => {
    setMatches((prev) => {
      const next = prev.map((m) => ({ ...m }))
      const idx = next.findIndex((m) => m.id === matchId)
      if (idx === -1) return prev

      const match = next[idx]
      clearDownstream(next, matchId)
      next[idx] = { ...match, winner: null }
      return next
    })
  }, [])

  const editTeam = useCallback((matchId: string, slot: Slot, name: string) => {
    setMatches((prev) => {
      const next = prev.map((m) => ({ ...m }))
      const idx = next.findIndex((m) => m.id === matchId)
      if (idx === -1) return prev

      const match = next[idx]
      const oldName = match[slot]
      const newName = name || null

      // Update the team name
      next[idx] = { ...match, [slot]: newName }

      // If this team was the winner, propagate the change downstream
      if (match.winner === oldName && oldName !== null) {
        // Clear the old winner and set the new name as winner if provided
        if (newName) {
          next[idx] = { ...next[idx], winner: newName }
          // Update the next match slot
          if (match.nextMatchId && match.nextSlot) {
            const nextIdx = next.findIndex((m) => m.id === match.nextMatchId)
            if (nextIdx !== -1) {
              next[nextIdx] = { ...next[nextIdx], [match.nextSlot]: newName }
            }
          }
        } else {
          // Name was cleared — clear winner and downstream
          next[idx] = { ...next[idx], winner: null }
          if (match.nextMatchId && match.nextSlot) {
            const nextIdx = next.findIndex((m) => m.id === match.nextMatchId)
            if (nextIdx !== -1) {
              clearDownstream(next, match.nextMatchId)
              next[nextIdx] = { ...next[nextIdx], [match.nextSlot]: null }
            }
          }
        }
      }

      return next
    })
  }, [])

  const resetAll = useCallback(() => {
    setMatches(buildInitialBracket())
  }, [])

  const leftMatches = matches.filter((m) => m.side === 'left')
  const rightMatches = matches.filter((m) => m.side === 'right')
  const finalMatch = matches.find((m) => m.round === 'final')

  const decided = matches.filter((m) => m.winner).length
  const total = matches.length

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      {/* Top bar */}
      <header className="sticky top-0 z-20 border-b border-amber-500/20 bg-slate-950/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-[1900px] items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-gradient-to-br from-amber-400 to-amber-600 shadow-lg shadow-amber-500/30">
              <Trophy className="h-5 w-5 text-slate-900" />
            </div>
            <div className="flex flex-col leading-tight">
              <h1 className="text-base font-extrabold uppercase tracking-wider text-white sm:text-lg">
                World Cup 2026
              </h1>
              <p className="text-[10px] font-medium uppercase tracking-[0.25em] text-amber-400/80">
                Knockout Stage · Round of 32 → Final
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-2 rounded-md border border-white/10 bg-white/5 px-3 py-1.5 sm:flex">
              <Zap className="h-3.5 w-3.5 text-amber-400" />
              <span className="text-xs font-semibold text-slate-300">
                {decided}<span className="text-slate-500"> / {total} matches decided</span>
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
      </header>

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
            <span className="text-slate-300">C, F, H, J</span> play runners-up. Click any{' '}
            <span className="text-slate-300">TBD</span> slot to fill in a team name as the group stage progresses.
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
      <main className="mx-auto max-w-[1900px] px-4 py-6 sm:px-6">
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
            <span className="font-semibold text-slate-400">How to play:</span> Click a team to advance them to the next round. Hover a decided match and click <span className="text-amber-400">reset</span> to undo. Click the pencil icon on any <span className="text-slate-300">TBD</span> slot to enter a team name as the group stage progresses. The slot label (e.g. <span className="text-slate-300">1A</span>, <span className="text-slate-300">3E</span>, <span className="text-slate-300">2F</span>) shows where the team comes from.
          </p>
          <p className="text-[10px] text-slate-600">
            32 teams · 31 matches · 12 groups · 8 best 3rd-placed teams advance · Scenario #{DEFAULT_SCENARIO.id} of 495
          </p>
        </div>
      </main>

      {/* Standings panel (collapsible) */}
      <StandingsPanel />
    </div>
  )
}

// Helper: recursively clear winners downstream from a match
function clearDownstream(matches: Match[], matchId: string): void {
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
