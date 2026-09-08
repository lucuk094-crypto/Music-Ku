'use strict'
const { getYoutube, getThumbnail, sendJson } = require('./_helpers')

// Genre → query mapping
const GENRE_QUERIES = {
  'Pop':        'top pop songs 2024',
  'Hip-Hop':    'top hip hop songs 2024',
  'Rock':       'top rock songs 2024',
  'EDM':        'top EDM electronic dance music 2024',
  'K-Pop':      'top K-Pop songs 2024',
  'Jazz':       'best jazz music 2024',
  'Dangdut':    'lagu dangdut terbaik 2024',
  'Indonesia':  'lagu indonesia terpopuler 2024',
  'R&B':        'top R&B soul songs 2024',
  'Classical':  'best classical music orchestral',
  'Reggae':     'top reggae songs 2024',
  'Country':    'top country songs 2024',
}

// Dynamic trending queries (rotated by day-of-week for freshness)
const TRENDING_QUERIES = [
  'top music hits 2024',
  'viral songs 2024',
  'most popular songs this week',
  'trending music worldwide 2024',
  'best new songs 2024',
  'top 50 songs 2024',
  'chart hits 2024',
]

module.exports = async (req, res) => {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.statusCode = 200
    return res.end()
  }

  try {
    const url = new URL(req.url, `http://${req.headers.host}`)
    const genre = (url.searchParams.get('genre') || '').trim()

    const yt = await getYoutube()

    if (genre) {
      // Genre-specific search
      const query = GENRE_QUERIES[genre] || `top ${genre} songs 2024`
      const search = await yt.search(query, { type: 'video' })
      const videos = (search.videos || []).slice(0, 16)
      const results = videos.map(v => ({
        videoId: v.id,
        title: v.title?.text || 'Unknown',
        channel: v.author?.name || v.channel?.name || 'Unknown',
        duration: v.duration?.text || null,
        thumbnail: getThumbnail(v),
        url: `https://www.youtube.com/watch?v=${v.id}`,
        views: v.view_count?.text || null,
      }))
      return sendJson(res, 200, { success: true, results })
    }

    // Dynamic trending (rotated daily)
    const dayOfWeek = new Date().getDay()
    const query = TRENDING_QUERIES[dayOfWeek % TRENDING_QUERIES.length]

    const search = await yt.search(query, { type: 'video' })
    const videos = (search.videos || []).slice(0, 12)
    const trending = videos.map(v => ({
      videoId: v.id,
      title: v.title?.text || 'Unknown',
      channel: v.author?.name || v.channel?.name || 'Unknown',
      duration: v.duration?.text || null,
      thumbnail: getThumbnail(v),
      url: `https://www.youtube.com/watch?v=${v.id}`,
      views: v.view_count?.text || null,
    }))

    // Also fetch 3 genre samples in parallel for the home page
    const genreNames = ['Pop', 'Hip-Hop', 'Indonesia']
    const genreResults = await Promise.allSettled(
      genreNames.map(async (g) => {
        const gQuery = GENRE_QUERIES[g] || `top ${g} songs 2024`
        const s = await yt.search(gQuery, { type: 'video' })
        const vids = (s.videos || []).slice(0, 6)
        return {
          genre: g,
          videos: vids.map(v => ({
            videoId: v.id,
            title: v.title?.text || 'Unknown',
            channel: v.author?.name || v.channel?.name || 'Unknown',
            duration: v.duration?.text || null,
            thumbnail: getThumbnail(v),
            url: `https://www.youtube.com/watch?v=${v.id}`,
            views: v.view_count?.text || null,
          })),
        }
      })
    )

    const genres = genreResults
      .filter(r => r.status === 'fulfilled')
      .map(r => r.value)

    return sendJson(res, 200, {
      success: true,
      results: trending,   // backward compat
      trending,            // explicit key
      genres,              // for HomePage genre sections
    })
  } catch (err) {
    return sendJson(res, 500, { success: false, message: err.message })
  }
}
