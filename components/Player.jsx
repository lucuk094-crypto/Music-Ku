'use client'

import { useRef } from 'react'
import {
  Play, Pause, SkipBack, SkipForward,
  Shuffle, Repeat, Repeat1, Volume2, Volume1, VolumeX,
  Heart, ScrollText, Music2,
} from 'lucide-react'
import { usePlayer } from '@/context/PlayerContext'

function fmtTime(s) {
  if (!s || isNaN(s)) return '0:00'
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  return `${m}:${sec.toString().padStart(2, '0')}`
}

export default function Player() {
  const {
    currentTrack, isPlaying, isLoading,
    currentTime, duration,
    isShuffle, repeatMode, isMuted, volume,
    liked,
    togglePlay, playNext, playPrev,
    toggleShuffle, toggleRepeat, toggleMute,
    setVolume, seekTo, toggleLike, setPage,
  } = usePlayer()

  const progressRef = useRef(null)

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0
  const isLiked  = liked.includes(currentTrack?.videoId)

  function handleProgressClick(e) {
    if (!progressRef.current || !duration) return
    const rect  = progressRef.current.getBoundingClientRect()
    const ratio = (e.clientX - rect.left) / rect.width
    seekTo(Math.max(0, Math.min(1, ratio)))
  }

  const VolumeIcon = isMuted || volume === 0 ? VolumeX : volume < 50 ? Volume1 : Volume2
  const RepeatIcon = repeatMode === 2 ? Repeat1 : Repeat

  return (
    <footer className="h-[88px] border-t border-white/[0.08] bg-[#0a0a0a]/90 backdrop-blur-2xl flex items-center px-4 gap-3 z-50">

      {/* Track info */}
      <div className="flex items-center gap-3 w-[220px] min-w-0 flex-shrink-0">
        <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-white/[0.06] flex-shrink-0">
          {currentTrack?.cover
            ? <img src={currentTrack.cover} alt="" className="w-full h-full object-cover" />
            : <div className="w-full h-full flex items-center justify-center"><Music2 size={18} className="text-white/25" /></div>
          }
          {isLoading && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
              <div className="w-4 h-4 rounded-full border-2 border-white/20 border-t-white animate-spin" />
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[12.5px] font-semibold truncate leading-tight">
            {currentTrack?.title || 'Pilih lagu untuk diputar'}
          </p>
          <p className="text-[11.5px] text-white/40 truncate">{currentTrack?.artist || '—'}</p>
        </div>
        <button
          onClick={toggleLike}
          disabled={!currentTrack}
          className={`p-1.5 rounded-lg transition-all flex-shrink-0 ${
            isLiked ? 'text-pink-400' : 'text-white/30 hover:text-white/60'
          } disabled:opacity-30`}
        >
          <Heart size={15} fill={isLiked ? 'currentColor' : 'none'} />
        </button>
      </div>

      {/* Controls + Progress */}
      <div className="flex flex-col items-center gap-2 flex-1 min-w-0">
        <div className="flex items-center gap-1">
          <button onClick={toggleShuffle} className={`p-2 rounded-lg transition-all ${isShuffle ? 'text-brand' : 'text-white/35 hover:text-white/70'}`}>
            <Shuffle size={15} />
          </button>
          <button onClick={playPrev} className="p-2 rounded-lg text-white/50 hover:text-white transition-all">
            <SkipBack size={17} />
          </button>
          <button
            onClick={togglePlay}
            disabled={!currentTrack && !isLoading}
            className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-black hover:bg-white/90 transition-all disabled:opacity-30 disabled:cursor-not-allowed mx-1 flex-shrink-0 hover:scale-105"
          >
            {isLoading
              ? <div className="w-4 h-4 rounded-full border-2 border-black/20 border-t-black animate-spin" />
              : isPlaying
                ? <Pause size={16} fill="currentColor" />
                : <Play  size={16} fill="currentColor" className="ml-0.5" />
            }
          </button>
          <button onClick={playNext} className="p-2 rounded-lg text-white/50 hover:text-white transition-all">
            <SkipForward size={17} />
          </button>
          <button onClick={toggleRepeat} className={`p-2 rounded-lg transition-all ${repeatMode > 0 ? 'text-brand' : 'text-white/35 hover:text-white/70'}`}>
            <RepeatIcon size={15} />
          </button>
        </div>

        {/* Progress */}
        <div className="flex items-center gap-2 w-full max-w-md">
          <span className="text-[10.5px] text-white/35 font-medium tabular-nums w-7 text-right flex-shrink-0">
            {fmtTime(currentTime)}
          </span>
          <div
            ref={progressRef}
            onClick={handleProgressClick}
            className="progress-bar flex-1 group"
          >
            <div
              className="progress-fill h-full bg-white rounded-full transition-[width] duration-100 group-hover:bg-brand"
              style={{ width: `${progress}%` }}
            />
            <div
              className="progress-thumb absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white opacity-0 group-hover:opacity-100 transition-opacity -translate-x-1/2"
              style={{ left: `${progress}%` }}
            />
          </div>
          <span className="text-[10.5px] text-white/35 font-medium tabular-nums w-7 flex-shrink-0">
            {fmtTime(duration)}
          </span>
        </div>
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-1.5 w-[220px] justify-end flex-shrink-0">
        <button
          onClick={() => setPage('lyrics')}
          className="p-2 rounded-lg text-white/35 hover:text-white/70 transition-all"
          title="Lirik"
        >
          <ScrollText size={15} />
        </button>
        <button onClick={toggleMute} className="p-2 rounded-lg text-white/35 hover:text-white/70 transition-all">
          <VolumeIcon size={15} />
        </button>
        <input
          type="range"
          min="0" max="100"
          value={isMuted ? 0 : volume}
          onChange={e => setVolume(+e.target.value)}
          className="volume-slider"
        />
      </div>

    </footer>
  )
}
