'use client'

import { useState, useRef, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { Trophy, Pencil } from 'lucide-react'
import type { Match } from '@/lib/bracket-data'
import { ROUND_SHORT } from '@/lib/bracket-data'

interface MatchCardProps {
  match: Match
  onPickWinner: (matchId: string, team: 'team1' | 'team2') => void
  onResetMatch: (matchId: string) => void
  onEditTeam: (matchId: string, slot: 'team1' | 'team2', name: string) => void
  isChampion?: boolean
  compact?: boolean
}

export function MatchCard({ match, onPickWinner, onResetMatch, onEditTeam, isChampion = false, compact = false }: MatchCardProps) {
  const handlePick = (slot: 'team1' | 'team2') => {
    if (!match[slot]) return
    onPickWinner(match.id, slot)
  }

  return (
    <div
      className={cn(
        'group relative overflow-hidden rounded-md border bg-slate-900/80 backdrop-blur-sm transition-all',
        isChampion
          ? 'border-amber-400 shadow-[0_0_30px_rgba(251,191,36,0.4)]'
          : 'border-white/10 hover:border-white/25',
        compact ? 'w-[150px]' : 'w-[190px]',
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
        <TeamRow
          key={`t1-${match.team1 ?? 'empty'}-${match.id}`}
          slot="team1"
          label={match.team1}
          slotLabel={match.slot1}
          isWinner={match.winner === match.team1 && match.team1 !== null}
          isLoser={match.winner !== null && match.winner !== match.team1 && match.team1 !== null}
          canPick={match.team1 !== null && match.winner !== match.team1}
          compact={compact}
          onPick={handlePick}
          onEdit={(name) => onEditTeam(match.id, 'team1', name)}
        />
        <TeamRow
          key={`t2-${match.team2 ?? 'empty'}-${match.id}`}
          slot="team2"
          label={match.team2}
          slotLabel={match.slot2}
          isWinner={match.winner === match.team2 && match.team2 !== null}
          isLoser={match.winner !== null && match.winner !== match.team2 && match.team2 !== null}
          canPick={match.team2 !== null && match.winner !== match.team2}
          compact={compact}
          onPick={handlePick}
          onEdit={(name) => onEditTeam(match.id, 'team2', name)}
        />
      </div>
    </div>
  )
}

interface TeamRowProps {
  slot: 'team1' | 'team2'
  label: string | null
  slotLabel?: string
  isWinner: boolean
  isLoser: boolean
  canPick: boolean
  compact: boolean
  onPick: (slot: 'team1' | 'team2') => void
  onEdit: (name: string) => void
  matchId: string
}

function TeamRow({ slot, label, slotLabel, isWinner, isLoser, canPick, compact, onPick, onEdit, matchId }: TeamRowProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(label ?? '')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])

  const handleStartEdit = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsEditing(true)
  }

  const handleSubmitEdit = () => {
    setIsEditing(false)
    const trimmed = editValue.trim()
    if (trimmed !== label) {
      onEdit(trimmed || '')
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmitEdit()
    } else if (e.key === 'Escape') {
      setEditValue(label ?? '')
      setIsEditing(false)
    }
  }

  if (isEditing) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-slate-800/80">
        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded text-[10px] font-bold bg-amber-400/30 text-amber-300">
          {slot === 'team1' ? '1' : '2'}
        </span>
        <input
          ref={inputRef}
          type="text"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleSubmitEdit}
          onKeyDown={handleKeyDown}
          placeholder={slotLabel ?? 'Team name'}
          className="flex-1 min-w-0 bg-transparent text-sm font-medium text-amber-200 placeholder:text-slate-600 outline-none border-b border-amber-400/50"
        />
      </div>
    )
  }

  return (
    <div
      onClick={() => canPick && onPick(slot)}
      className={cn(
        'group/row relative flex w-full items-center gap-2 px-3 py-2 transition-all duration-200',
        compact ? 'text-xs' : 'text-sm',
        isWinner && 'bg-gradient-to-r from-amber-500/30 via-amber-500/15 to-transparent',
        isLoser && 'opacity-40',
        canPick && 'cursor-pointer hover:bg-white/10',
        !label && 'cursor-default',
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

      {/* Team name or slot label */}
      <div className="flex-1 min-w-0 flex flex-col leading-tight">
        {label ? (
          <span
            className={cn(
              'truncate font-medium tracking-wide',
              isWinner ? 'text-amber-300' : 'text-slate-100',
            )}
          >
            {label}
          </span>
        ) : (
          <span className="text-slate-500 italic text-xs">
            {slotLabel ?? 'TBD'}
          </span>
        )}
        {slotLabel && (
          <span className="text-[8px] uppercase tracking-wider text-slate-600 leading-none mt-0.5">
            {slotLabel}
          </span>
        )}
      </div>

      {/* Edit button for empty slots */}
      {!label && (
        <button
          type="button"
          onClick={handleStartEdit}
          className="shrink-0 opacity-0 group-hover/row:opacity-100 transition-opacity p-1 rounded hover:bg-white/10"
          title={`Set ${slotLabel ?? 'team'} name`}
        >
          <Pencil className="h-3 w-3 text-slate-400" />
        </button>
      )}

      {/* Winner checkmark */}
      {isWinner && (
        <Trophy className="h-3.5 w-3.5 shrink-0 text-amber-400" />
      )}
    </div>
  )
}
