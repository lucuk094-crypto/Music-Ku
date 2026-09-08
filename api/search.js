'use strict'

const { getYoutube, getThumbnail, getDeezerMeta } = require('./_helpers')

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  const q = (req.query.q || '').trim()
  if (!q) return res.status(400).json({ success: false, message: 'Query tidak boleh kosong' })

  try {
    const yt = await getYoutube()
    const search = await yt.search(q, { type: 'video' })
    const videos = (search.videos || []).slice(0, 20)
    const deezerHint = await getDeezerMeta(q)

    const results = videos.map(v => ({
      videoId:   v.id,
      title:     v.title?.text    || 'Unknown',
      channel:   v.author?.name   || v.channel?.name || 'Unknown',
      duration:  v.duration?.text || null,
      thumbnail: getThumbnail(v),
      url:       `https://www.youtube.com/watch?v=${v.id}`,
      views:     v.view_count?.text || null,
    }))

    return res.json({ success: true, results, deezerHint })
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message || 'Gagal mencari' })
  }
}
