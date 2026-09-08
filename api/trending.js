'use strict'

const { getYoutube, getThumbnail, sendJson } = require('./_helpers')

module.exports = async (req, res) => {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.statusCode = 200
    return res.end()
  }

  try {
    const yt     = await getYoutube()
    const search = await yt.search('top music hits 2024', { type: 'video' })
    const videos = (search.videos || []).slice(0, 12)

    const results = videos.map(v => ({
      videoId:   v.id,
      title:     v.title?.text      || 'Unknown',
      channel:   v.author?.name     || v.channel?.name || 'Unknown',
      duration:  v.duration?.text   || null,
      thumbnail: getThumbnail(v),
      url:       `https://www.youtube.com/watch?v=${v.id}`,
      views:     v.view_count?.text || null,
    }))

    return sendJson(res, 200, { success: true, results })
  } catch (err) {
    return sendJson(res, 500, { success: false, message: err.message })
  }
}
