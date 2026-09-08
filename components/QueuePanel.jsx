'use client'

import { Music2, X, Trash2, MoveRight } from 'lucide-react'
import { usePlayer } from '@/context/PlayerContext'

function fmtTime(s) {
  if (!s || isNaN(s)) return ''
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  return `${m}:${sec.toString().padStart(2, '0')}`
}

export default function QueuePanel() {
  const { queue, queueIndex, playSong, removeFromQueue, clearQueue } = usePlayer()

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-5 flex-shrink-0">
        <h2 className="text-xl font-bold tracking-tight">Antrian Lagu</h2>
        {queue.length > 0 && (
          <button
            onClick={clearQueue}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/[0.08] text-white/40 hover:text-red-400 hover:border-red-400/30 hover:bg-red-400/5 text-[12.5px] font-medium transition-all"
          >
            <Trash2 size={13} />
            Kosongkan
          </button>
        )}
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-4 pb-32">
        {queue.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 gap-3 text-white/20">
            <Music2 size={36} />
            <p className="text-sm">Antrian kosong</p>
            <p className="text-xs text-white/15">Tambahkan lagu dari hasil pencarian</p>
          </div>
        ) : (
          <div className="flex flex-col gap-1">
            {queue.map((item, i) => {
              const isActive = i === queueIndex
              return (
                <div
                  key={`${item.videoId}-${i}`}
                  onClick={() => { playSong(item) }}
                  className={`
                    group flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all
                    ${isActive
                      ? 'bg-brand/10 border border-brand/30'
                      : 'border border-transparent hover:bg-white/[0.04] hover:border-white/[0.08]'}
                  `}
                >
                  <span className="w-5 text-center flex-shrink-0">
                    {isActive
                      ? <MoveRight size={14} className="text-brand mx-auto" />
                      : <span className="text-[12px] text-white/25">{i + 1}</span>
                    }
                  </span>

                  {item.thumbnail
                    ? <img src={item.thumbnail} alt="" className="w-10 h-10 rounded-lg object-cover flex-shrink-0 bg-white/[0.06]" loading="lazy" />
                    : <div className="w-10 h-10 rounded-lg bg-white/[0.06] flex items-center justify-center flex-shrink-0">
                        <Music2 size={14} className="text-white/25" />
                      </div>
                  }

                  <div className="flex-1 min-w-0">
                    <p className={`text-[13px] font-semibold truncate ${isActive ? 'text-white' : ''}`}>
                      {item.title}
                    </p>
                    <p className="text-[11.5px] text-white/35 truncate">{item.artist || '—'}</p>
                  </div>

                  <span className="text-[11.5px] text-white/25 flex-shrink-0">{item.duration}</span>

                  <button
                    onClick={e => { e.stopPropagation(); removeFromQueue(i) }}
                    className="p-1.5 rounded-lg text-white/20 hover:text-red-400 hover:bg-red-400/10 opacity-0 group-hover:opacity-100 transition-all flex-shrink-0"
                  >
                    <X size={13} />
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
