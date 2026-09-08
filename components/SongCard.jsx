'use client'
import { useState } from 'react'
import Image from 'next/image'
import { Play, Pause, Plus, Music2, Clock } from 'lucide-react'
import { usePlayer } from '@/context/PlayerContext'

export default function SongCard({ item }) {
  const { playSong, addToQueue, currentTrack, isPlaying } = usePlayer()
  const [imgErr, setImgErr] = useState(false)
  const isActive = currentTrack?.videoId === item.videoId

  return (
    <div
      onClick={() => playSong(item)}
      className={`
        group relative rounded-2xl border cursor-pointer transition-all duration-200 overflow-hidden
        hover:-translate-y-0.5 hover:shadow-[0_8px_32px_rgba(0,0,0,0.5)]
        ${isActive
          ? 'border-brand/50 bg-brand/10'
          : 'border-white/[0.08] bg-white/[0.04] hover:bg-white/[0.07] hover:border-white/[0.14]'
        }
      `}
    >
      {/* Thumbnail */}
      <div className="aspect-video relative bg-white/10 overflow-hidden">
        {item.thumbnail && !imgErr ? (
          <Image
            src={item.thumbnail}
            alt={item.title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            onError={() => setImgErr(true)}
            sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 16vw"
            unoptimized
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Music2 size={28} className="text-white/20" />
          </div>
        )}

        {/* Overlay on hover */}
        <div className={`absolute inset-0 bg-black/40 transition-opacity duration-200 ${isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`} />

        {/* Add to queue btn */}
        <button
          onClick={(e) => { e.stopPropagation(); addToQueue(item) }}
          className="absolute top-2 right-2 w-7 h-7 rounded-lg bg-black/60 backdrop-blur-sm flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all hover:bg-brand active:scale-90 z-10"
          title="Tambah ke antrian"
        >
          <Plus size={13} />
        </button>

        {/* Duration badge */}
        {item.duration && (
          <div className="absolute bottom-2 right-2 flex items-center gap-1 bg-black/70 backdrop-blur-sm text-white/80 text-[10px] font-medium px-1.5 py-0.5 rounded-md">
            <Clock size={9} />
            {item.duration}
          </div>
        )}

        {/* Center play button */}
        <div className={`absolute inset-0 flex items-center justify-center transition-all duration-200 ${isActive || true ? '' : ''}`}>
          <div className={`w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-xl transition-all duration-200 ${isActive ? 'opacity-100 scale-100' : 'opacity-0 group-hover:opacity-100 scale-75 group-hover:scale-100'}`}>
            {isActive && isPlaying ? (
              <Pause size={16} fill="black" className="text-black" />
            ) : (
              <Play size={16} fill="black" className="text-black ml-0.5" />
            )}
          </div>
        </div>

        {/* Playing indicator overlay */}
        {isActive && isPlaying && (
          <div className="absolute bottom-2 left-2 flex gap-0.5 items-end h-4">
            {[1,2,3].map(i => (
              <div key={i} className={`w-0.5 bg-white rounded-full animate-bar-${i}`} style={{ height: '100%' }} />
            ))}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-2.5 pb-3">
        <p className={`text-[12.5px] font-semibold leading-snug truncate mb-0.5 ${isActive ? 'text-brand-light' : 'text-white'}`}>
          {item.title}
        </p>
        <p className="text-[11px] text-white/40 truncate">
          {item.channel || item.artist || '—'}
        </p>
        {item.views && (
          <p className="text-[10px] text-white/20 truncate mt-0.5">{item.views}</p>
        )}
      </div>
    </div>
  )
}
