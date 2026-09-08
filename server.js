/*
 * Music App - Backend Server
 * Stack  : Node.js CJS + Express
 * APIs   : scriptmind.co (audio), Deezer (metadata), lrclib.net (lyrics)
 */

'use strict'

const express = require('express')
const axios   = require('axios')
const crypto  = require('crypto')
const path    = require('path')
const { Innertube } = require('youtubei.js')

const app  = express()
const PORT = process.env.PORT || 3000

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(express.json())
app.use(express.static(path.join(__dirname, 'public')))

// ─── YouTube (youtubei.js) singleton ─────────────────────────────────────────
let youtube = null
async function getYoutube() {
  if (!youtube) youtube = await Innertube.create()
  return youtube
}

// ─── Helper: get best thumbnail ──────────────────────────────────────────────
function getThumbnail(video) {
  const thumbs = video.thumbnails || []
  if (!thumbs.length) return null
  return thumbs[thumbs.length - 1]?.url || null
}

// ─── Helper: resolve audio via scriptmind.co ─────────────────────────────────
async function resolveAudio(videoUrl) {
  const guestId = crypto.randomUUID()
  const res = await axios.post(
    'https://scriptmind.co/api/media/resolve/preview',
    { url: videoUrl, platform: 'youtube', pageType: 'video', guestId },
    { headers: { 'Content-Type': 'application/json' }, timeout: 60000 }
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

// ─── Helper: cari metadata dari Deezer ───────────────────────────────────────
async function getDeezerMeta(query) {
  try {
    const res = await axios.get('https://api.deezer.com/search', {
      params: { q: query, limit: 1 },
      timeout: 8000
    })
    const track = res.data?.data?.[0]
    if (!track) return null
    return {
      title:      track.title,
      artist:     track.artist?.name    || null,
      album:      track.album?.title    || null,
      cover:      track.album?.cover_xl || track.album?.cover_big || null,
      preview:    track.preview         || null,
      deezerId:   track.id,
      artistId:   track.artist?.id      || null,
    }
  } catch {
    return null
  }
}

// ─── Helper: ambil lirik dari lrclib.net ─────────────────────────────────────
async function getLyrics(title, artist) {
  try {
    const res = await axios.get('https://lrclib.net/api/search', {
      params: { q: `${title} ${artist}` },
      timeout: 8000
    })
    const results = res.data || []
    if (!results.length) return null
    // Pilih yang paling relevan (ada synced lyrics diutamakan)
    const best = results.find(r => r.syncedLyrics) || results[0]
    return {
      plain:  best.plainLyrics  || null,
      synced: best.syncedLyrics || null,
      duration: best.duration   || null,
    }
  } catch {
    return null
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
//  ROUTES
// ═══════════════════════════════════════════════════════════════════════════════

// ─── GET /api/search?q=... ────────────────────────────────────────────────────
app.get('/api/search', async (req, res) => {
  const q = (req.query.q || '').trim()
  if (!q) return res.json({ success: false, message: 'Query tidak boleh kosong' })

  try {
    const yt = await getYoutube()
    const search = await yt.search(q, { type: 'video' })
    const videos = (search.videos || []).slice(0, 20)

    // Paralel: ambil meta Deezer untuk hasil pertama saja (untuk enrichment)
    const deezerMeta = await getDeezerMeta(q)

    const results = videos.map(v => ({
      videoId:   v.id,
      title:     v.title?.text    || 'Unknown',
      channel:   v.author?.name   || v.channel?.name || 'Unknown',
      duration:  v.duration?.text || null,
      thumbnail: getThumbnail(v),
      url:       `https://www.youtube.com/watch?v=${v.id}`,
      views:     v.view_count?.text || null,
    }))

    return res.json({
      success: true,
      results,
      deezerHint: deezerMeta,
    })
  } catch (err) {
    return res.json({ success: false, message: err.message || 'Gagal mencari' })
  }
})

// ─── POST /api/play ───────────────────────────────────────────────────────────
// Body: { videoId, title, artist }
app.post('/api/play', async (req, res) => {
  const { videoId, title, artist } = req.body || {}
  if (!videoId) return res.json({ success: false, message: 'videoId diperlukan' })

  try {
    const videoUrl = `https://www.youtube.com/watch?v=${videoId}`

    // Jalankan paralel: resolve audio + cari lyrics + cari deezer meta
    const searchQuery = [title, artist].filter(Boolean).join(' ') || videoId
    const [audioData, deezerMeta, lyricsData] = await Promise.allSettled([
      resolveAudio(videoUrl),
      getDeezerMeta(searchQuery),
      getLyrics(title || '', artist || ''),
    ])

    const audio   = audioData.status   === 'fulfilled' ? audioData.value   : null
    const deezer  = deezerMeta.status  === 'fulfilled' ? deezerMeta.value  : null
    const lyrics  = lyricsData.status  === 'fulfilled' ? lyricsData.value  : null

    if (!audio) {
      const errMsg = audioData.reason?.message || 'Gagal mendapatkan audio'
      return res.json({ success: false, message: errMsg })
    }

    return res.json({
      success: true,
      result: {
        videoId,
        url:      videoUrl,
        audioUrl: audio.audio,
        duration: audio.duration,
        title:    deezer?.title  || title  || audio.title  || 'Unknown',
        artist:   deezer?.artist || artist || 'Unknown',
        album:    deezer?.album  || null,
        cover:    deezer?.cover  || null,
        lyrics: lyrics ? {
          plain:  lyrics.plain,
          synced: lyrics.synced,
        } : null,
      }
    })
  } catch (err) {
    return res.json({ success: false, message: err.message || 'Terjadi kesalahan' })
  }
})

// ─── GET /api/lyrics?title=...&artist=... ────────────────────────────────────
app.get('/api/lyrics', async (req, res) => {
  const { title = '', artist = '' } = req.query
  if (!title) return res.json({ success: false, message: 'title diperlukan' })

  try {
    const lyrics = await getLyrics(title, artist)
    if (!lyrics) return res.json({ success: false, message: 'Lirik tidak ditemukan' })
    return res.json({ success: true, lyrics })
  } catch (err) {
    return res.json({ success: false, message: err.message })
  }
})

// ─── GET /api/trending ───────────────────────────────────────────────────────
app.get('/api/trending', async (req, res) => {
  try {
    const yt = await getYoutube()
    const trending = await yt.search('top music hits 2024', { type: 'video' })
    const videos = (trending.videos || []).slice(0, 12)

    const results = videos.map(v => ({
      videoId:   v.id,
      title:     v.title?.text    || 'Unknown',
      channel:   v.author?.name   || v.channel?.name || 'Unknown',
      duration:  v.duration?.text || null,
      thumbnail: getThumbnail(v),
      url:       `https://www.youtube.com/watch?v=${v.id}`,
      views:     v.view_count?.text || null,
    }))

    return res.json({ success: true, results })
  } catch (err) {
    return res.json({ success: false, message: err.message })
  }
})

// ─── GET /api/artist?name=... ────────────────────────────────────────────────
app.get('/api/artist', async (req, res) => {
  const name = (req.query.name || '').trim()
  if (!name) return res.json({ success: false, message: 'name diperlukan' })

  try {
    // Cari artis via Deezer
    const searchRes = await axios.get('https://api.deezer.com/search/artist', {
      params: { q: name, limit: 1 },
      timeout: 8000
    })
    const artistData = searchRes.data?.data?.[0]
    if (!artistData) return res.json({ success: false, message: 'Artis tidak ditemukan' })

    // Ambil top tracks artis
    const tracksRes = await axios.get(`https://api.deezer.com/artist/${artistData.id}/top`, {
      params: { limit: 10 },
      timeout: 8000
    })
    const tracks = (tracksRes.data?.data || []).map(t => ({
      deezerId: t.id,
      title:    t.title,
      album:    t.album?.title  || null,
      cover:    t.album?.cover_xl || null,
      duration: t.duration,
      preview:  t.preview       || null,
    }))

    return res.json({
      success: true,
      artist: {
        id:         artistData.id,
        name:       artistData.name,
        picture:    artistData.picture_xl || artistData.picture_big || null,
        fans:       artistData.nb_fan     || null,
        topTracks:  tracks,
      }
    })
  } catch (err) {
    return res.json({ success: false, message: err.message })
  }
})

// ─── Fallback → serve frontend ───────────────────────────────────────────────
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'))
})

// ─── Start ────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🎵 Music App berjalan di http://localhost:${PORT}`)
  // Pre-warm YouTube client
  getYoutube().then(() => console.log('✅ YouTube client siap'))
              .catch(e  => console.error('⚠️  YouTube client gagal:', e.message))
})
