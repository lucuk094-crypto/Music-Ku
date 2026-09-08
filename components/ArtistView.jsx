'use client'
import { useState } from 'react'
import Image from 'next/image'
import { Search, Users, Music2, Play, Disc3, Clock } from 'lucide-react'
import { usePlayer } from '@/context/PlayerContext'

function fmtFans(n) {
  if (!n) return '—'
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'Jt'
  if (n >= 1_000)     return (n / 1_000).toFixed(0) + 'Rb'
  return n.toString()
}

function fmtSec(s) {
  if (!s) return '—'
  const m   = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  return `${m}:${sec.toString().padStart(2, '0')}`
}

export default function ArtistView() {
  const [query,   setQuery]   = useState('')
  const [artist,  setArtist]  = useState(null)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')
  const [picErr,  setPicErr]  = useState(false)
  const [playingIdx, setPlayingIdx] = useState(null)

  const { playSong, showToast, currentTrack, isPlaying } = usePlayer()

  async function doSearch() {
    const name = query.trim()
    if (!name) return
    setLoading(true); setError(''); setArtist(null); setPicErr(false); setPlayingIdx(null)
    try {
      const res  = await fetch(`/api/artist?name=${encodeURIComponent(name)}`)
      const data = await res.json()
      if (data.success) setArtist(data.artist)
      else setError(data.message || 'Artis tidak ditemukan')
    } catch {
      setError('Gagal mencari artis')
    } finally {
      setLoading(false)
    }
  }

  // Play: try YouTube search first, fallback to Deezer 30s preview
  async function playTrack(track, artistName, idx) {
    setPlayingIdx(idx)
    showToast(`Memuat: ${track.title}…`)
    try {
      // 1) Search YouTube
      const res  = await fetch(`/api/search?q=${encodeURIComponent(`${artistName} ${track.title} official`)}`)
      const data = await res.json()
      const first = data.results?.[0]
      if (first) {
        playSong(first)
        return
      }
    } catch { /* fall through */ }

    // 2) Fallback: Deezer 30s preview
    if (track.preview) {
      showToast(`Preview 30 detik: ${track.title}`)
      playSong({
        videoId:   `deezer-${track.deezerId}`,
        title:     track.title,
        artist:    artistName,
        album:     track.album,
        thumbnail: track.cover,
        channel:   artistName,
        duration:  fmtSec(track.duration),
        // Special flag for direct audio
        _previewUrl: track.preview,
      })
      return
    }

    showToast('Lagu tidak ditemukan')
    setPlayingIdx(null)
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 sm:px-6 pb-8">
      <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2 pt-2">
        <Search size={16} className="text-brand" />
        Cari Artis
      </h2>

      {/* Search bar */}
      <div className="flex gap-2 mb-5">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/25" />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && doSearch()}
            placeholder="Nama artis..."
            className="w-full bg-white/[0.05] border border-white/[0.08] rounded-xl px-3 py-2.5 pl-8 text-[13.5px] text-white placeholder-white/25 outline-none focus:border-white/20 transition-all"
          />
        </div>
        <button
          onClick={doSearch}
          disabled={loading}
          className="flex items-center gap-2 bg-brand hover:bg-brand-dark text-white font-semibold px-4 py-2.5 rounded-xl text-[13px] transition-all active:scale-95 disabled:opacity-50"
        >
          {loading
            ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            : <Search size={14} />
          }
          Cari
        </button>
      </div>

      {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

      {!artist && !error && !loading && (
        <div className="flex flex-col items-center justify-center h-48 gap-3 text-white/20">
          <Users size={40} />
          <p className="text-sm">Ketik nama artis dan tekan Cari</p>
        </div>
      )}

      {artist && (
        <div className="space-y-6">
          {/* ── Artist profile header ── */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-white/[0.06] to-transparent border border-white/[0.08] p-5">
            <div className="flex items-center gap-5">
              {/* Picture */}
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden bg-white/10 flex-shrink-0 relative">
                {artist.picture && !picErr ? (
                  <Image
                    src={artist.picture}
                    alt={artist.name}
                    fill
                    className="object-cover"
                    sizes="96px"
                    onError={() => setPicErr(true)}
                    unoptimized
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Music2 size={32} className="text-white/20" />
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <h3 className="text-xl font-bold text-white mb-1 truncate">{artist.name}</h3>
                <div className="flex items-center gap-2 text-white/40 text-sm">
                  <Users size={13} />
                  <span>{fmtFans(artist.fans)} fans</span>
                </div>
                <p className="text-xs text-white/25 mt-1">{artist.topTracks?.length || 0} top tracks</p>
              </div>
            </div>
          </div>

          {/* ── Top Tracks ── */}
          <div>
            <h4 className="text-sm font-bold text-white/70 mb-3 flex items-center gap-2">
              <Disc3 size={15} />
              Top Tracks
            </h4>
            <div className="space-y-1">
              {artist.topTracks.map((track, i) => {
                const isActive = currentTrack?.videoId === `deezer-${track.deezerId}` || 
                                 currentTrack?.title === track.title
                return (
                  <div
                    key={track.deezerId || i}
                    onClick={() => playTrack(track, artist.name, i)}
                    className={`
                      group flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all active:scale-[0.98]
                      ${isActive
                        ? 'bg-brand/10 border border-brand/30'
                        : 'border border-transparent hover:bg-white/[0.05] hover:border-white/[0.08]'
                      }
                    `}
                  >
                    {/* Index / playing indicator */}
                    <div className="w-6 flex items-center justify-center flex-shrink-0">
                      {isActive && isPlaying ? (
                        <div className="flex gap-0.5 items-end h-4">
                          {[1,2,3].map(j => (
                            <div key={j} className={`w-0.5 bg-brand rounded-full animate-bar-${j}`} style={{ height: '100%' }} />
                          ))}
                        </div>
                      ) : (
                        <span className={`text-[12px] font-medium ${isActive ? 'text-brand' : 'text-white/25 group-hover:hidden'}`}>
                          {i + 1}
                        </span>
                      )}
                      <Play size={13} className={`text-white hidden group-hover:block flex-shrink-0 ${isActive ? '!hidden' : ''}`} fill="currentColor" />
                    </div>

                    {/* Cover */}
                    <div className="w-10 h-10 rounded-lg overflow-hidden bg-white/10 flex-shrink-0 relative">
                      {track.cover ? (
                        <Image
                          src={track.cover}
                          alt={track.title}
                          fill
                          className="object-cover"
                          sizes="40px"
                          unoptimized
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Music2 size={14} className="text-white/20" />
                        </div>
                      )}
                    </div>

                    {/* Title & album */}
                    <div className="flex-1 min-w-0">
                      <p className={`text-[13px] font-medium truncate ${isActive ? 'text-brand-light' : 'text-white'}`}>
                        {track.title}
                      </p>
                      <p className="text-[11px] text-white/35 truncate">{track.album || '—'}</p>
                    </div>

                    {/* Duration */}
                    <div className="flex items-center gap-1 text-white/25 text-[11px] tabular-nums flex-shrink-0">
                      <Clock size={10} />
                      {fmtSec(track.duration)}
                    </div>

                    {/* Preview badge */}
                    {track.preview && (
                      <span className="text-[9px] bg-white/10 text-white/30 px-1.5 py-0.5 rounded-md flex-shrink-0">
                        30s
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
