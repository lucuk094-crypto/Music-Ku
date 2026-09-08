'use client'

import { Play, Plus, Music2 } from 'lucide-react'
import { usePlayer } from '@/context/PlayerContext'

export default function SongCard({ item }) {
  const { playSong, addToQueue, currentTrack, isPlaying } = usePlayer()
  const isActive = currentTrack?.videoId === item.videoId

  return (
    <div
      onClick={() => playSong(item)}
      className={`
        group relative rounded-2xl border cursor-pointer
        transition-all duration-200 overflow-hidden
        hover:-translate-y-0.5 hover:shadow-[0_8px_32px_rgba(0,0,0,0.5)]
        ${isActive
          ? 'border-brand/50 bg-brand/10'
          : 'border-white/[0.08] bg-white/[0.04] hover:bg-white/[0.07] hover:border-white/[0.14]'}
      `}
    >
      {/* Thumbnail */}
      <div className="relative aspect-video overflow-hidden bg-white/[0.06]">
        {item.thumbnail
          ? <img src={item.thumbnail} alt={item.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
          : <div className="w-full h-full flex items-center justify-center"><Music2 size={28} className="text-white/20" /></div>
        }

        {/* Overlay */}
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <div className="w-11 h-11 rounded-full bg-brand flex items-center justify-center shadow-[0_4px_20px_rgba(124,58,237,0.5)] scale-75 group-hover:scale-100 transition-transform">
            <Play size={17} className="text-white ml-0.5" fill="white" />
          </div>
        </div>

        {/* Add to queue btn */}
        <button
          onClick={e => { e.stopPropagation(); addToQueue(item) }}
          className="absolute top-2 right-2 w-7 h-7 rounded-lg bg-black/60 backdrop-blur-sm flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all hover:bg-brand"
        >
          <Plus size={13} />
        </button>

        {/* Duration */}
        {item.duration && (
          <span className="absolute bottom-2 right-2 bg-black/70 backdrop-blur-sm text-white text-[11px] font-semibold px-1.5 py-0.5 rounded-md">
            {item.duration}
          </span>
        )}

        {/* Playing indicator */}
        {isActive && isPlaying && (
          <div className="absolute top-2 left-2 flex items-end gap-[3px] h-4 px-1.5 py-1 bg-brand rounded-md">
            {[1,2,3].map(i => (
              <span key={i} className={`block w-[2.5px] bg-white rounded-full animate-bar-${i}`} style={{ height: [40,70,55][i-1]+'%' }} />
            ))}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-3">
        <p className="text-[13px] font-semibold truncate mb-0.5 leading-tight">{item.title}</p>
        <p className="text-[11.5px] text-white/45 truncate">{item.channel || item.artist || '—'}</p>
      </div>
    </div>
  )
}
