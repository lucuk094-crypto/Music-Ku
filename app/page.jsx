'use client'
import { useState, useEffect, useCallback } from 'react'
import {
  TrendingUp, RefreshCw, Music2, Search as SearchIcon, Clock,
  Heart, Zap, ChevronRight, Play,
} from 'lucide-react'
import Image from 'next/image'
import Sidebar from '@/components/Sidebar'
import Topbar from '@/components/Topbar'
import SongCard from '@/components/SongCard'
import Player from '@/components/Player'
import BottomNav from '@/components/BottomNav'
import LyricsView from '@/components/LyricsView'
import QueuePanel from '@/components/QueuePanel'
import ArtistView from '@/components/ArtistView'
import ExploreView from '@/components/ExploreView'
import { usePlayer } from '@/context/PlayerContext'

// ── Helpers ──────────────────────────────────────────────────────
function SkeletonGrid({ count = 6 }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="skeleton rounded-2xl aspect-[3/4]" />
      ))}
    </div>
  )
}

function SongGrid({ items }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
      {items.map(item => <SongCard key={item.videoId} item={item} />)}
    </div>
  )
}

// ── Toast ─────────────────────────────────────────────────────────
function Toast() {
  const { toast } = usePlayer()
  if (!toast) return null
  return (
    <div className="toast-enter fixed bottom-28 sm:bottom-24 left-1/2 -translate-x-1/2 z-[999] bg-white/10 backdrop-blur-xl border border-white/20 text-white text-[13px] font-medium px-5 py-2.5 rounded-2xl shadow-xl whitespace-nowrap pointer-events-none">
      {toast}
    </div>
  )
}

// ── Loading overlay ────────────────────────────────────────────────
function LoadingOverlay() {
  const { isLoading } = usePlayer()
  if (!isLoading) return null
  return (
    <div className="fixed inset-0 z-[998] bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center gap-4 pointer-events-none">
      <div className="flex gap-1 items-end h-10">
        {[1,2,3,4,5].map(i => (
          <div key={i} className={`w-1.5 bg-brand rounded-full animate-bar-${i}`} style={{ height: '100%' }} />
        ))}
      </div>
      <p className="text-white/60 text-sm">Memuat audio…</p>
    </div>
  )
}

// ── Keyboard shortcut hint ─────────────────────────────────────────
function ShortcutHint() {
  return (
    <div className="hidden lg:flex items-center gap-1.5 text-white/20 text-[11px] mt-4 select-none">
      <span>Shortcut:</span>
      <kbd className="bg-white/10 px-1.5 py-0.5 rounded-md text-[10px]">Space</kbd> play/pause·
      <kbd className="bg-white/10 px-1.5 py-0.5 rounded-md text-[10px]">← →</kbd> seek·
      <kbd className="bg-white/10 px-1.5 py-0.5 rounded-md text-[10px]">L</kbd> like·
      <kbd className="bg-white/10 px-1.5 py-0.5 rounded-md text-[10px]">M</kbd> mute
    </div>
  )
}

// ── Recently Played Item ──────────────────────────────────────────
function RecentItem({ item, onPlay }) {
  const [imgErr, setImgErr] = useState(false)
  return (
    <div
      onClick={() => onPlay(item)}
      className="flex items-center gap-2.5 px-3 py-2.5 bg-white/[0.05] hover:bg-white/[0.08] border border-white/[0.07] rounded-xl cursor-pointer transition-all group active:scale-[0.97]"
    >
      <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-white/10 relative">
        {item.thumbnail && !imgErr ? (
          <Image
            src={item.thumbnail}
            alt={item.title}
            fill
            className="object-cover"
            onError={() => setImgErr(true)}
            sizes="40px"
            unoptimized
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Music2 size={16} className="text-white/30" />
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[12.5px] font-medium text-white truncate">{item.title}</p>
        <p className="text-[11px] text-white/40 truncate">{item.artist}</p>
      </div>
      <Play size={14} className="text-white/20 group-hover:text-brand transition-colors flex-shrink-0" />
    </div>
  )
}

// ── Home page ──────────────────────────────────────────────────────
function HomePage({ onSearch }) {
  const [trending, setTrending] = useState([])
  const [genres, setGenres] = useState([])
  const [loading, setLoading] = useState(true)
  const { recentlyPlayed, liked, playSong, setPage } = usePlayer()

  async function loadTrending() {
    setLoading(true)
    try {
      const res = await fetch('/api/trending')
      const data = await res.json()
      if (data.success) {
        // Support both data.trending and data.results for compatibility
        setTrending(data.trending || data.results || [])
        setGenres(data.genres || [])
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
    <div className="flex-1 overflow-y-auto px-4 sm:px-6 pb-4 space-y-8">

      {/* ── Hero Banner ── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand/80 via-purple-800/60 to-pink-900/50 p-6 sm:p-10 mt-2">
        {/* Background decorative blobs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-20 -right-20 w-64 h-64 bg-brand/20 rounded-full blur-3xl" />
          <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-pink-500/15 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center gap-6">
          <div className="flex-1 min-w-0">
            <p className="text-white/60 text-sm font-medium mb-1 flex items-center gap-2">
              <Zap size={14} className="text-yellow-400" />
              Streaming Gratis
            </p>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white leading-tight mb-3">
              Dengarkan Musik<br />
              <span className="gradient-text">Tanpa Batas</span>
            </h1>
            <p className="text-white/50 text-sm max-w-md">
              Jutaan lagu dengan lirik sinkron, cover art HD, dan info artis lengkap.
            </p>
            <button
              onClick={() => onSearch('')}
              className="mt-4 flex items-center gap-2 bg-white text-black font-semibold px-5 py-2.5 rounded-xl text-sm hover:bg-white/90 transition-all active:scale-95"
            >
              <SearchIcon size={15} />
              Cari Lagu
            </button>
          </div>

          {/* EQ animation bars */}
          <div className="flex gap-1.5 items-end h-16 flex-shrink-0">
            {[1,2,3,4,5].map(i => (
              <div
                key={i}
                className={`w-2 bg-white/70 rounded-full origin-bottom animate-bar-${i}`}
                style={{ height: `${[60,85,45,90,70][i-1]}%` }}
              />
            ))}
          </div>
        </div>

        <ShortcutHint />
      </div>

      {/* ── Recently Played ── */}
      {recentlyPlayed.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Clock size={16} className="text-brand" />
              Terakhir Diputar
            </h2>
            <span className="text-xs text-white/30">{recentlyPlayed.length} lagu</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {recentlyPlayed.slice(0, 6).map(item => (
              <RecentItem key={item.videoId} item={item} onPlay={playSong} />
            ))}
          </div>
        </section>
      )}

      {/* ── Liked Songs ── */}
      {likedSongs.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Heart size={16} className="text-pink-500" />
              Disukai
            </h2>
            <span className="text-xs text-white/30">{likedSongs.length} lagu</span>
          </div>
          <SongGrid items={likedSongs.map(r => ({ ...r, channel: r.artist }))} />
        </section>
      )}

      {/* ── Trending ── */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <TrendingUp size={16} className="text-brand" />
            Trending Sekarang
          </h2>
          <button
            onClick={loadTrending}
            className="flex items-center gap-1.5 text-[12px] text-white/40 hover:text-white/70 transition-colors"
          >
            <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
        {loading ? <SkeletonGrid count={12} /> : <SongGrid items={trending} />}
      </section>

      {/* ── Genre sections ── */}
      {!loading && genres.map(({ genre, videos }) =>
        videos && videos.length > 0 ? (
          <section key={genre}>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-bold text-white">{genre}</h2>
              <button
                onClick={() => setPage('explore')}
                className="text-[12.5px] text-brand hover:text-brand-light flex items-center gap-1 transition-colors"
              >
                Lihat semua <ChevronRight size={13} />
              </button>
            </div>
            <SongGrid items={videos} />
          </section>
        ) : null
      )}
    </div>
  )
}

// ── Search page ────────────────────────────────────────────────────
function SearchPage({ results, isSearching }) {
  return (
    <div className="flex-1 overflow-y-auto px-4 sm:px-6 pb-4">
      <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2 pt-2">
        <SearchIcon size={16} className="text-brand" />
        Hasil Pencarian
      </h2>
      {isSearching ? (
        <SkeletonGrid count={12} />
      ) : results.length > 0 ? (
        <SongGrid items={results} />
      ) : (
        <div className="flex flex-col items-center justify-center h-48 gap-3 text-white/25">
          <Music2 size={40} />
          <p className="text-sm">Ketik di kotak pencarian untuk mulai…</p>
        </div>
      )}
    </div>
  )
}

// ── Main App ────────────────────────────────────────────────────────
export default function App() {
  const { activePage, setPage } = usePlayer()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [searchResults, setSearchResults] = useState([])
  const [isSearching, setIsSearching] = useState(false)

  const handleSearch = useCallback(async (q) => {
    if (!q?.trim()) return
    setIsSearching(true)
    setPage('search')
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`)
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
    <div className="flex h-screen bg-[#0a0a0a] overflow-hidden">

      {/* Sidebar overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Topbar
          onToggleSidebar={() => setSidebarOpen(p => !p)}
          onSearchResults={handleSearchResults}
          onSearching={setIsSearching}
        />

        <main className="flex-1 flex flex-col overflow-hidden pb-[var(--player-h)] sm:pb-0">
          {activePage === 'home'    && <HomePage onSearch={handleSearch} />}
          {activePage === 'search'  && <SearchPage results={searchResults} isSearching={isSearching} />}
          {activePage === 'explore' && <ExploreView />}
          {activePage === 'queue'   && <QueuePanel />}
          {activePage === 'lyrics'  && <LyricsView />}
          {activePage === 'artist'  && <ArtistView />}
        </main>

        {/* Player */}
        <Player />

        {/* Bottom nav (mobile only) */}
        <BottomNav />
      </div>

      <Toast />
      <LoadingOverlay />
    </div>
  )
}
