'use strict'

const { resolveAudio, getDeezerMeta, getLyrics, sendJson, parseBody } = require('./_helpers')

module.exports = async (req, res) => {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
    res.statusCode = 200
    return res.end()
  }

  if (req.method !== 'POST') {
    return sendJson(res, 405, { success: false, message: 'Method not allowed' })
  }

  const body    = await parseBody(req)
  const { videoId, title, artist } = body

  if (!videoId) return sendJson(res, 400, { success: false, message: 'videoId diperlukan' })

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
      return sendJson(res, 500, {
        success: false,
        message: audioData.reason?.message || 'Gagal mendapatkan audio',
      })
    }

    return sendJson(res, 200, {
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
      },
    })
  } catch (err) {
    return sendJson(res, 500, { success: false, message: err.message || 'Terjadi kesalahan' })
  }
}
