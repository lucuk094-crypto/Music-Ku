'use strict'

const { resolveAudio, getDeezerMeta, getLyrics } = require('./_helpers')

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*')

  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
    return res.status(200).end()
  }

  let body = req.body || {}
  if (typeof body === 'string') {
    try { body = JSON.parse(body) } catch { body = {} }
  }

  const { videoId, title, artist } = body
  if (!videoId) return res.status(400).json({ success: false, message: 'videoId diperlukan' })

  try {
    const videoUrl    = `https://www.youtube.com/watch?v=${videoId}`
    const searchQuery = [title, artist].filter(Boolean).join(' ') || videoId

    const [audioData, deezerData, lyricsData] = await Promise.allSettled([
      resolveAudio(videoUrl),
      getDeezerMeta(searchQuery),
      getLyrics(title || '', artist || ''),
    ])

    const audio  = audioData.status  === 'fulfilled' ? audioData.value  : null
    const deezer = deezerData.status === 'fulfilled' ? deezerData.value : null
    const lyrics = lyricsData.status === 'fulfilled' ? lyricsData.value : null

    if (!audio) {
      return res.status(500).json({
        success: false,
        message: audioData.reason?.message || 'Gagal mendapatkan audio'
      })
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
        lyrics:   lyrics ? { plain: lyrics.plain, synced: lyrics.synced } : null,
      }
    })
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message || 'Terjadi kesalahan' })
  }
}
