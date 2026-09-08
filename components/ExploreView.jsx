'use client'

import { useState } from 'react'
import { Compass, ChevronRight } from 'lucide-react'
import SongCard from './SongCard'
import { usePlayer } from '@/context/PlayerContext'

const ALL_GENRES = [
  { name: 'Pop',       color: 'from-pink-600 to-rose-500',     emoji: '🎵' },
  { name: 'Hip-Hop',   color: 'from-yellow-600 to-orange-500', emoji: '🎤' },
  { name: 'Rock',      color: 'from-red-700 to-red-500',       emoji: '🎸' },
  { name: 'EDM',       color: 'from-cyan-600 to-blue-500',     emoji: '🎧' },
  { name: 'K-Pop',     color: 'from-purple-600 to-pink-500',   emoji: '✨' },
  { name: 'Jazz',      color: 'from-amber-700 to-yellow-600',  emoji: '🎷' },
  { name: 'Dangdut',   color: 'from-green-600 to-emerald-500', emoji: '🥁' },
  { name: 'Indonesia', color: 'from-red-600 to-rose-400',      emoji: '🇮🇩' },
  { name: 'R&B',       color: 'from-violet-700 to-purple-500', emoji: '🎼' },
  { name: 'Classical', color: 'from-slate-600 to-gray-500',    emoji: '🎻' },
  { name: 'Reggae',    color: 'from-green-700 to-lime-500',    emoji: '🌴' },
  { name: 'Country',   color: 'from-orange-700 to-amber-500',  emoji: '🤠' },
]

function SkeletonGrid({ count = 8 }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="skeleton aspect-[4/5] rounded-2xl" />
      ))}
    </div>
  )
}

export default function ExploreView() {
  const [activeGenre, setActiveGenre] = useState(null)
  const [songs,       setSongs]       = useState([])
  const [loading,     setLoading]     = useState(false)
  const { showToast } = usePlayer()

  async function loadGenre(genre) {
    if (activeGenre === genre) { setActiveGenre(null); setSongs([]); return }
    setActiveGenre(genre)
    setLoading(true)
    setSongs([])
    try {
      const res  = await fetch(`/api/trending?genre=${encodeURIComponent(genre)}`)
      const data = await res.json()
      setSongs(data.success ? data.results : [])
      if (!data.success) showToast(data.message || 'Gagal memuat genre')
    } catch {
      showToast('Gagal memuat genre')
      setSongs([])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="px-4 sm:px-6 py-5 pb-36">
      <div className="flex items-center gap-2 mb-6">
        <Compass size={18} className="text-brand" />
        <h2 className="text-xl font-bold tracking-tight">Jelajahi Genre</h2>
      </div>

      {/* Genre grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-8">
        {ALL_GENRES.map(({ name, color, emoji }) => {
          const isActive = activeGenre === name
          return (
            <button
              key={name}
              onClick={() => loadGenre(name)}
              className={`genre-card h-20 sm:h-24 flex flex-col items-start justify-end p-3.5 bg-gradient-to-br ${color}
                ${isActive ? 'ring-2 ring-white/50 scale-[0.97]' : ''}
                transition-all duration-200`}
            >
              <span className="text-xl mb-1">{emoji}</span>
              <span className="text-sm font-bold text-white">{name}</span>
              {isActive && (
                <span className="text-[10px] text-white/70">Dipilih</span>
              )}
            </button>
          )
        })}
      </div>

      {/* Genre results */}
      {activeGenre && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <h3 className="text-lg font-bold">{activeGenre}</h3>
            <ChevronRight size={16} className="text-white/30" />
            <span className="text-white/40 text-sm">
              {loading ? 'Memuat...' : `${songs.length} lagu`}
            </span>
          </div>
          {loading
            ? <SkeletonGrid count={8} />
            : songs.length > 0
              ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3">
                  {songs.map(item => <SongCard key={item.videoId} item={item} />)}
                </div>
              )
              : <p className="text-white/30 text-sm text-center py-12">Tidak ada hasil</p>
          }
        </div>
      )}

      {/* Hint when nothing selected */}
      {!activeGenre && (
        <div className="flex flex-col items-center justify-center py-8 gap-2 text-white/20">
          <Compass size={32} />
          <p className="text-sm">Pilih genre untuk melihat lagu</p>
        </div>
      )}
    </div>
  )
}
