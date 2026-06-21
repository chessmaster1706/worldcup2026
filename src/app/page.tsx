'use client'

import { GroupGrid } from '@/components/bracket/group-grid'
import { KnockoutBracket } from '@/components/bracket/knockout-bracket'
import { Trophy } from 'lucide-react'

export default function Home() {
  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      {/* Top bar */}
      <header className="sticky top-0 z-30 border-b border-amber-500/20 bg-slate-950/95 backdrop-blur-md">
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
                Group Stage + Knockout Bracket
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Group stage grid (top) */}
      <GroupGrid />

      {/* Knockout bracket (below) */}
      <KnockoutBracket />
    </div>
  )
}
