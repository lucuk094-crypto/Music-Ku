'use client'
import { useRef, useCallback, useEffect, useState } from 'react'
import Image from 'next/image'
import {
  Play, Pause, SkipBack, SkipForward, Shuffle, Repeat, Repeat1,
  Volume2, Volume1, VolumeX, Heart, ScrollText, ListMusic, Music2,
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
    currentTrack, isPlaying, isLoading, currentTime, duration,
    isShuffle, repeatMode, isMuted, volume, liked,
    togglePlay, playNext, playPrev, toggleShuffle, toggleRepeat,
    toggleMute, setVolume, seekTo, toggleLike, setPage, audioRef,
    queue,
  } = usePlayer()

  const progressRef = useRef(null)
  const [dragging, setDragging] = useState(false)
  const dragRef = useRef(false)

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0
  const isLiked = liked.includes(currentTrack?.videoId)
  const VolumeIcon = isMuted || volume === 0 ? VolumeX : volume < 50 ? Volume1 : Volume2
  const RepeatIcon = repeatMode === 2 ? Repeat1 : Repeat

  // ── Seek helpers ────────────────────────────────────────────────
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
    const onUp   = () => { if (dragRef.current) { dragRef.current = false; setDragging(false) } }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp) }
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

  if (!currentTrack) {
    return (
      <div className="hidden sm:flex items-center justify-center h-[var(--player-h)] bg-black/60 backdrop-blur-xl border-t border-white/[0.06] px-6">
        <div className="flex items-center gap-3 text-white/20">
          <Music2 size={20} />
          <span className="text-sm">Pilih lagu untuk diputar</span>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* ── DESKTOP PLAYER ──────────────────────────────────────── */}
      <div className="hidden sm:flex items-center gap-4 h-[var(--player-h)] bg-black/70 backdrop-blur-xl border-t border-white/[0.06] px-4 lg:px-6 select-none shrink-0">

        {/* Track info */}
        <div className="flex items-center gap-3 w-[220px] lg:w-[260px] min-w-0">
          <div className="w-12 h-12 rounded-xl overflow-hidden bg-white/10 flex-shrink-0 relative">
            {currentTrack?.cover ? (
              <Image
                src={currentTrack.cover}
                alt={currentTrack.title}
                fill
                className="object-cover"
                sizes="48px"
                unoptimized
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Music2 size={20} className="text-white/30" />
              </div>
            )}
            {isLoading && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <div className="flex gap-0.5 items-end h-5">
                  {[1,2,3].map(i => (
                    <div key={i} className={`w-0.5 bg-white rounded-full animate-bar-${i}`} style={{ height: '100%' }} />
                  ))}
                </div>
              </div>
            )}
          </div>
          <div className="min-w-0">
            <p className="text-[13px] font-semibold text-white truncate">{currentTrack?.title || '—'}</p>
            <p className="text-[11.5px] text-white/40 truncate">{currentTrack?.artist || '—'}</p>
            {currentTrack?.album && (
              <p className="text-[10.5px] text-white/25 truncate">{currentTrack.album}</p>
            )}
          </div>
        </div>

        {/* Center: Controls + Progress */}
        <div className="flex-1 flex flex-col items-center gap-1.5 min-w-0">
          {/* Controls row */}
          <div className="flex items-center gap-3">
            <button
              onClick={toggleShuffle}
              className={`p-1.5 rounded-lg transition-all ${isShuffle ? 'text-brand' : 'text-white/35 hover:text-white/70'}`}
              title="Acak (S)"
            >
              <Shuffle size={16} />
            </button>
            <button
              onClick={playPrev}
              className="p-2 rounded-lg text-white/70 hover:text-white transition-all hover:bg-white/10 active:scale-95"
              title="Sebelumnya (P)"
            >
              <SkipBack size={18} />
            </button>
            <button
              onClick={togglePlay}
              disabled={isLoading}
              className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center hover:bg-white/90 transition-all active:scale-95 disabled:opacity-50 shadow-lg"
              title="Play/Pause (Space)"
            >
              {isLoading ? (
                <div className="flex gap-0.5 items-end h-4">
                  {[1,2,3].map(i => (
                    <div key={i} className={`w-0.5 bg-black rounded-full animate-bar-${i}`} style={{ height: '100%' }} />
                  ))}
                </div>
              ) : isPlaying ? (
                <Pause size={18} fill="currentColor" />
              ) : (
                <Play size={18} fill="currentColor" className="ml-0.5" />
              )}
            </button>
            <button
              onClick={playNext}
              className="p-2 rounded-lg text-white/70 hover:text-white transition-all hover:bg-white/10 active:scale-95"
              title="Berikutnya (N)"
            >
              <SkipForward size={18} />
            </button>
            <button
              onClick={toggleRepeat}
              className={`p-1.5 rounded-lg transition-all ${repeatMode > 0 ? 'text-brand' : 'text-white/35 hover:text-white/70'}`}
              title="Ulangi (R)"
            >
              <RepeatIcon size={16} />
            </button>
          </div>

          {/* Progress bar */}
          <div className="flex items-center gap-2 w-full max-w-lg">
            <span className="text-[10.5px] text-white/35 w-8 text-right tabular-nums">{fmtTime(currentTime)}</span>
            <div
              ref={progressRef}
              className={`progress-bar flex-1 ${dragging ? 'dragging' : ''}`}
              onMouseDown={onMouseDown}
              onTouchStart={onTouchStart}
              onTouchMove={onTouchMove}
              onTouchEnd={onTouchEnd}
            >
              <div className="progress-fill h-full bg-white/40 rounded-full transition-none" style={{ width: `${progress}%` }} />
              <div
                className="progress-thumb absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-md opacity-0 transition-opacity"
                style={{ left: `calc(${progress}% - 6px)` }}
              />
            </div>
            <span className="text-[10.5px] text-white/35 w-8 tabular-nums">{fmtTime(duration)}</span>
          </div>
        </div>

        {/* Right controls */}
        <div className="flex items-center gap-1.5 w-[220px] lg:w-[260px] justify-end">
          <button
            onClick={toggleLike}
            className={`p-2 rounded-lg transition-all ${isLiked ? 'text-pink-500 hover:text-pink-400' : 'text-white/35 hover:text-white/70'}`}
            title="Suka (L)"
          >
            <Heart size={16} fill={isLiked ? 'currentColor' : 'none'} />
          </button>
          <button
            onClick={() => setPage('lyrics')}
            className="p-2 rounded-lg text-white/35 hover:text-white/70 transition-all"
            title="Lirik"
          >
            <ScrollText size={16} />
          </button>
          <button
            onClick={() => setPage('queue')}
            className={`p-2 rounded-lg transition-all ${queue?.length > 0 ? 'text-brand' : 'text-white/35 hover:text-white/70'}`}
            title="Antrian"
          >
            <ListMusic size={16} />
          </button>
          <div className="flex items-center gap-1.5 ml-1">
            <button onClick={toggleMute} className="p-1.5 text-white/35 hover:text-white/70 transition-all">
              <VolumeIcon size={15} />
            </button>
            <input
              type="range"
              min={0}
              max={100}
              value={isMuted ? 0 : volume}
              onChange={e => setVolume(+e.target.value)}
              className="volume-slider"
              title={`Volume: ${volume}%`}
            />
          </div>
        </div>
      </div>

      {/* ── MOBILE PLAYER ───────────────────────────────────────── */}
      <div className="sm:hidden fixed bottom-[var(--bottom-nav-h)] left-0 right-0 z-40 bg-black/80 backdrop-blur-xl border-t border-white/[0.06] px-3 py-2.5 select-none">
        <div className="flex items-center gap-3">
          {/* Cover */}
          <div className="w-11 h-11 rounded-lg overflow-hidden bg-white/10 flex-shrink-0 relative">
            {currentTrack?.cover ? (
              <Image
                src={currentTrack.cover}
                alt={currentTrack.title}
                fill
                className="object-cover"
                sizes="44px"
                unoptimized
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Music2 size={18} className="text-white/30" />
              </div>
            )}
            {isLoading && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <div className="flex gap-0.5 items-end h-4">
                  {[1,2,3].map(i => (
                    <div key={i} className={`w-0.5 bg-white rounded-full animate-bar-${i}`} style={{ height: '100%' }} />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <p className="text-[12.5px] font-semibold text-white truncate">{currentTrack?.title || 'Pilih lagu'}</p>
            <p className="text-[11px] text-white/40 truncate">{currentTrack?.artist || '—'}</p>
          </div>

          {/* Like button */}
          <button onClick={toggleLike} className={`p-2 ${isLiked ? 'text-pink-500' : 'text-white/35'} transition-all`}>
            <Heart size={17} fill={isLiked ? 'currentColor' : 'none'} />
          </button>

          {/* Play/Pause */}
          <button
            onClick={togglePlay}
            disabled={isLoading}
            className="w-9 h-9 rounded-full bg-white text-black flex items-center justify-center active:scale-95 disabled:opacity-50"
          >
            {isLoading ? (
              <div className="flex gap-0.5 items-end h-3.5">
                {[1,2,3].map(i => (
                  <div key={i} className={`w-0.5 bg-black rounded-full animate-bar-${i}`} style={{ height: '100%' }} />
                ))}
              </div>
            ) : isPlaying ? (
              <Pause size={15} fill="currentColor" />
            ) : (
              <Play size={15} fill="currentColor" className="ml-0.5" />
            )}
          </button>

          {/* Next */}
          <button onClick={playNext} className="p-1.5 text-white/50 hover:text-white transition-all">
            <SkipForward size={17} />
          </button>
        </div>

        {/* Mobile progress bar */}
        <div
          ref={progressRef}
          className={`progress-bar mt-2 ${dragging ? 'dragging' : ''}`}
          onMouseDown={onMouseDown}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          <div className="progress-fill h-full bg-white/40 rounded-full" style={{ width: `${progress}%` }} />
          <div
            className="progress-thumb absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-md opacity-0"
            style={{ left: `calc(${progress}% - 6px)` }}
          />
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-[9.5px] text-white/25 tabular-nums">{fmtTime(currentTime)}</span>
          <span className="text-[9.5px] text-white/25 tabular-nums">{fmtTime(duration)}</span>
        </div>
      </div>
    </>
  )
}
