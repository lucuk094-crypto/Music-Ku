'use client'

import { useState } from 'react'
import { Search, Users, Music2 } from 'lucide-react'
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
  const { playSong, showToast } = usePlayer()

  async function doSearch() {
    const name = query.trim()
    if (!name) return
    setLoading(true); setError(''); setArtist(null)
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

  // Direct play: search YouTube lalu langsung play hasil pertama
  async function playTrack(trackTitle, artistName) {
    showToast(`Memuat: ${trackTitle}…`)
    try {
      const res  = await fetch(`/api/search?q=${encodeURIComponent(`${artistName} ${trackTitle}`)}`)
      const data = await res.json()
      const first = data.results?.[0]
      if (first) playSong(first)
      else showToast('Lagu tidak ditemukan di YouTube')
    } catch {
      showToast('Gagal mencari lagu')
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 sm:px-6 py-5 flex-shrink-0">
        <h2 className="text-xl font-bold tracking-tight mb-4">Cari Artis</h2>
        <div className="flex gap-2">
          <div className="flex-1 relative flex items-center">
            <Search size={14} className="absolute left-3 text-white/30 pointer-events-none" />
            <input
              type="text" value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && doSearch()}
              placeholder="Nama artis..."
              className="w-full bg-white/[0.05] border border-white/[0.08] rounded-xl px-3 py-2.5 pl-8 text-[13.5px] text-white placeholder-white/25 outline-none focus:border-white/20 transition-all"
            />
          </div>
          <button onClick={doSearch} disabled={loading}
            className="px-4 py-2.5 bg-brand hover:bg-brand-dark rounded-xl text-white text-[13.5px] font-semibold transition-all disabled:opacity-50 flex items-center gap-2">
            {loading
              ? <div className="w-4 h-4 rounded-full border-2 border-white/20 border-t-white animate-spin" />
              : <Search size={15} />}
            Cari
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 sm:px-6 pb-36">
        {error && <p className="text-white/40 text-sm text-center py-12">{error}</p>}

        {!artist && !error && !loading && (
          <div className="flex flex-col items-center justify-center h-48 gap-3 text-white/20">
            <Users size={36} />
            <p className="text-sm">Ketik nama artis dan tekan Cari</p>
          </div>
        )}

        {artist && (
          <div className="animate-fade-in">
            {/* Profile */}
            <div className="flex items-center gap-5 p-5 glass rounded-2xl mb-6">
              {artist.picture
                ? <img src={artist.picture} alt={artist.name} className="w-20 h-20 rounded-full object-cover border border-white/10 flex-shrink-0" />
                : <div className="w-20 h-20 rounded-full bg-white/[0.06] flex items-center justify-center flex-shrink-0">
                    <Users size={28} className="text-white/20" />
                  </div>
              }
              <div>
                <h3 className="text-2xl font-bold tracking-tight">{artist.name}</h3>
                <div className="flex items-center gap-1.5 mt-1.5 text-white/40 text-[13px]">
                  <Users size={13} />
                  <span>{fmtFans(artist.fans)} fans</span>
                </div>
              </div>
            </div>

            <p className="text-[13px] font-semibold text-white/40 uppercase tracking-widest mb-3">Top Tracks</p>
            <div className="flex flex-col gap-1">
              {artist.topTracks.map((track, i) => (
                <div
                  key={track.deezerId}
                  onClick={() => playTrack(track.title, artist.name)}
                  className="group flex items-center gap-3 px-3 py-2.5 rounded-xl border border-transparent hover:bg-white/[0.05] hover:border-white/[0.08] cursor-pointer transition-all active:scale-[0.98]"
                >
                  <span className="w-5 text-center text-[12px] text-white/25 flex-shrink-0">{i + 1}</span>
                  {track.cover
                    ? <img src={track.cover} alt="" className="w-10 h-10 rounded-lg object-cover flex-shrink-0 bg-white/[0.06]" loading="lazy" />
                    : <div className="w-10 h-10 rounded-lg bg-white/[0.06] flex items-center justify-center flex-shrink-0">
                        <Music2 size={14} className="text-white/25" />
                      </div>
                  }
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold truncate">{track.title}</p>
                    <p className="text-[11.5px] text-white/35 truncate">{track.album || '—'}</p>
                  </div>
                  <span className="text-[11.5px] text-white/25 flex-shrink-0">{fmtSec(track.duration)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
