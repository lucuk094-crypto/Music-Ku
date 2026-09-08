'use client'

import { useRef, useCallback, useEffect, useState } from 'react'
import {
  Play, Pause, SkipBack, SkipForward,
  Shuffle, Repeat, Repeat1,
  Volume2, Volume1, VolumeX,
  Heart, ScrollText, Music2,
} from 'lucide-react'
import { usePlayer } from '@/context/PlayerContext'

function fmtTime(s) {
  if (!s || isNaN(s)) return '0:00'
  const m   = Math.floor(s / 60)
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
    audioRef,
  } = usePlayer()

  const progressRef  = useRef(null)
  const [dragging, setDragging] = useState(false)
  const dragRef      = useRef(false)

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0
  const isLiked  = liked.includes(currentTrack?.videoId)
  const VolumeIcon = isMuted || volume === 0 ? VolumeX : volume < 50 ? Volume1 : Volume2
  const RepeatIcon = repeatMode === 2 ? Repeat1 : Repeat

  // ── Seek helpers ──────────────────────────────────────────────
  const getRatio = useCallback((clientX) => {
    if (!progressRef.current) return 0
    const rect = progressRef.current.getBoundingClientRect()
    return Math.max(0, Math.min(1, (clientX - rect.left) / rect.width))
  }, [])

  // Mouse drag
  const onMouseDown = useCallback((e) => {
    e.preventDefault()
    dragRef.current = true
    setDragging(true)
    seekTo(getRatio(e.clientX))
  }, [seekTo, getRatio])

  useEffect(() => {
    const onMove = (e) => { if (dragRef.current) seekTo(getRatio(e.clientX)) }
    const onUp   = ()  => { if (dragRef.current) { dragRef.current = false; setDragging(false) } }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup',   onUp)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup',   onUp)
    }
  }, [seekTo, getRatio])

  // Touch drag
  const onTouchStart = useCallback((e) => {
    dragRef.current = true
    setDragging(true)
    seekTo(getRatio(e.touches[0].clientX))
  }, [seekTo, getRatio])

  const onTouchMove = useCallback((e) => {
    if (!dragRef.current) return
    e.preventDefault()
    seekTo(getRatio(e.touches[0].clientX))
  }, [seekTo, getRatio])

  const onTouchEnd = useCallback(() => {
    dragRef.current = false
    setDragging(false)
  }, [])

  return (
    <footer className="border-t border-white/[0.08] bg-[#0a0a0a]/95 backdrop-blur-2xl z-50 safe-area-bottom">
      {/* ── DESKTOP layout ── */}
      <div className="hidden sm:grid grid-cols-3 items-center px-4 h-[88px] gap-2">

        {/* Track info */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-white/[0.06] flex-shrink-0">
            {currentTrack?.cover
              ? <img src={currentTrack.cover} alt="" className="w-full h-full object-cover" />
              : <div className="w-full h-full flex items-center justify-center">
                  <Music2 size={18} className="text-white/25" />
                </div>
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
            className={`p-1.5 rounded-lg transition-all flex-shrink-0 disabled:opacity-30 ${
              isLiked ? 'text-pink-400' : 'text-white/30 hover:text-white/60'
            }`}
          >
            <Heart size={15} fill={isLiked ? 'currentColor' : 'none'} />
          </button>
        </div>

        {/* Controls + progress */}
        <div className="flex flex-col items-center gap-2">
          <div className="flex items-center gap-0.5">
            <button onClick={toggleShuffle}
              className={`p-2 rounded-lg transition-all ${isShuffle ? 'text-brand' : 'text-white/35 hover:text-white/70'}`}>
              <Shuffle size={15} />
            </button>
            <button onClick={playPrev} className="p-2 rounded-lg text-white/50 hover:text-white transition-all">
              <SkipBack size={17} />
            </button>
            <button
              onClick={togglePlay}
              disabled={!currentTrack && !isLoading}
              className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-black hover:bg-white/90 transition-all disabled:opacity-30 disabled:cursor-not-allowed mx-1 hover:scale-105 active:scale-95"
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
            <button onClick={toggleRepeat}
              className={`p-2 rounded-lg transition-all ${repeatMode > 0 ? 'text-brand' : 'text-white/35 hover:text-white/70'}`}>
              <RepeatIcon size={15} />
            </button>
          </div>
          {/* Progress bar */}
          <div className="flex items-center gap-2 w-full max-w-[420px]">
            <span className="text-[10.5px] text-white/35 font-medium tabular-nums w-7 text-right flex-shrink-0">
              {fmtTime(currentTime)}
            </span>
            <div
              ref={progressRef}
              onMouseDown={onMouseDown}
              onTouchStart={onTouchStart}
              onTouchMove={onTouchMove}
              onTouchEnd={onTouchEnd}
              className={`progress-bar flex-1 group select-none ${dragging ? 'dragging' : ''}`}
              style={{ cursor: 'pointer' }}
            >
              <div
                className="progress-fill h-full bg-white rounded-full transition-[width] duration-100 pointer-events-none"
                style={{ width: `${progress}%` }}
              />
              <div
                className="progress-thumb absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white opacity-0 pointer-events-none -translate-x-1/2"
                style={{ left: `${progress}%` }}
              />
            </div>
            <span className="text-[10.5px] text-white/35 font-medium tabular-nums w-7 flex-shrink-0">
              {fmtTime(duration)}
            </span>
          </div>
        </div>

        {/* Right controls */}
        <div className="flex items-center gap-1.5 justify-end">
          <button onClick={() => setPage('lyrics')}
            className="p-2 rounded-lg text-white/35 hover:text-white/70 transition-all" title="Lirik (L)">
            <ScrollText size={15} />
          </button>
          <button onClick={toggleMute} className="p-2 rounded-lg text-white/35 hover:text-white/70 transition-all">
            <VolumeIcon size={15} />
          </button>
          <input
            type="range" min="0" max="100"
            value={isMuted ? 0 : volume}
            onChange={e => setVolume(+e.target.value)}
            className="volume-slider"
          />
        </div>
      </div>

      {/* ── MOBILE layout ── */}
      <div className="sm:hidden px-4 pt-3 pb-2">
        {/* Cover + info + like */}
        <div className="flex items-center gap-3 mb-3">
          <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-white/[0.06] flex-shrink-0">
            {currentTrack?.cover
              ? <img src={currentTrack.cover} alt="" className="w-full h-full object-cover" />
              : <div className="w-full h-full flex items-center justify-center">
                  <Music2 size={14} className="text-white/25" />
                </div>
            }
            {isLoading && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                <div className="w-3 h-3 rounded-full border-2 border-white/20 border-t-white animate-spin" />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-semibold truncate">
              {currentTrack?.title || 'Pilih lagu'}
            </p>
            <p className="text-[11px] text-white/40 truncate">{currentTrack?.artist || '—'}</p>
          </div>
          <button onClick={toggleLike} disabled={!currentTrack}
            className={`p-1.5 flex-shrink-0 disabled:opacity-30 transition-all ${isLiked ? 'text-pink-400' : 'text-white/30'}`}>
            <Heart size={16} fill={isLiked ? 'currentColor' : 'none'} />
          </button>
        </div>

        {/* Mobile progress */}
        <div
          ref={progressRef}
          onMouseDown={onMouseDown}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          className={`progress-bar w-full mb-1 ${dragging ? 'dragging' : ''}`}
          style={{ height: '4px', cursor: 'pointer' }}
        >
          <div className="progress-fill h-full bg-white rounded-full" style={{ width: `${progress}%` }} />
        </div>
        <div className="flex justify-between text-[10px] text-white/30 mb-2">
          <span>{fmtTime(currentTime)}</span>
          <span>{fmtTime(duration)}</span>
        </div>

        {/* Mobile controls */}
        <div className="flex items-center justify-between">
          <button onClick={toggleShuffle}
            className={`p-2 ${isShuffle ? 'text-brand' : 'text-white/35'}`}>
            <Shuffle size={16} />
          </button>
          <button onClick={playPrev} className="p-2 text-white/60">
            <SkipBack size={20} />
          </button>
          <button
            onClick={togglePlay}
            disabled={!currentTrack && !isLoading}
            className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-black disabled:opacity-30 active:scale-95 transition-transform"
          >
            {isLoading
              ? <div className="w-5 h-5 rounded-full border-2 border-black/20 border-t-black animate-spin" />
              : isPlaying
                ? <Pause size={20} fill="currentColor" />
                : <Play  size={20} fill="currentColor" className="ml-0.5" />
            }
          </button>
          <button onClick={playNext} className="p-2 text-white/60">
            <SkipForward size={20} />
          </button>
          <button onClick={toggleRepeat}
            className={`p-2 ${repeatMode > 0 ? 'text-brand' : 'text-white/35'}`}>
            <RepeatIcon size={16} />
          </button>
        </div>
      </div>
    </footer>
  )
}
