'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  TrendingUp, RefreshCw, Music2, Search as SearchIcon,
  Clock, Heart, Zap,
} from 'lucide-react'
import Sidebar     from '@/components/Sidebar'
import Topbar      from '@/components/Topbar'
import SongCard    from '@/components/SongCard'
import Player      from '@/components/Player'
import BottomNav   from '@/components/BottomNav'
import LyricsView  from '@/components/LyricsView'
import QueuePanel  from '@/components/QueuePanel'
import ArtistView  from '@/components/ArtistView'
import ExploreView from '@/components/ExploreView'
import { usePlayer } from '@/context/PlayerContext'

// ── Helpers ────────────────────────────────────────────────────
function SkeletonGrid({ count = 6 }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="skeleton aspect-[4/5] rounded-2xl" />
      ))}
    </div>
  )
}

function SongGrid({ items }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3">
      {items.map(item => <SongCard key={item.videoId} item={item} />)}
    </div>
  )
}

// ── Toast ─────────────────────────────────────────────────────
function Toast() {
  const { toast } = usePlayer()
  if (!toast) return null
  return (
    <div className="fixed bottom-36 sm:bottom-28 left-1/2 z-[9999] pointer-events-none toast-enter" style={{ transform: 'translateX(-50%)' }}>
      <div className="bg-[#1a1a1a] border border-white/[0.12] text-white text-[13px] font-medium px-5 py-2.5 rounded-full shadow-2xl backdrop-blur-xl whitespace-nowrap">
        {toast}
      </div>
    </div>
  )
}

// ── Loading overlay ───────────────────────────────────────────
function LoadingOverlay() {
  const { isLoading } = usePlayer()
  if (!isLoading) return null
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9998] flex flex-col items-center justify-center gap-4">
      <div className="w-12 h-12 rounded-full border-2 border-white/10 border-t-brand animate-spin" />
      <p className="text-sm text-white/60">Memuat audio…</p>
    </div>
  )
}

// ── Keyboard shortcut hint ────────────────────────────────────
function ShortcutHint() {
  return (
    <p className="text-[11px] text-white/20 mt-2">
      Shortcut: <kbd className="px-1 py-0.5 bg-white/5 rounded text-[10px]">Space</kbd> play/pause ·
      <kbd className="px-1 py-0.5 bg-white/5 rounded text-[10px] mx-1">←→</kbd> seek ·
      <kbd className="px-1 py-0.5 bg-white/5 rounded text-[10px]">L</kbd> like ·
      <kbd className="px-1 py-0.5 bg-white/5 rounded text-[10px] mx-1">M</kbd> mute
    </p>
  )
}

// ── Home page ─────────────────────────────────────────────────
function HomePage({ onSearch }) {
  const [trending,  setTrending]  = useState([])
  const [genres,    setGenres]    = useState([])
  const [loading,   setLoading]   = useState(true)
  const { recentlyPlayed, liked, playSong, setPage } = usePlayer()

  async function loadTrending() {
    setLoading(true)
    try {
      const res  = await fetch('/api/trending')
      const data = await res.json()
      if (data.success) {
        setTrending(data.trending || [])
        setGenres(data.genres   || [])
      }
    } catch {
      setTrending([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadTrending() }, [])

  // Build liked songs list from recentlyPlayed
  const likedSongs = recentlyPlayed.filter(r => liked.includes(r.videoId))

  return (
    <div className="p-4 sm:p-6 pb-8 animate-fade-in space-y-10">

      {/* Hero */}
      <div className="flex items-start justify-between gap-6 pt-2">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/[0.05] border border-white/[0.08] rounded-full text-[12px] font-medium text-white/50 mb-4">
            <Zap size={11} className="text-brand" />
            Streaming Gratis
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight leading-[1.1] mb-3">
            Dengarkan Musik<br />
            <span className="gradient-text">Tanpa Batas</span>
          </h1>
          <p className="text-[14px] text-white/45 max-w-sm leading-relaxed mb-4">
            Jutaan lagu dengan lirik sinkron, cover art HD, dan info artis lengkap.
          </p>
          <ShortcutHint />
        </div>
        {/* Animated bars */}
        <div className="hidden md:flex w-[160px] h-[160px] flex-shrink-0 rounded-3xl items-end justify-center p-5 bg-gradient-to-br from-brand/20 to-purple-500/10 border border-brand/20">
          <div className="flex items-end gap-1.5 h-12">
            {['animate-bar-1','animate-bar-2','animate-bar-3','animate-bar-4','animate-bar-5'].map((cls, i) => (
              <span key={i} className={`block w-2 rounded bg-gradient-to-t from-brand to-brand-light ${cls}`}
                style={{ height: [30,70,50,90,40][i]+'%' }} />
            ))}
          </div>
        </div>
      </div>

      {/* Recently Played */}
      {recentlyPlayed.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Clock size={15} className="text-brand" />
              <h2 className="text-[16px] font-bold">Terakhir Diputar</h2>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 gap-3">
            {recentlyPlayed.slice(0, 6).map(item => (
              <div
                key={item.videoId}
                onClick={() => playSong(item)}
                className="flex items-center gap-2.5 px-3 py-2.5 bg-white/[0.05] hover:bg-white/[0.08] border border-white/[0.07] rounded-xl cursor-pointer transition-all group active:scale-[0.97]"
              >
                {item.thumbnail
                  ? <img src={item.thumbnail} alt="" className="w-9 h-9 rounded-lg object-cover flex-shrink-0" />
                  : <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                      <Music2 size={13} className="text-white/30" />
                    </div>
                }
                <div className="min-w-0">
                  <p className="text-[12px] font-semibold truncate">{item.title}</p>
                  <p className="text-[11px] text-white/40 truncate">{item.artist}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Liked Songs */}
      {likedSongs.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Heart size={15} className="text-pink-400" />
            <h2 className="text-[16px] font-bold">Disukai</h2>
          </div>
          <SongGrid items={likedSongs.map(r => ({ ...r, channel: r.artist }))} />
        </section>
      )}

      {/* Trending */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <TrendingUp size={15} className="text-brand" />
            <h2 className="text-[16px] font-bold">Trending Sekarang</h2>
          </div>
          <button onClick={loadTrending}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-white/35 hover:text-white hover:bg-white/[0.05] text-[12.5px] font-medium transition-all">
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
        {loading ? <SkeletonGrid count={12} /> : <SongGrid items={trending} />}
      </section>

      {/* Genre sections */}
      {!loading && genres.map(({ genre, videos }) => (
        videos.length > 0 && (
          <section key={genre}>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-[16px] font-bold">{genre}</h2>
              <button
                onClick={() => setPage('explore')}
                className="text-[12.5px] text-brand hover:text-brand-light flex items-center gap-1 transition-colors"
              >
                Lihat semua
              </button>
            </div>
            <SongGrid items={videos} />
          </section>
        )
      ))}
    </div>
  )
}

// ── Search page ───────────────────────────────────────────────
function SearchPage({ results, isSearching }) {
  return (
    <div className="p-4 sm:p-6 pb-8 animate-fade-in">
      <h2 className="text-xl font-bold tracking-tight mb-5">Hasil Pencarian</h2>
      {isSearching ? <SkeletonGrid count={8} />
        : results.length > 0 ? <SongGrid items={results} />
        : (
          <div className="flex flex-col items-center justify-center h-48 gap-3 text-white/20">
            <SearchIcon size={36} />
            <p className="text-sm">Ketik di kotak pencarian untuk mulai…</p>
          </div>
        )
      }
    </div>
  )
}

// ── Main App ─────────────────────────────────────────────────
export default function App() {
  const { activePage, setPage } = usePlayer()
  const [sidebarOpen,   setSidebarOpen]   = useState(false)
  const [searchResults, setSearchResults] = useState([])
  const [isSearching,   setIsSearching]   = useState(false)

  const handleSearch = useCallback(async (q) => {
    if (!q?.trim()) return
    setIsSearching(true)
    setPage('search')
    try {
      const res  = await fetch(`/api/search?q=${encodeURIComponent(q)}`)
      const data = await res.json()
      setSearchResults(data.success ? data.results : [])
    } catch {
      setSearchResults([])
    } finally {
      setIsSearching(false)
    }
  }, [setPage])

  const handleSearchResults = useCallback((results) => {
    setSearchResults(results)
    if (results.length > 0) setPage('search')
  }, [setPage])

  return (
    <div className="flex flex-col h-dvh overflow-hidden bg-[#0a0a0a]">
      <div className="flex flex-1 overflow-hidden relative">

        {/* Sidebar overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/60 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        <Sidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        {/* Main */}
        <div className="flex flex-col flex-1 overflow-hidden lg:ml-[240px]">
          <Topbar
            onToggleSidebar={() => setSidebarOpen(p => !p)}
            onSearchResults={handleSearchResults}
            onSearching={setIsSearching}
          />
          <main className="flex-1 overflow-y-auto">
            {activePage === 'home'    && <HomePage    onSearch={handleSearch} />}
            {activePage === 'search'  && <SearchPage  results={searchResults} isSearching={isSearching} />}
            {activePage === 'explore' && <ExploreView />}
            {activePage === 'queue'   && <QueuePanel  />}
            {activePage === 'lyrics'  && <LyricsView  />}
            {activePage === 'artist'  && <ArtistView  />}
          </main>
        </div>
      </div>

      {/* Player */}
      <Player />
      {/* Bottom nav (mobile only) */}
      <BottomNav />

      <Toast />
      <LoadingOverlay />
    </div>
  )
}
