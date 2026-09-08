'use strict'

const { getLyrics } = require('./_helpers')

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  const { title = '', artist = '' } = req.query
  if (!title) return res.status(400).json({ success: false, message: 'title diperlukan' })

  try {
    const lyrics = await getLyrics(title, artist)
    if (!lyrics) return res.status(404).json({ success: false, message: 'Lirik tidak ditemukan' })
    return res.json({ success: true, lyrics })
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message })
  }
}
