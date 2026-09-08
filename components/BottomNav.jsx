'use client'

import { Home, Search, Compass, ListMusic, Mic2 } from 'lucide-react'
import { usePlayer } from '@/context/PlayerContext'

const TABS = [
  { id: 'home',    label: 'Beranda',  icon: Home     },
  { id: 'search',  label: 'Cari',     icon: Search   },
  { id: 'explore', label: 'Jelajahi', icon: Compass  },
  { id: 'queue',   label: 'Antrian',  icon: ListMusic},
  { id: 'artist',  label: 'Artis',    icon: Mic2     },
]

export default function BottomNav() {
  const { activePage, setPage, queue } = usePlayer()

  return (
    <nav className="sm:hidden flex items-center bg-[#111]/95 backdrop-blur-xl border-t border-white/[0.08] safe-area-bottom">
      {TABS.map(({ id, label, icon: Icon }) => {
        const isActive = activePage === id
        return (
          <button
            key={id}
            onClick={() => setPage(id)}
            className={`flex-1 flex flex-col items-center gap-1 py-2.5 transition-all ${
              isActive ? 'text-brand' : 'text-white/35'
            }`}
          >
            <div className="relative">
              <Icon size={20} />
              {id === 'queue' && queue.length > 0 && (
                <span className="absolute -top-1 -right-1.5 w-3.5 h-3.5 bg-brand rounded-full text-[8px] font-bold text-white flex items-center justify-center">
                  {queue.length > 9 ? '9+' : queue.length}
                </span>
              )}
            </div>
            <span className="text-[10px] font-medium">{label}</span>
          </button>
        )
      })}
    </nav>
  )
}
