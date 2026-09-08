'use client'

import { useEffect, useRef, useMemo } from 'react'
import { Music2 } from 'lucide-react'
import { usePlayer } from '@/context/PlayerContext'

function parseSynced(syncedStr) {
  if (!syncedStr) return []
  return syncedStr.split('\n').map(line => {
    const m = line.match(/\[(\d+):(\d+(?:\.\d+)?)\](.*)/)
    if (!m) return null
    return { time: parseFloat(m[1]) * 60 + parseFloat(m[2]), text: m[3].trim() }
  }).filter(Boolean)
}

export default function LyricsView() {
  const { currentTrack, currentTime } = usePlayer()
  const containerRef = useRef(null)
  const activeRef    = useRef(null)

  const lyrics     = currentTrack?.lyrics
  const synced     = useMemo(() => parseSynced(lyrics?.synced), [lyrics?.synced])

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
    activeRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [activeIdx])

  const { audioRef } = usePlayer()
  function seekToLine(time) {
    if (audioRef.current) audioRef.current.currentTime = time
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-5 p-6 pb-5 flex-shrink-0">
        <div className="w-24 h-24 rounded-2xl overflow-hidden bg-white/[0.06] flex-shrink-0 shadow-xl">
          {currentTrack?.cover
            ? <img src={currentTrack.cover} alt="" className="w-full h-full object-cover" />
            : <div className="w-full h-full flex items-center justify-center"><Music2 size={28} className="text-white/20" /></div>
          }
        </div>
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-brand mb-1.5">
            {currentTrack?.album || '—'}
          </p>
          <h2 className="text-2xl font-bold tracking-tight truncate">{currentTrack?.title || '—'}</h2>
          <p className="text-sm text-white/50 mt-1">{currentTrack?.artist || '—'}</p>
        </div>
      </div>

      {/* Lyrics body */}
      <div ref={containerRef} className="flex-1 overflow-y-auto px-6 pb-32">
        {!currentTrack ? (
          <div className="flex flex-col items-center justify-center h-48 gap-3 text-white/25">
            <Music2 size={36} />
            <p className="text-sm">Putar lagu untuk melihat lirik</p>
          </div>
        ) : !lyrics ? (
          <div className="flex flex-col items-center justify-center h-48 gap-3 text-white/25">
            <Music2 size={36} />
            <p className="text-sm">Lirik tidak tersedia</p>
          </div>
        ) : synced.length > 0 ? (
          <div className="flex flex-col gap-0.5">
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
          </div>
        ) : (
          <pre className="text-sm text-white/40 leading-8 whitespace-pre-line font-sans">
            {lyrics.plain}
          </pre>
        )}
      </div>
    </div>
  )
}
