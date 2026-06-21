'use client'

import { cn } from '@/lib/utils'
import { Trophy } from 'lucide-react'
import type { Match } from '@/lib/bracket-data'
import { ROUND_SHORT } from '@/lib/bracket-data'

interface MatchCardProps {
  match: Match
  onPickWinner: (matchId: string, team: 'team1' | 'team2') => void
  onResetMatch: (matchId: string) => void
  isChampion?: boolean
  compact?: boolean
}

export function MatchCard({ match, onPickWinner, onResetMatch, isChampion = false, compact = false }: MatchCardProps) {
  const handlePick = (slot: 'team1' | 'team2') => {
    if (!match[slot]) return
    onPickWinner(match.id, slot)
  }

  const teamRow = (slot: 'team1' | 'team2', label: string | null) => {
    const isWinner = match.winner === label && label !== null
    const isLoser = match.winner !== null && match.winner !== label && label !== null
    const canPick = label !== null && !isWinner

    return (
      <button
        type="button"
        onClick={() => handlePick(slot)}
        disabled={!canPick && !isWinner}
        className={cn(
          'group/row relative flex w-full items-center gap-2 px-3 py-2 text-left transition-all duration-200',
          compact ? 'text-xs' : 'text-sm',
          isWinner && 'bg-gradient-to-r from-amber-500/30 via-amber-500/15 to-transparent',
          isLoser && 'opacity-40',
          canPick && 'cursor-pointer hover:bg-white/10 hover:translate-x-0.5',
          !label && 'opacity-30 cursor-default',
        )}
      >
        {/* Position number */}
        <span
          className={cn(
            'flex h-5 w-5 shrink-0 items-center justify-center rounded text-[10px] font-bold',
            'bg-white/10 text-slate-400',
            isWinner && 'bg-amber-400 text-slate-900',
          )}
        >
          {slot === 'team1' ? '1' : '2'}
        </span>

        {/* Team name */}
        <span
          className={cn(
            'flex-1 truncate font-medium tracking-wide',
            isWinner ? 'text-amber-300' : 'text-slate-100',
          )}
        >
          {label ?? (
            <span className="italic text-slate-500">TBD</span>
          )}
        </span>

        {/* Winner checkmark */}
        {isWinner && (
          <Trophy className="h-3.5 w-3.5 shrink-0 text-amber-400" />
        )}
      </button>
    )
  }

  return (
    <div
      className={cn(
        'group relative overflow-hidden rounded-md border bg-slate-900/80 backdrop-blur-sm transition-all',
        isChampion
          ? 'border-amber-400 shadow-[0_0_30px_rgba(251,191,36,0.4)]'
          : 'border-white/10 hover:border-white/25',
        compact ? 'w-[150px]' : 'w-[180px]',
      )}
    >
      {/* Match label header */}
      <div className="flex items-center justify-between border-b border-white/10 bg-white/5 px-2 py-1">
        <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400">
          {ROUND_SHORT[match.round]} · {match.side === 'left' ? 'L' : match.side === 'right' ? 'R' : 'F'}{match.position}
        </span>
        {match.winner && (
          <button
            type="button"
            onClick={() => onResetMatch(match.id)}
            className="text-[9px] font-medium uppercase tracking-wider text-slate-500 opacity-0 transition-opacity hover:text-slate-300 group-hover:opacity-100"
            title="Reset match"
          >
            reset
          </button>
        )}
      </div>

      {/* Teams */}
      <div className="divide-y divide-white/5">
        {teamRow('team1', match.team1)}
        {teamRow('team2', match.team2)}
      </div>
    </div>
  )
}
