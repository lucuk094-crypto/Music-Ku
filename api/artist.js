'use strict'

const axios = require('axios')
const { sendJson } = require('./_helpers')

module.exports = async (req, res) => {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.statusCode = 200
    return res.end()
  }

  const url  = new URL(req.url, `http://${req.headers.host}`)
  const name = (url.searchParams.get('name') || '').trim()

  if (!name) return sendJson(res, 400, { success: false, message: 'name diperlukan' })

  try {
    const searchRes  = await axios.get('https://api.deezer.com/search/artist', {
      params: { q: name, limit: 1 },
      timeout: 8000,
    })
    const artistData = searchRes.data?.data?.[0]
    if (!artistData) return sendJson(res, 404, { success: false, message: 'Artis tidak ditemukan' })

    const tracksRes = await axios.get(`https://api.deezer.com/artist/${artistData.id}/top`, {
      params: { limit: 10 },
      timeout: 8000,
    })
    const tracks = (tracksRes.data?.data || []).map(t => ({
      deezerId: t.id,
      title:    t.title,
      album:    t.album?.title     || null,
      cover:    t.album?.cover_xl  || null,
      duration: t.duration,
      preview:  t.preview          || null,
    }))

    return sendJson(res, 200, {
      success: true,
      artist: {
        id:        artistData.id,
        name:      artistData.name,
        picture:   artistData.picture_xl || artistData.picture_big || null,
        fans:      artistData.nb_fan     || null,
        topTracks: tracks,
      },
    })
  } catch (err) {
    return sendJson(res, 500, { success: false, message: err.message })
  }
}
