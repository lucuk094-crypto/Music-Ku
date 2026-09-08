'use strict'

const { getYoutube, getThumbnail, getDeezerMeta, sendJson } = require('./_helpers')

module.exports = async (req, res) => {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
    res.statusCode = 200
    return res.end()
  }

  const url  = new URL(req.url, `http://${req.headers.host}`)
  const q    = (url.searchParams.get('q') || '').trim()

  if (!q) return sendJson(res, 400, { success: false, message: 'Query tidak boleh kosong' })

  try {
    const yt         = await getYoutube()
    const search     = await yt.search(q, { type: 'video' })
    const videos     = (search.videos || []).slice(0, 20)
    const deezerHint = await getDeezerMeta(q)

    const results = videos.map(v => ({
      videoId:   v.id,
      title:     v.title?.text         || 'Unknown',
      channel:   v.author?.name        || v.channel?.name || 'Unknown',
      duration:  v.duration?.text      || null,
      thumbnail: getThumbnail(v),
      url:       `https://www.youtube.com/watch?v=${v.id}`,
      views:     v.view_count?.text    || null,
    }))

    return sendJson(res, 200, { success: true, results, deezerHint })
  } catch (err) {
    return sendJson(res, 500, { success: false, message: err.message || 'Gagal mencari' })
  }
}
