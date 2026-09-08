'use strict'

const { getLyrics, sendJson } = require('./_helpers')

module.exports = async (req, res) => {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.statusCode = 200
    return res.end()
  }

  const url    = new URL(req.url, `http://${req.headers.host}`)
  const title  = (url.searchParams.get('title')  || '').trim()
  const artist = (url.searchParams.get('artist') || '').trim()

  if (!title) return sendJson(res, 400, { success: false, message: 'title diperlukan' })

  try {
    const lyrics = await getLyrics(title, artist)
    if (!lyrics) return sendJson(res, 404, { success: false, message: 'Lirik tidak ditemukan' })
    return sendJson(res, 200, { success: true, lyrics })
  } catch (err) {
    return sendJson(res, 500, { success: false, message: err.message })
  }
}
