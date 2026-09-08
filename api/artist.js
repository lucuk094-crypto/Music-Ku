'use strict'

const axios = require('axios')

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  const name = (req.query.name || '').trim()
  if (!name) return res.status(400).json({ success: false, message: 'name diperlukan' })

  try {
    const searchRes = await axios.get('https://api.deezer.com/search/artist', {
      params: { q: name, limit: 1 },
      timeout: 8000
    })
    const artistData = searchRes.data?.data?.[0]
    if (!artistData) return res.status(404).json({ success: false, message: 'Artis tidak ditemukan' })

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
      preview:  t.preview || null,
    }))

    return res.json({
      success: true,
      artist: {
        id:        artistData.id,
        name:      artistData.name,
        picture:   artistData.picture_xl || artistData.picture_big || null,
        fans:      artistData.nb_fan     || null,
        topTracks: tracks,
      }
    })
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message })
  }
}
