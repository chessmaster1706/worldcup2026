'use client'

import { useState } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { cn } from '@/lib/utils'
import { GripVertical, RotateCcw, Trophy, Table2, ChevronUp, ChevronDown } from 'lucide-react'
import { useBracketStore } from '@/lib/bracket-store'
import { GROUP_STANDINGS, type GroupTeam, type QualificationStatus } from '@/lib/group-standings'

const STATUS_COLORS: Record<QualificationStatus, string> = {
  qualified: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
  likely: 'bg-sky-500/20 text-sky-300 border-sky-500/40',
  possible: 'bg-slate-500/20 text-slate-400 border-slate-500/40',
  eliminated: 'bg-rose-500/20 text-rose-400 border-rose-500/40',
}

const STATUS_LABELS: Record<QualificationStatus, string> = {
  qualified: '1st',
  likely: '2nd',
  possible: '3rd',
  eliminated: '4th',
}

const POSITION_BADGE = [
  { label: '1', color: 'bg-amber-400 text-slate-900', hint: 'Group winner — auto-fills 1{group} slot in R32' },
  { label: '2', color: 'bg-slate-300 text-slate-900', hint: 'Runner-up — fills 2{group} slot' },
  { label: '3', color: 'bg-orange-400/80 text-slate-900', hint: '3rd place — may advance as best 3rd (depends on scenario)' },
  { label: '4', color: 'bg-slate-600 text-slate-200', hint: '4th place — eliminated' },
]

interface SortableTeamRowProps {
  team: GroupTeam
  group: string
  position: number // 0-3
  isHost: boolean
}

function SortableTeamRow({ team, group, position, isHost }: SortableTeamRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: `${group}-${team.name}` })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
  }

  const originalStanding = GROUP_STANDINGS.find((g) => g.group === group)?.teams
  const originalPosition = originalStanding?.findIndex((t) => t.name === team.name) ?? -1
  const moved = originalPosition !== -1 && originalPosition !== position

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'group/row flex items-center gap-2 border-b border-white/5 px-2 py-2 last:border-0 transition-colors',
        isDragging ? 'bg-amber-500/20 shadow-lg' : 'hover:bg-white/5',
        position === 0 && 'bg-emerald-500/5',
      )}
    >
      {/* Drag handle */}
      <button
        type="button"
        {...attributes}
        {...listeners}
        className="shrink-0 cursor-grab touch-none rounded p-0.5 text-slate-500 hover:text-slate-300 active:cursor-grabbing"
        aria-label={`Drag ${team.name} to reorder within Group ${group}`}
      >
        <GripVertical className="h-3.5 w-3.5" />
      </button>

      {/* Position badge */}
      <div
        className={cn(
          'flex h-5 w-5 shrink-0 items-center justify-center rounded text-[10px] font-bold',
          POSITION_BADGE[position].color,
        )}
        title={POSITION_BADGE[position].hint}
      >
        {POSITION_BADGE[position].label}
      </div>

      {/* Team name + host badge + moved indicator */}
      <div className="flex-1 min-w-0 flex items-center gap-1.5">
        <span className={cn(
          'truncate text-sm font-medium',
          team.status === 'eliminated' ? 'text-slate-500 line-through' : 'text-slate-100',
        )}>
          {team.name}
        </span>
        {isHost && (
          <span className="text-[8px] font-bold text-amber-400 bg-amber-400/10 px-1 rounded shrink-0">H</span>
        )}
        {moved && (
          <span className="text-[8px] font-semibold text-sky-400 bg-sky-400/10 px-1 rounded shrink-0" title={`Moved from position ${originalPosition + 1}`}>
            ↕
          </span>
        )}
      </div>

      {/* Stats */}
      <div className="hidden sm:flex items-center gap-2 text-[10px] text-slate-500 tabular-nums">
        <span title="Played">{team.played}</span>
        <span className="text-slate-600">·</span>
        <span title="Goals for:against">{team.gf}:{team.ga}</span>
        <span className="text-slate-600">·</span>
        <span title="Goal difference">{team.gd > 0 ? '+' : ''}{team.gd}</span>
        <span className="text-slate-600">·</span>
        <span className="font-bold text-amber-300">{team.pts}</span>
      </div>

      {/* Status badge */}
      <span
        className={cn(
          'shrink-0 rounded border px-1 py-0.5 text-[8px] font-bold uppercase tracking-wider',
          STATUS_COLORS[team.status],
        )}
      >
        {STATUS_LABELS[team.status]}
      </span>
    </div>
  )
}

interface GroupCardProps {
  group: GroupStanding['group']
}

function GroupCard({ group }: GroupCardProps) {
  const { standings, reorderTeam, resetGroup } = useBracketStore()
  const groupData = standings.find((g) => g.group === group)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 3 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  if (!groupData) return null

  const teamIds = groupData.teams.map((t) => `${group}-${t.name}`)

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = groupData.teams.findIndex((t) => `${group}-${t.name}` === active.id)
    const newIndex = groupData.teams.findIndex((t) => `${group}-${t.name}` === over.id)
    if (oldIndex === -1 || newIndex === -1) return

    reorderTeam(group, oldIndex, newIndex)
  }

  const isModified = JSON.stringify(groupData.teams.map((t) => t.name)) !==
    JSON.stringify(GROUP_STANDINGS.find((g) => g.group === group)?.teams.map((t) => t.name))

  return (
    <div className="overflow-hidden rounded-md border border-white/10 bg-slate-900/60 backdrop-blur-sm">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 bg-gradient-to-r from-amber-500/10 to-transparent px-3 py-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-extrabold uppercase tracking-wider text-amber-400">
            Group {group}
          </span>
          {isModified && (
            <span className="text-[8px] font-semibold uppercase tracking-wider text-sky-400 bg-sky-400/10 px-1 rounded">
              modified
            </span>
          )}
        </div>
        {isModified && (
          <button
            onClick={() => resetGroup(group)}
            className="flex items-center gap-1 text-[9px] font-medium uppercase tracking-wider text-slate-500 hover:text-amber-300 transition-colors"
            title={`Reset Group ${group} to original standings`}
          >
            <RotateCcw className="h-3 w-3" />
            reset
          </button>
        )}
      </div>

      {/* Teams (draggable) */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={teamIds} strategy={verticalListSortingStrategy}>
          <div>
            {groupData.teams.map((team, idx) => (
              <SortableTeamRow
                key={`${group}-${team.name}`}
                team={team}
                group={group}
                position={idx}
                isHost={team.note?.includes('H') ?? false}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  )
}

export function GroupGrid() {
  const { resetAllGroups } = useBracketStore()
  const [isExpanded, setIsExpanded] = useState(true)

  const anyModified = useBracketStore((state) => {
    return state.standings.some((g) => {
      const original = GROUP_STANDINGS.find((x) => x.group === g.group)
      return JSON.stringify(g.teams.map((t) => t.name)) !==
             JSON.stringify(original?.teams.map((t) => t.name))
    })
  })

  return (
    <section className="border-b border-amber-500/20 bg-slate-950/80">
      {/* Header */}
      <div className="sticky top-[57px] z-10 border-b border-white/5 bg-slate-950/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-[1900px] items-center justify-between gap-4 px-4 py-2.5 sm:px-6">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-2 text-left"
          >
            {isExpanded ? (
              <ChevronUp className="h-4 w-4 text-amber-400" />
            ) : (
              <ChevronDown className="h-4 w-4 text-amber-400" />
            )}
            <Table2 className="h-4 w-4 text-amber-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Group Stage
            </span>
            <span className="text-[10px] text-slate-500">
              · Drag teams up/down to reorder · 1st/2nd auto-fill bracket
            </span>
          </button>

          {anyModified && (
            <button
              onClick={resetAllGroups}
              className="flex items-center gap-1.5 rounded-md border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400 transition-colors hover:border-amber-500/40 hover:bg-amber-500/10 hover:text-amber-300"
            >
              <RotateCcw className="h-3 w-3" />
              Reset all groups
            </button>
          )}
        </div>
      </div>

      {/* Grid */}
      {isExpanded && (
        <div className="mx-auto max-w-[1900px] px-4 py-4 sm:px-6">
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {GROUP_STANDINGS.map((g) => (
              <GroupCard key={g.group} group={g.group} />
            ))}
          </div>

          {/* Legend */}
          <div className="mt-4 flex flex-wrap items-center gap-3 text-[10px] text-slate-500">
            <Trophy className="h-3 w-3 text-amber-400" />
            <span className="font-semibold uppercase tracking-wider">Tip:</span>
            <span>Drag the handle (⋮) on any team to reorder. Position 1 (gold) = group winner → auto-fills the bracket's <span className="text-amber-300">1{`{group}`}</span> slot. Position 2 (silver) = runner-up → fills <span className="text-amber-300">2{`{group}`}</span> slot. Position 3 (orange) may advance as a best 3rd-placed team.</span>
          </div>
        </div>
      )}
    </section>
  )
}
