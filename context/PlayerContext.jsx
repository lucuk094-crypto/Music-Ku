'use client'

import { createContext, useContext, useReducer, useRef, useEffect, useCallback } from 'react'

const PlayerContext = createContext(null)

const initialState = {
  // Track
  currentTrack: null,   // { videoId, title, artist, album, cover, audioUrl, duration, lyrics }
  // Queue
  queue:        [],
  queueIndex:   -1,
  // Playback
  isPlaying:    false,
  isLoading:    false,
  isShuffle:    false,
  repeatMode:   0,      // 0=off 1=all 2=one
  isMuted:      false,
  volume:       80,
  // Progress
  currentTime:  0,
  duration:     0,
  // UI
  liked:        [],
  toast:        null,
  activePage:   'home',
}

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
    case 'TOGGLE_LIKE': {
      const id = action.payload
      const liked = state.liked.includes(id)
        ? state.liked.filter(x => x !== id)
        : [...state.liked, id]
      return { ...state, liked }
    }
    case 'ADD_TO_QUEUE': {
      if (state.queue.find(q => q.videoId === action.payload.videoId)) return state
      return { ...state, queue: [...state.queue, action.payload] }
    }
    case 'REMOVE_FROM_QUEUE': {
      const newQueue = state.queue.filter((_, i) => i !== action.payload)
      const newIndex = action.payload <= state.queueIndex
        ? Math.max(0, state.queueIndex - 1)
        : state.queueIndex
      return { ...state, queue: newQueue, queueIndex: newQueue.length ? newIndex : -1 }
    }
    case 'CLEAR_QUEUE':     return { ...state, queue: [], queueIndex: -1 }
    default:                return state
  }
}

export function PlayerProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState)
  const audioRef = useRef(null)
  const toastTimer = useRef(null)

  // Init audio
  useEffect(() => {
    if (typeof window === 'undefined') return
    const audio = new Audio()
    audio.preload = 'none'
    audioRef.current = audio

    audio.addEventListener('play',            () => dispatch({ type: 'SET_PLAYING', payload: true }))
    audio.addEventListener('pause',           () => dispatch({ type: 'SET_PLAYING', payload: false }))
    audio.addEventListener('timeupdate',      () => dispatch({ type: 'SET_TIME',    payload: audio.currentTime }))
    audio.addEventListener('loadedmetadata',  () => dispatch({ type: 'SET_DURATION', payload: audio.duration }))
    audio.addEventListener('ended',           handleEnded)

    return () => { audio.pause(); audio.src = '' }
  }, [])

  function handleEnded() {
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

  // Keep a ref to latest state for use in callbacks
  const stateRef = useRef(state)
  useEffect(() => { stateRef.current = state }, [state])

  // ── Actions ──────────────────────────────────────────────────

  const showToast = useCallback((msg) => {
    dispatch({ type: 'SET_TOAST', payload: msg })
    clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => dispatch({ type: 'SET_TOAST', payload: null }), 2800)
  }, [])

  const playSong = useCallback(async (item) => {
    dispatch({ type: 'SET_LOADING', payload: true })
    try {
      const res  = await fetch('/api/play', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
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

      dispatch({ type: 'SET_TRACK',   payload: data.result })
      dispatch({ type: 'SET_LOADING', payload: false })

      // Set audio
      const audio = audioRef.current
      audio.src    = data.result.audioUrl
      audio.volume = stateRef.current.volume / 100
      audio.muted  = stateRef.current.isMuted
      audio.load()
      audio.play().catch(() => showToast('Autoplay diblokir — klik play'))

      // Add/update queue
      const cur = stateRef.current
      const idx = cur.queue.findIndex(q => q.videoId === item.videoId)
      if (idx !== -1) {
        dispatch({ type: 'SET_QUEUE_INDEX', payload: idx })
      } else {
        const qItem = {
          videoId:   item.videoId,
          title:     data.result.title     || item.title,
          artist:    data.result.artist    || '',
          thumbnail: data.result.cover     || item.thumbnail || '',
          duration:  item.duration         || '',
        }
        dispatch({ type: 'ADD_TO_QUEUE',    payload: qItem })
        dispatch({ type: 'SET_QUEUE_INDEX', payload: cur.queue.length })
      }
    } catch (err) {
      dispatch({ type: 'SET_LOADING', payload: false })
      showToast('Error: ' + err.message)
    }
  }, [showToast])

  const togglePlay = useCallback(() => {
    const audio = audioRef.current
    if (!audio?.src) return
    audio.paused ? audio.play() : audio.pause()
  }, [])

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
    const s = stateRef.current
    if (audio?.currentTime > 3) { audio.currentTime = 0; return }
    if (!s.queue.length) return
    const prevIdx = (s.queueIndex - 1 + s.queue.length) % s.queue.length
    dispatch({ type: 'SET_QUEUE_INDEX', payload: prevIdx })
    playSong(s.queue[prevIdx])
  }, [playSong])

  const seekTo = useCallback((ratio) => {
    const audio = audioRef.current
    if (!audio?.duration) return
    audio.currentTime = ratio * audio.duration
  }, [])

  const setVolume = useCallback((v) => {
    const audio = audioRef.current
    dispatch({ type: 'SET_VOLUME', payload: v })
    if (audio) audio.volume = v / 100
  }, [])

  const toggleMute = useCallback(() => {
    const audio = audioRef.current
    const muted = !stateRef.current.isMuted
    dispatch({ type: 'SET_MUTED', payload: muted })
    if (audio) audio.muted = muted
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
      showToast('Sudah ada di antrian')
      return
    }
    dispatch({ type: 'ADD_TO_QUEUE', payload: {
      videoId:   item.videoId,
      title:     item.title,
      artist:    item.channel || item.artist || '',
      thumbnail: item.thumbnail || '',
      duration:  item.duration  || '',
    }})
    showToast(`Ditambahkan: ${item.title}`)
  }, [showToast])

  const setPage = useCallback((page) => {
    dispatch({ type: 'SET_PAGE', payload: page })
  }, [])

  const value = {
    ...state,
    audioRef,
    playSong, togglePlay, playNext, playPrev,
    seekTo, setVolume, toggleMute,
    toggleShuffle, toggleRepeat, toggleLike,
    addToQueue,
    removeFromQueue: (i) => dispatch({ type: 'REMOVE_FROM_QUEUE', payload: i }),
    clearQueue:      ()  => dispatch({ type: 'CLEAR_QUEUE' }),
    setPage, showToast,
    dispatch,
  }

  return <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>
}

export function usePlayer() {
  const ctx = useContext(PlayerContext)
  if (!ctx) throw new Error('usePlayer must be used inside PlayerProvider')
  return ctx
}
