'use server'

import axios from 'axios'
import crypto from 'crypto'
import { Innertube } from 'youtubei.js'

// ── YouTube singleton ──────────────────────────────────────────
let _yt = null
export async function getYoutube() {
  if (!_yt) _yt = await Innertube.create()
  return _yt
}

// ── Best thumbnail ─────────────────────────────────────────────
export function getThumbnail(video) {
  const thumbs = video.thumbnails || []
  if (!thumbs.length) return null
  return thumbs[thumbs.length - 1]?.url || null
}

// ── Resolve audio via scriptmind.co ───────────────────────────
export async function resolveAudio(videoUrl) {
  const guestId = crypto.randomUUID()
  const res = await axios.post(
    'https://scriptmind.co/api/media/resolve/preview',
    { url: videoUrl, platform: 'youtube', pageType: 'video', guestId },
    { headers: { 'Content-Type': 'application/json' }, timeout: 55000 }
  )
  const data = res.data
  if (!data?.success) throw new Error(data?.message || 'Gagal resolve audio')

  const result = data.result || {}
  let media
  try {
    media = typeof result.resolvedMediaJson === 'string'
      ? JSON.parse(result.resolvedMediaJson)
      : result.resolvedMediaJson
  } catch {
    throw new Error('Gagal membaca data media')
  }

  const audio = media?.tunnel?.[1] || media?.tunnel?.[0] || null
  if (!audio) throw new Error('URL audio tidak ditemukan')

  return {
    audio,
    duration: media?.duration || result.duration || null,
    title:    result.title    || null,
  }
}

// ── Deezer metadata ───────────────────────────────────────────
export async function getDeezerMeta(query) {
  try {
    const res = await axios.get('https://api.deezer.com/search', {
      params: { q: query, limit: 1 },
      timeout: 8000,
    })
    const track = res.data?.data?.[0]
    if (!track) return null
    return {
      title:    track.title,
      artist:   track.artist?.name    || null,
      album:    track.album?.title    || null,
      cover:    track.album?.cover_xl || track.album?.cover_big || null,
      deezerId: track.id,
    }
  } catch {
    return null
  }
}

// ── lrclib lyrics ─────────────────────────────────────────────
export async function getLyrics(title, artist) {
  try {
    const res = await axios.get('https://lrclib.net/api/search', {
      params: { q: `${title} ${artist}` },
      timeout: 8000,
    })
    const results = res.data || []
    if (!results.length) return null
    const best = results.find(r => r.syncedLyrics) || results[0]
    return {
      plain:  best.plainLyrics  || null,
      synced: best.syncedLyrics || null,
    }
  } catch {
    return null
  }
}
