'use client'
import { useEffect, useRef, useMemo, useState } from 'react'
import Image from 'next/image'
import { Music2, ScrollText, Loader2, RefreshCw } from 'lucide-react'
import { usePlayer } from '@/context/PlayerContext'

function parseSynced(syncedStr) {
  if (!syncedStr) return []
  return syncedStr
    .split('\n')
    .map(line => {
      const m = line.match(/\[(\d+):(\d+(?:\.\d+)?)\](.*)/)
      if (!m) return null
      return { time: parseFloat(m[1]) * 60 + parseFloat(m[2]), text: m[3].trim() }
    })
    .filter(Boolean)
}

export default function LyricsView() {
  const { currentTrack, currentTime, audioRef, dispatch } = usePlayer()
  const containerRef = useRef(null)
  const activeRef    = useRef(null)
  const [loading, setLoading]   = useState(false)
  const [coverErr, setCoverErr] = useState(false)

  const lyrics = currentTrack?.lyrics
  const synced = useMemo(() => parseSynced(lyrics?.synced), [lyrics?.synced])

  // Find active line index
  const activeIdx = useMemo(() => {
    if (!synced.length) return -1
    let idx = -1
    for (let i = synced.length - 1; i >= 0; i--) {
      if (currentTime >= synced[i].time) { idx = i; break }
    }
    return idx
  }, [synced, currentTime])

  // Auto-scroll to active line
  useEffect(() => {
    if (activeRef.current) {
      activeRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [activeIdx])

  // Fetch lyrics manually if not loaded
  async function fetchLyrics() {
    if (!currentTrack || loading) return
    setLoading(true)
    try {
      const params = new URLSearchParams({
        title:  currentTrack.title  || '',
        artist: currentTrack.artist || '',
      })
      const res  = await fetch(`/api/lyrics?${params}`)
      const data = await res.json()
      if (data.success && data.lyrics) {
        dispatch({
          type:    'SET_TRACK',
          payload: { ...currentTrack, lyrics: data.lyrics },
        })
      }
    } catch { /* ignore */ } finally {
      setLoading(false)
    }
  }

  function seekToLine(time) {
    if (audioRef.current) audioRef.current.currentTime = time
  }

  return (
    <div className="flex-1 overflow-hidden flex flex-col">
      {/* ── Header ── */}
      <div className="flex items-center gap-4 px-4 sm:px-6 py-4 border-b border-white/[0.06] flex-shrink-0">
        <div className="w-12 h-12 rounded-xl overflow-hidden bg-white/10 flex-shrink-0 relative">
          {currentTrack?.cover && !coverErr ? (
            <Image
              src={currentTrack.cover}
              alt={currentTrack.title || 'Cover'}
              fill
              className="object-cover"
              sizes="48px"
              onError={() => setCoverErr(true)}
              unoptimized
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Music2 size={20} className="text-white/30" />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[10.5px] text-white/30 uppercase tracking-wider mb-0.5">
            {currentTrack?.album || 'Album'}
          </p>
          <h2 className="text-sm font-bold text-white truncate">
            {currentTrack?.title || '—'}
          </h2>
          <p className="text-[11.5px] text-white/40 truncate">{currentTrack?.artist || '—'}</p>
        </div>
        <div className="flex items-center gap-1.5">
          <ScrollText size={15} className="text-brand" />
          {currentTrack && !lyrics && !loading && (
            <button
              onClick={fetchLyrics}
              className="p-1.5 rounded-lg text-white/30 hover:text-white/70 transition-all"
              title="Muat lirik"
            >
              <RefreshCw size={14} />
            </button>
          )}
        </div>
      </div>

      {/* ── Lyrics body ── */}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 space-y-0.5"
      >
        {!currentTrack ? (
          <div className="flex flex-col items-center justify-center h-full gap-4 text-white/20 select-none">
            <Music2 size={48} />
            <p className="text-sm text-center">Putar lagu untuk melihat lirik</p>
          </div>
        ) : loading ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-white/30">
            <Loader2 size={24} className="animate-spin" />
            <p className="text-sm">Memuat lirik…</p>
          </div>
        ) : !lyrics ? (
          <div className="flex flex-col items-center justify-center h-full gap-4 text-white/20 select-none">
            <ScrollText size={40} />
            <p className="text-sm text-center">Lirik tidak tersedia untuk lagu ini</p>
            <button
              onClick={fetchLyrics}
              className="flex items-center gap-2 text-xs text-white/30 hover:text-white/60 transition-colors"
            >
              <RefreshCw size={12} />
              Coba lagi
            </button>
          </div>
        ) : synced.length > 0 ? (
          <div className="max-w-xl mx-auto w-full py-8">
            {synced.map((line, i) => (
              <div
                key={i}
                ref={i === activeIdx ? activeRef : null}
                onClick={() => seekToLine(line.time)}
                className={`lyric-line ${i === activeIdx ? 'active' : i < activeIdx ? 'past' : ''}`}
              >
                {line.text || <span className="opacity-30">·</span>}
              </div>
            ))}
            {/* Spacer so last lines can scroll to center */}
            <div className="h-32" />
          </div>
        ) : (
          <div className="max-w-xl mx-auto w-full py-8">
            <pre className="text-white/60 text-sm leading-relaxed whitespace-pre-wrap font-sans">
              {lyrics.plain}
            </pre>
          </div>
        )}
      </div>
    </div>
  )
}
