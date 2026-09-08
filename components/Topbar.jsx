'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { Search, X, PanelLeft, Sun, Moon } from 'lucide-react'
import { usePlayer } from '@/context/PlayerContext'

export default function Topbar({ onToggleSidebar, onSearchResults, onSearching }) {
  const { setPage } = usePlayer()
  const [query,  setQuery]  = useState('')
  const [isDark, setIsDark] = useState(true)
  const searchTimer = useRef(null)
  const inputRef    = useRef(null)

  // Sync theme from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('mk_theme') || 'dark'
    setIsDark(saved === 'dark')
    document.documentElement.classList.toggle('dark', saved === 'dark')
  }, [])

  const doSearch = useCallback(async (q) => {
    if (!q.trim()) return
    onSearching(true)
    setPage('search')
    try {
      const res  = await fetch(`/api/search?q=${encodeURIComponent(q)}`)
      const data = await res.json()
      onSearchResults(data.success ? data.results : [])
    } catch {
      onSearchResults([])
    } finally {
      onSearching(false)
    }
  }, [setPage, onSearchResults, onSearching])

  function handleInput(e) {
    const val = e.target.value
    setQuery(val)
    clearTimeout(searchTimer.current)
    if (!val.trim()) { onSearchResults([]); return }
    searchTimer.current = setTimeout(() => doSearch(val), 450)
  }

  function handleKey(e) {
    if (e.key === 'Enter') { clearTimeout(searchTimer.current); doSearch(query) }
    if (e.key === 'Escape') { clearInput() }
  }

  function clearInput() {
    setQuery('')
    onSearchResults([])
    inputRef.current?.focus()
  }

  function toggleTheme() {
    const next = !isDark
    setIsDark(next)
    document.documentElement.classList.toggle('dark', next)
    localStorage.setItem('mk_theme', next ? 'dark' : 'light')
  }

  return (
    <header className="flex items-center gap-3 px-4 sm:px-6 h-14 border-b border-white/[0.07] flex-shrink-0 bg-[#0a0a0a]/80 backdrop-blur-xl sticky top-0 z-10">
      <button
        onClick={onToggleSidebar}
        className="w-8 h-8 rounded-lg border border-white/[0.08] bg-white/[0.04] flex items-center justify-center text-white/50 hover:text-white hover:bg-white/[0.08] transition-all flex-shrink-0 lg:hidden"
      >
        <PanelLeft size={15} />
      </button>

      <div className="flex-1 relative flex items-center">
        <Search size={14} className="absolute left-3 text-white/30 pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInput}
          onKeyDown={handleKey}
          placeholder="Cari lagu, artis, album..."
          autoComplete="off"
          spellCheck={false}
          className="w-full bg-white/[0.05] border border-white/[0.08] rounded-xl px-3 py-2 pl-8 text-[13.5px] text-white placeholder-white/25 outline-none focus:border-white/20 focus:bg-white/[0.07] transition-all"
        />
        {query && (
          <button onClick={clearInput} className="absolute right-2.5 text-white/30 hover:text-white/70 transition-colors p-1">
            <X size={14} />
          </button>
        )}
      </div>

      <button onClick={toggleTheme}
        className="w-8 h-8 rounded-lg border border-white/[0.08] bg-white/[0.04] flex items-center justify-center text-white/50 hover:text-white hover:bg-white/[0.08] transition-all flex-shrink-0">
        {isDark ? <Sun size={15} /> : <Moon size={15} />}
      </button>
    </header>
  )
}
