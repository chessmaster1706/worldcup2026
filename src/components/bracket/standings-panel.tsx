'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { ChevronDown, ChevronUp, Table2 } from 'lucide-react'
import { GROUP_STANDINGS, type GroupTeam, type QualificationStatus } from '@/lib/group-standings'

const STATUS_COLORS: Record<QualificationStatus, string> = {
  qualified: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  likely: 'bg-sky-500/20 text-sky-300 border-sky-500/30',
  possible: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
  eliminated: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
}

const STATUS_LABELS: Record<QualificationStatus, string> = {
  qualified: 'Q',
  likely: 'X',
  possible: '?',
  eliminated: 'E',
}

function TeamRow({ team, isHost }: { team: GroupTeam; isHost: boolean }) {
  return (
    <tr className="border-b border-white/5 last:border-0 hover:bg-white/5">
      <td className="px-2 py-1.5">
        <div className="flex items-center gap-1.5">
          <span
            className={cn(
              'flex h-4 w-4 shrink-0 items-center justify-center rounded text-[8px] font-bold border',
              STATUS_COLORS[team.status],
            )}
            title={
              team.status === 'qualified' ? 'Qualified as group winner'
              : team.status === 'likely' ? 'Assured of top 3 (likely qualifies)'
              : team.status === 'eliminated' ? 'Eliminated'
              : 'Possible qualification'
            }
          >
            {STATUS_LABELS[team.status]}
          </span>
          <span className={cn(
            'truncate text-xs font-medium',
            team.status === 'eliminated' ? 'text-slate-500 line-through' : 'text-slate-200',
          )}>
            {team.name}
          </span>
          {isHost && (
            <span className="text-[8px] font-bold text-amber-400 bg-amber-400/10 px-1 rounded">H</span>
          )}
        </div>
      </td>
      <td className="px-1.5 py-1.5 text-center text-xs text-slate-400 tabular-nums">{team.played}</td>
      <td className="px-1.5 py-1.5 text-center text-xs text-slate-400 tabular-nums">{team.won}</td>
      <td className="px-1.5 py-1.5 text-center text-xs text-slate-400 tabular-nums">{team.drawn}</td>
      <td className="px-1.5 py-1.5 text-center text-xs text-slate-400 tabular-nums">{team.lost}</td>
      <td className="px-1.5 py-1.5 text-center text-xs text-slate-400 tabular-nums">
        {team.gf}:{team.ga}
      </td>
      <td className="px-1.5 py-1.5 text-center text-xs text-slate-400 tabular-nums">
        {team.gd > 0 ? '+' : ''}{team.gd}
      </td>
      <td className="px-2 py-1.5 text-center text-xs font-bold text-amber-300 tabular-nums">{team.pts}</td>
    </tr>
  )
}

export function StandingsPanel() {
  const [isOpen, setIsOpen] = useState(false)
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(['A', 'B', 'C']))

  const toggleGroup = (group: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev)
      if (next.has(group)) next.delete(group)
      else next.add(group)
      return next
    })
  }

  return (
    <div className="border-t border-amber-500/20 bg-slate-950/95 backdrop-blur-md">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between px-4 py-2.5 text-left hover:bg-white/5 transition-colors sm:px-6"
      >
        <div className="flex items-center gap-2">
          <Table2 className="h-4 w-4 text-amber-400" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
            Group Stage Standings
          </span>
          <span className="text-[10px] text-slate-500">
            · Updated through June 20, 2026
          </span>
        </div>
        {isOpen ? (
          <ChevronDown className="h-4 w-4 text-slate-400" />
        ) : (
          <ChevronUp className="h-4 w-4 text-slate-400" />
        )}
      </button>

      {isOpen && (
        <div className="max-h-[60vh] overflow-y-auto px-4 pb-4 sm:px-6">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {GROUP_STANDINGS.map((group) => {
              const isExpanded = expandedGroups.has(group.group)
              return (
                <div
                  key={group.group}
                  className="overflow-hidden rounded-md border border-white/10 bg-slate-900/60"
                >
                  <button
                    onClick={() => toggleGroup(group.group)}
                    className="flex w-full items-center justify-between bg-white/5 px-3 py-1.5 hover:bg-white/10 transition-colors"
                  >
                    <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                      Group {group.group}
                    </span>
                    {isExpanded ? (
                      <ChevronUp className="h-3 w-3 text-slate-500" />
                    ) : (
                      <ChevronDown className="h-3 w-3 text-slate-500" />
                    )}
                  </button>
                  {isExpanded && (
                    <table className="w-full">
                      <thead>
                        <tr className="text-[9px] uppercase tracking-wider text-slate-500">
                          <th className="px-2 py-1 text-left font-semibold">Team</th>
                          <th className="px-1.5 py-1 text-center font-semibold">P</th>
                          <th className="px-1.5 py-1 text-center font-semibold">W</th>
                          <th className="px-1.5 py-1 text-center font-semibold">D</th>
                          <th className="px-1.5 py-1 text-center font-semibold">L</th>
                          <th className="px-1.5 py-1 text-center font-semibold">G</th>
                          <th className="px-1.5 py-1 text-center font-semibold">±</th>
                          <th className="px-2 py-1 text-center font-semibold">Pts</th>
                        </tr>
                      </thead>
                      <tbody>
                        {group.teams.map((team) => (
                          <TeamRow
                            key={team.name}
                            team={team}
                            isHost={team.note?.includes('H') ?? false}
                          />
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )
            })}
          </div>

          {/* Legend */}
          <div className="mt-4 flex flex-wrap items-center gap-3 text-[10px] text-slate-500">
            <span className="font-semibold uppercase tracking-wider">Legend:</span>
            <span className="flex items-center gap-1">
              <span className="flex h-3 w-3 items-center justify-center rounded text-[8px] font-bold border bg-emerald-500/20 text-emerald-300 border-emerald-500/30">Q</span>
              Qualified (group winner confirmed)
            </span>
            <span className="flex items-center gap-1">
              <span className="flex h-3 w-3 items-center justify-center rounded text-[8px] font-bold border bg-sky-500/20 text-sky-300 border-sky-500/30">X</span>
              Assured of top 3 (likely qualifies)
            </span>
            <span className="flex items-center gap-1">
              <span className="flex h-3 w-3 items-center justify-center rounded text-[8px] font-bold border bg-slate-500/20 text-slate-400 border-slate-500/30">?</span>
              Possible
            </span>
            <span className="flex items-center gap-1">
              <span className="flex h-3 w-3 items-center justify-center rounded text-[8px] font-bold border bg-rose-500/20 text-rose-400 border-rose-500/30">E</span>
              Eliminated
            </span>
            <span className="flex items-center gap-1">
              <span className="text-amber-400 bg-amber-400/10 px-1 rounded text-[8px] font-bold">H</span>
              Host nation
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
