'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Zap, TrendingUp, RefreshCw, Music2, Search as SearchIcon } from 'lucide-react'
import Sidebar     from '@/components/Sidebar'
import Topbar      from '@/components/Topbar'
import SongCard    from '@/components/SongCard'
import Player      from '@/components/Player'
import LyricsView  from '@/components/LyricsView'
import QueuePanel  from '@/components/QueuePanel'
import ArtistView  from '@/components/ArtistView'
import { usePlayer } from '@/context/PlayerContext'

// ── Skeleton grid ──────────────────────────────────────────────
function SkeletonGrid({ count = 6 }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="skeleton aspect-[4/5] rounded-2xl" />
      ))}
    </div>
  )
}

// ── Song grid ─────────────────────────────────────────────────
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
    <div className="fixed bottom-28 left-1/2 -translate-x-1/2 z-[9999] pointer-events-none">
      <div className="bg-[#1a1a1a] border border-white/[0.12] text-white text-[13px] font-medium px-5 py-2.5 rounded-full shadow-2xl backdrop-blur-xl toast-enter whitespace-nowrap">
        {toast}
      </div>
    </div>
  )
}

// ── Loading overlay ───────────────────────────────────────────
function LoadingOverlay() {
  const { isLoading, currentTrack } = usePlayer()
  if (!isLoading) return null
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9998] flex flex-col items-center justify-center gap-4">
      <div className="w-12 h-12 rounded-full border-2 border-white/10 border-t-brand animate-spin" />
      <p className="text-sm text-white/60">Memuat{currentTrack ? ` — ${currentTrack.title}` : '...'}</p>
    </div>
  )
}

// ── Home page ─────────────────────────────────────────────────
function HomePage() {
  const [trending, setTrending] = useState([])
  const [loading,  setLoading]  = useState(true)

  async function loadTrending() {
    setLoading(true)
    try {
      const res  = await fetch('/api/trending')
      const data = await res.json()
      setTrending(data.success ? data.results : [])
    } catch {
      setTrending([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadTrending() }, [])

  return (
    <div className="p-6 pb-8 animate-fade-in">
      {/* Hero */}
      <div className="flex items-start justify-between gap-6 mb-10 pt-2">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/[0.05] border border-white/[0.08] rounded-full text-[12px] font-medium text-white/50 mb-4">
            <Zap size={11} className="text-brand" />
            Streaming Gratis
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight leading-[1.1] mb-3">
            Dengarkan Musik<br />
            <span className="gradient-text">Tanpa Batas</span>
          </h1>
          <p className="text-[14px] text-white/45 max-w-sm leading-relaxed">
            Jutaan lagu dengan lirik sinkron, cover art HD, dan info artis lengkap.
          </p>
        </div>

        {/* Animated visual */}
        <div className="hidden md:flex w-[180px] h-[180px] flex-shrink-0 rounded-3xl items-end justify-center p-6 bg-gradient-to-br from-brand/20 to-purple-500/10 border border-brand/20 shadow-[0_0_60px_rgba(124,58,237,0.12)]">
          <div className="flex items-end gap-1.5 h-14">
            {['animate-bar-1','animate-bar-2','animate-bar-3','animate-bar-4','animate-bar-5'].map((cls, i) => (
              <span
                key={i}
                className={`block w-2.5 rounded bg-gradient-to-t from-brand to-brand-light ${cls}`}
                style={{ height: [30,70,50,90,40][i]+'%' }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Trending */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <TrendingUp size={16} className="text-brand" />
          <h2 className="text-[16px] font-bold tracking-tight">Trending Sekarang</h2>
        </div>
        <button
          onClick={loadTrending}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-white/35 hover:text-white hover:bg-white/[0.05] text-[12.5px] font-medium transition-all"
        >
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {loading ? <SkeletonGrid count={12} /> : <SongGrid items={trending} />}
    </div>
  )
}

// ── Search page ───────────────────────────────────────────────
function SearchPage({ results, isSearching }) {
  return (
    <div className="p-6 pb-8 animate-fade-in">
      <h2 className="text-xl font-bold tracking-tight mb-5">Hasil Pencarian</h2>
      {isSearching ? (
        <SkeletonGrid count={6} />
      ) : results.length > 0 ? (
        <SongGrid items={results} />
      ) : (
        <div className="flex flex-col items-center justify-center h-48 gap-3 text-white/20">
          <SearchIcon size={36} />
          <p className="text-sm">Ketik di kotak pencarian untuk mulai...</p>
        </div>
      )}
    </div>
  )
}

// ── Main App ─────────────────────────────────────────────────
export default function App() {
  const { activePage, setPage, showToast } = usePlayer()
  const [sidebarOpen,   setSidebarOpen]   = useState(false)
  const [searchResults, setSearchResults] = useState([])
  const [isSearching,   setIsSearching]   = useState(false)

  // Expose search globally for ArtistView track click
  useEffect(() => {
    window.__musikuSearch = async (q) => {
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
    }
  }, [setPage])

  const handleSearchResults = useCallback((results) => {
    setSearchResults(results)
    if (results.length > 0) setPage('search')
  }, [setPage])

  return (
    <div className="flex flex-col h-dvh overflow-hidden bg-[#0a0a0a]">
      <div className="flex flex-1 overflow-hidden relative">
        {/* Sidebar overlay on mobile */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        <Sidebar isOpen={sidebarOpen} />

        {/* Main area */}
        <div className="flex flex-col flex-1 overflow-hidden lg:ml-[240px]">
          <Topbar
            onToggleSidebar={() => setSidebarOpen(p => !p)}
            onSearchResults={handleSearchResults}
            onSearching={setIsSearching}
          />

          <main className="flex-1 overflow-y-auto">
            {activePage === 'home'   && <HomePage />}
            {activePage === 'search' && <SearchPage results={searchResults} isSearching={isSearching} />}
            {activePage === 'queue'  && <QueuePanel />}
            {activePage === 'lyrics' && <LyricsView />}
            {activePage === 'artist' && <ArtistView />}
          </main>
        </div>
      </div>

      <Player />
      <Toast />
      <LoadingOverlay />
    </div>
  )
}
