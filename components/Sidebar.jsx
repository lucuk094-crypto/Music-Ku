'use client'

import { Home, Search, ListMusic, ScrollText, Mic2, Music2 } from 'lucide-react'
import { usePlayer } from '@/context/PlayerContext'

const NAV = [
  { id: 'home',   label: 'Beranda',   icon: Home       },
  { id: 'search', label: 'Cari Lagu', icon: Search     },
  { id: 'queue',  label: 'Antrian',   icon: ListMusic  },
  { id: 'lyrics', label: 'Lirik',     icon: ScrollText },
  { id: 'artist', label: 'Artis',     icon: Mic2       },
]

export default function Sidebar({ isOpen }) {
  const { activePage, setPage, currentTrack, queue, isPlaying } = usePlayer()

  return (
    <aside className={`
      fixed left-0 top-0 bottom-[88px] z-50
      w-[240px] flex flex-col
      bg-[#111] border-r border-white/[0.08]
      transition-transform duration-200
      ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      lg:translate-x-0 lg:static lg:bottom-0
    `}>
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 pt-5 pb-6">
        <div className="w-8 h-8 rounded-[10px] bg-gradient-to-br from-brand to-brand-light flex items-center justify-center shadow-[0_0_16px_rgba(124,58,237,0.4)] flex-shrink-0">
          <Music2 size={15} className="text-white" />
        </div>
        <span className="text-[15px] font-bold tracking-tight">MusikKu</span>
      </div>

      {/* Nav */}
      <nav className="flex flex-col gap-0.5 px-3 flex-1">
        {NAV.map(({ id, label, icon: Icon }) => {
          const isActive = activePage === id
          return (
            <button
              key={id}
              onClick={() => setPage(id)}
              className={`
                flex items-center gap-2.5 w-full px-3 py-2.5 rounded-xl
                text-[13.5px] font-medium text-left transition-all duration-150
                ${isActive
                  ? 'bg-white/[0.08] text-white font-semibold'
                  : 'text-white/50 hover:bg-white/[0.05] hover:text-white/80'}
              `}
            >
              <Icon size={16} className={isActive ? 'text-brand' : ''} />
              <span className="flex-1">{label}</span>
              {id === 'queue' && queue.length > 0 && (
                <span className="bg-brand text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                  {queue.length}
                </span>
              )}
            </button>
          )
        })}
      </nav>

      {/* Mini now playing */}
      {currentTrack && (
        <div className="mx-3 mb-4 p-3 glass rounded-xl flex items-center gap-2.5">
          {currentTrack.cover
            ? <img src={currentTrack.cover} alt="" className="w-9 h-9 rounded-lg object-cover flex-shrink-0" />
            : <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                <Music2 size={14} className="text-white/40" />
              </div>
          }
          <div className="flex-1 min-w-0">
            <p className="text-[11.5px] font-semibold truncate">{currentTrack.title}</p>
            <p className="text-[11px] text-white/40 truncate">{currentTrack.artist}</p>
          </div>
          <div className={`flex items-end gap-[3px] h-4 flex-shrink-0 ${isPlaying ? '' : 'opacity-40'}`}>
            {[1,2,3,4].map(i => (
              <span
                key={i}
                className={`block w-[3px] bg-brand rounded-full ${isPlaying ? `animate-bar-${i}` : ''}`}
                style={{ height: [30, 70, 50, 90][i-1] + '%' }}
              />
            ))}
          </div>
        </div>
      )}
    </aside>
  )
}
