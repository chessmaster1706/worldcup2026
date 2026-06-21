'use client'

import { useState, useCallback, useMemo } from 'react'
import { cn } from '@/lib/utils'
import { RotateCcw, Trophy, Zap } from 'lucide-react'
import type { Match, Round, Side } from '@/lib/bracket-data'
import {
  buildInitialBracket,
  getChampion,
  ROUND_LABELS,
} from '@/lib/bracket-data'
import { MatchCard } from './match-card'

// Compute the CSS grid-row value for a match based on round, side, position
function getGridRow(round: Round, position: number): string {
  switch (round) {
    case 'r32':
      // 8 matches in 16 rows: each spans 2 rows, starting at odd rows
      return `${2 * position - 1} / ${2 * position + 1}`
    case 'r16':
      // 4 matches in 16 rows: each spans 4 rows
      return `${4 * position - 3} / ${4 * position + 1}`
    case 'qf':
      // 2 matches in 16 rows: each spans 8 rows
      return `${8 * position - 7} / ${8 * position + 1}`
    case 'sf':
    case 'final':
      // 1 match spanning 16 rows
      return `1 / 17`
  }
}

interface SideBracketProps {
  side: Side
  matches: Match[]
  onPickWinner: (matchId: string, team: 'team1' | 'team2') => void
  onResetMatch: (matchId: string) => void
}

// One side (left or right) of the bracket: R32 → R16 → QF → SF
function SideBracket({ side, matches, onPickWinner, onResetMatch }: SideBracketProps) {
  const r32 = matches.filter((m) => m.round === 'r32').sort((a, b) => a.position - b.position)
  const r16 = matches.filter((m) => m.round === 'r16').sort((a, b) => a.position - b.position)
  const qf = matches.filter((m) => m.round === 'qf').sort((a, b) => a.position - b.position)
  const sf = matches.filter((m) => m.round === 'sf').sort((a, b) => a.position - b.position)

  // For right side, reverse the column order so SF is closest to center
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
    <div className="flex items-stretch gap-3 sm:gap-6">
      {columns.map((col) => (
        <div key={col.round} className="flex w-[185px] flex-col">
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

      // If we already had a different winner, clear downstream first
      if (match.winner && match.winner !== winnerName) {
        clearDownstream(next, matchId)
      }

      // Set the new winner
      const updatedMatch = { ...next[idx], winner: winnerName }
      next[idx] = updatedMatch

      // Propagate to next match
      if (updatedMatch.nextMatchId && updatedMatch.nextSlot) {
        const nextIdx = next.findIndex((m) => m.id === updatedMatch.nextMatchId)
        if (nextIdx !== -1) {
          const nextMatch = next[nextIdx]
          // After clearDownstream, the next match slot may already be null
          // Set it to the new winner
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
      // Clear downstream first (next matches that depended on this winner)
      clearDownstream(next, matchId)
      // Reset this match's winner
      next[idx] = { ...match, winner: null }
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
      {/* Top bar — Sports broadcast feel */}
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
          <div className="flex min-w-[1500px] items-stretch gap-4 sm:gap-8">

            {/* LEFT side */}
            <SideBracket
              side="left"
              matches={leftMatches}
              onPickWinner={pickWinner}
              onResetMatch={resetMatch}
            />

            {/* FINAL — center */}
            <div className="flex w-[200px] flex-col">
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
            />

          </div>
        </div>

        {/* Champion display under final (mobile fallback) */}
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
          <p className="text-xs text-slate-500">
            <span className="font-semibold text-slate-400">How to play:</span> Click a team in any match to advance them to the next round. Hover a decided match and click <span className="text-amber-400">reset</span> to undo.
          </p>
          <p className="text-[10px] text-slate-600">
            32 teams · 31 matches · Mirror layout — left & right halves meet at the center final
          </p>
        </div>
      </main>
    </div>
  )
}

// Helper: recursively clear winners downstream from a match
function clearDownstream(matches: Match[], matchId: string): void {
  const match = matches.find((m) => m.id === matchId)
  if (!match) return

  // Clear this match's winner
  const idx = matches.findIndex((m) => m.id === matchId)
  if (idx !== -1) {
    matches[idx] = { ...matches[idx], winner: null }
  }

  // Clear the team from next match and propagate
  if (match.nextMatchId && match.nextSlot) {
    const nextIdx = matches.findIndex((m) => m.id === match.nextMatchId)
    if (nextIdx !== -1) {
      const nextMatch = matches[nextIdx]
      matches[nextIdx] = {
        ...nextMatch,
        [match.nextSlot]: null,
        winner: null,
      }
      // Recursively clear downstream
      clearDownstream(matches, nextMatch.id)
    }
  }
}
