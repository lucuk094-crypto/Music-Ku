'use client'
import {
  createContext, useContext, useReducer, useRef, useEffect, useCallback,
} from 'react'

const PlayerContext = createContext(null)

// ── Helpers ────────────────────────────────────────────────────────
function loadLS(key, fallback) {
  if (typeof window === 'undefined') return fallback
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback } catch { return fallback }
}
function saveLS(key, val) {
  if (typeof window === 'undefined') return
  try { localStorage.setItem(key, JSON.stringify(val)) } catch {}
}

// ── Initial state ───────────────────────────────────────────────────
const initialState = {
  currentTrack:   null,
  queue:          [],
  queueIndex:     -1,
  isPlaying:      false,
  isLoading:      false,
  isShuffle:      false,
  repeatMode:     0,      // 0=off 1=all 2=one
  isMuted:        false,
  volume:         80,
  currentTime:    0,
  duration:       0,
  liked:          [],
  recentlyPlayed: [],
  toast:          null,
  activePage:     'home',
}

// ── Reducer ─────────────────────────────────────────────────────────
function reducer(state, action) {
  switch (action.type) {
    case 'SET_TRACK':       return { ...state, currentTrack: action.payload, isLoading: false }
    case 'SET_PLAYING':     return { ...state, isPlaying: action.payload }
    case 'SET_LOADING':     return { ...state, isLoading: action.payload }
    case 'SET_QUEUE':       return { ...state, queue: action.payload }
    case 'SET_QUEUE_INDEX': return { ...state, queueIndex: action.payload }
    case 'SET_SHUFFLE':     return { ...state, isShuffle: action.payload }
    case 'SET_REPEAT':      return { ...state, repeatMode: action.payload }
    case 'SET_MUTED':       return { ...state, isMuted: action.payload }
    case 'SET_VOLUME':      return { ...state, volume: action.payload }
    case 'SET_TIME':        return { ...state, currentTime: action.payload }
    case 'SET_DURATION':    return { ...state, duration: action.payload }
    case 'SET_PAGE':        return { ...state, activePage: action.payload }
    case 'SET_TOAST':       return { ...state, toast: action.payload }
    case 'SET_LIKED':       return { ...state, liked: action.payload }
    case 'SET_RECENTLY':    return { ...state, recentlyPlayed: action.payload }
    case 'TOGGLE_LIKE': {
      const liked = state.liked.includes(action.payload)
        ? state.liked.filter(x => x !== action.payload)
        : [...state.liked, action.payload]
      saveLS('mk_liked', liked)
      return { ...state, liked }
    }
    case 'ADD_TO_QUEUE': {
      if (state.queue.find(q => q.videoId === action.payload.videoId)) return state
      return { ...state, queue: [...state.queue, action.payload] }
    }
    case 'REMOVE_FROM_QUEUE': {
      const newQueue = state.queue.filter((_, i) => i !== action.payload)
      const newIdx   = action.payload <= state.queueIndex
        ? Math.max(0, state.queueIndex - 1)
        : state.queueIndex
      return { ...state, queue: newQueue, queueIndex: newQueue.length ? newIdx : -1 }
    }
    case 'CLEAR_QUEUE': return { ...state, queue: [], queueIndex: -1 }
    default: return state
  }
}

// ═══════════════════════════════════════════════════════════════════
export function PlayerProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState)
  const audioRef   = useRef(null)
  const stateRef   = useRef(state)
  const toastTimer = useRef(null)
  const endedRef   = useRef(null)

  // Always sync stateRef
  useEffect(() => { stateRef.current = state }, [state])

  // Load from localStorage on mount
  useEffect(() => {
    const liked   = loadLS('mk_liked',  [])
    const volume  = loadLS('mk_volume', 80)
    const recent  = loadLS('mk_recent', [])
    dispatch({ type: 'SET_LIKED',    payload: liked  })
    dispatch({ type: 'SET_VOLUME',   payload: volume })
    dispatch({ type: 'SET_RECENTLY', payload: recent })
  }, [])

  // ── Init Audio ──────────────────────────────────────────────────
  useEffect(() => {
    if (typeof window === 'undefined') return
    const audio = new Audio()
    audio.preload = 'none'
    audioRef.current = audio

    const onPlay  = () => dispatch({ type: 'SET_PLAYING',  payload: true })
    const onPause = () => dispatch({ type: 'SET_PLAYING',  payload: false })
    const onTime  = () => dispatch({ type: 'SET_TIME',     payload: audio.currentTime })
    const onMeta  = () => dispatch({ type: 'SET_DURATION', payload: audio.duration })
    const onEnded = () => endedRef.current?.()
    const onError = () => {
      dispatch({ type: 'SET_LOADING', payload: false })
      dispatch({ type: 'SET_PLAYING', payload: false })
    }

    audio.addEventListener('play',          onPlay)
    audio.addEventListener('pause',         onPause)
    audio.addEventListener('timeupdate',    onTime)
    audio.addEventListener('loadedmetadata',onMeta)
    audio.addEventListener('ended',         onEnded)
    audio.addEventListener('error',         onError)

    return () => {
      audio.pause()
      audio.src = ''
      audio.removeEventListener('play',          onPlay)
      audio.removeEventListener('pause',         onPause)
      audio.removeEventListener('timeupdate',    onTime)
      audio.removeEventListener('loadedmetadata',onMeta)
      audio.removeEventListener('ended',         onEnded)
      audio.removeEventListener('error',         onError)
    }
  }, [])

  // ── Actions ─────────────────────────────────────────────────────
  const showToast = useCallback((msg) => {
    dispatch({ type: 'SET_TOAST', payload: msg })
    clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(
      () => dispatch({ type: 'SET_TOAST', payload: null }),
      2800
    )
  }, [])

  const playSong = useCallback(async (item) => {
    dispatch({ type: 'SET_LOADING', payload: true })
    try {
      let result

      // ── Special: Deezer preview URL (30s preview from ArtistView) ──
      if (item._previewUrl) {
        result = {
          videoId:  item.videoId,
          url:      item._previewUrl,
          audioUrl: item._previewUrl,
          duration: null,
          title:    item.title   || 'Unknown',
          artist:   item.artist  || item.channel || 'Unknown',
          album:    item.album   || null,
          cover:    item.thumbnail || null,
          lyrics:   null,
        }
      } else {
        // ── Normal: fetch from /api/play ──
        const res  = await fetch('/api/play', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({
            videoId: item.videoId,
            title:   item.title,
            artist:  item.channel || item.artist || '',
          }),
        })
        const data = await res.json()
        if (!data.success) {
          dispatch({ type: 'SET_LOADING', payload: false })
          showToast(data.message || 'Gagal memutar lagu')
          return
        }
        result = data.result
      }

      dispatch({ type: 'SET_TRACK', payload: result })

      // Recently played (max 20, no duplicates)
      const cur = stateRef.current
      const recent = [
        {
          videoId:   item.videoId,
          title:     result.title,
          artist:    result.artist,
          thumbnail: result.cover || item.thumbnail || '',
        },
        ...cur.recentlyPlayed.filter(r => r.videoId !== item.videoId),
      ].slice(0, 20)
      dispatch({ type: 'SET_RECENTLY', payload: recent })
      saveLS('mk_recent', recent)

      // Audio
      const audio = audioRef.current
      audio.src    = result.audioUrl
      audio.volume = stateRef.current.volume / 100
      audio.muted  = stateRef.current.isMuted
      audio.load()
      audio.play().catch(() => showToast('Klik play untuk memulai'))

      // Queue management
      const idx = cur.queue.findIndex(q => q.videoId === item.videoId)
      if (idx !== -1) {
        dispatch({ type: 'SET_QUEUE_INDEX', payload: idx })
      } else {
        const qItem = {
          videoId:   item.videoId,
          title:     result.title || item.title,
          artist:    result.artist || '',
          thumbnail: result.cover || item.thumbnail || '',
          duration:  item.duration || '',
        }
        const newLen = cur.queue.length
        dispatch({ type: 'ADD_TO_QUEUE',    payload: qItem })
        dispatch({ type: 'SET_QUEUE_INDEX', payload: newLen })
      }
    } catch (err) {
      dispatch({ type: 'SET_LOADING', payload: false })
      showToast('Error: ' + err.message)
    }
  }, [showToast])

  const playNext = useCallback(() => {
    const s = stateRef.current
    if (!s.queue.length) return
    const nextIdx = s.isShuffle
      ? Math.floor(Math.random() * s.queue.length)
      : (s.queueIndex + 1) % s.queue.length
    dispatch({ type: 'SET_QUEUE_INDEX', payload: nextIdx })
    playSong(s.queue[nextIdx])
  }, [playSong])

  const playPrev = useCallback(() => {
    const audio = audioRef.current
    const s     = stateRef.current
    if (audio?.currentTime > 3) { audio.currentTime = 0; return }
    if (!s.queue.length) return
    const prevIdx = (s.queueIndex - 1 + s.queue.length) % s.queue.length
    dispatch({ type: 'SET_QUEUE_INDEX', payload: prevIdx })
    playSong(s.queue[prevIdx])
  }, [playSong])

  // Update endedRef whenever playNext/repeatMode changes
  useEffect(() => {
    endedRef.current = () => {
      const s = stateRef.current
      if (s.repeatMode === 2) {
        audioRef.current.currentTime = 0
        audioRef.current.play()
      } else if (s.repeatMode === 1 || s.queue.length > 1) {
        playNext()
      } else {
        dispatch({ type: 'SET_PLAYING', payload: false })
      }
    }
  }, [playNext])

  // ── Keyboard shortcuts ─────────────────────────────────────────
  useEffect(() => {
    function onKey(e) {
      const tag = document.activeElement?.tagName?.toLowerCase()
      if (tag === 'input' || tag === 'textarea') return
      const s = stateRef.current
      switch (e.code) {
        case 'Space':
          e.preventDefault()
          if (audioRef.current?.src) {
            audioRef.current.paused ? audioRef.current.play() : audioRef.current.pause()
          }
          break
        case 'ArrowRight':
          e.preventDefault()
          if (audioRef.current?.duration)
            audioRef.current.currentTime = Math.min(audioRef.current.duration, audioRef.current.currentTime + 10)
          break
        case 'ArrowLeft':
          e.preventDefault()
          if (audioRef.current?.duration)
            audioRef.current.currentTime = Math.max(0, audioRef.current.currentTime - 10)
          break
        case 'KeyM': toggleMute(); break
        case 'KeyL':
          // Fix: call toggleLike only if there's a current track
          if (s.currentTrack) toggleLike()
          break
        case 'KeyN': playNext(); break
        case 'KeyP': playPrev(); break
        default: break
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [playNext, playPrev]) // eslint-disable-line

  const seekTo = useCallback((ratio) => {
    const audio = audioRef.current
    if (!audio?.duration) return
    audio.currentTime = ratio * audio.duration
  }, [])

  const setVolume = useCallback((v) => {
    dispatch({ type: 'SET_VOLUME', payload: v })
    saveLS('mk_volume', v)
    if (audioRef.current) audioRef.current.volume = v / 100
  }, [])

  const toggleMute = useCallback(() => {
    const muted = !stateRef.current.isMuted
    dispatch({ type: 'SET_MUTED', payload: muted })
    if (audioRef.current) audioRef.current.muted = muted
  }, [])

  const togglePlay = useCallback(() => {
    const audio = audioRef.current
    if (!audio?.src) return
    audio.paused ? audio.play() : audio.pause()
  }, [])

  const toggleShuffle = useCallback(() => {
    const next = !stateRef.current.isShuffle
    dispatch({ type: 'SET_SHUFFLE', payload: next })
    showToast(next ? 'Acak: Aktif' : 'Acak: Nonaktif')
  }, [showToast])

  const toggleRepeat = useCallback(() => {
    const next = (stateRef.current.repeatMode + 1) % 3
    dispatch({ type: 'SET_REPEAT', payload: next })
    showToast(['Ulangi: Nonaktif', 'Ulangi: Semua', 'Ulangi: Satu'][next])
  }, [showToast])

  const toggleLike = useCallback(() => {
    const id = stateRef.current.currentTrack?.videoId
    if (!id) return
    const isLiked = stateRef.current.liked.includes(id)
    dispatch({ type: 'TOGGLE_LIKE', payload: id })
    showToast(isLiked ? 'Dihapus dari favorit' : 'Ditambahkan ke favorit')
  }, [showToast])

  const addToQueue = useCallback((item) => {
    const s = stateRef.current
    if (s.queue.find(q => q.videoId === item.videoId)) {
      showToast('Sudah ada di antrian'); return
    }
    dispatch({
      type: 'ADD_TO_QUEUE',
      payload: {
        videoId:   item.videoId,
        title:     item.title,
        artist:    item.channel || item.artist || '',
        thumbnail: item.thumbnail || '',
        duration:  item.duration || '',
      },
    })
    showToast(`Ditambahkan: ${item.title}`)
  }, [showToast])

  const setPage = useCallback((page) => {
    dispatch({ type: 'SET_PAGE', payload: page })
  }, [])

  const value = {
    ...state,
    audioRef,
    dispatch,
    playSong,
    togglePlay,
    playNext,
    playPrev,
    seekTo,
    setVolume,
    toggleMute,
    toggleShuffle,
    toggleRepeat,
    toggleLike,
    addToQueue,
    removeFromQueue: (i) => dispatch({ type: 'REMOVE_FROM_QUEUE', payload: i }),
    clearQueue:      ()  => dispatch({ type: 'CLEAR_QUEUE' }),
    setPage,
    showToast,
  }

  return (
    <PlayerContext.Provider value={value}>
      {children}
    </PlayerContext.Provider>
  )
}

export function usePlayer() {
  const ctx = useContext(PlayerContext)
  if (!ctx) throw new Error('usePlayer must be inside PlayerProvider')
  return ctx
}
