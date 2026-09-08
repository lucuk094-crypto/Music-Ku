import { NextResponse } from 'next/server'
import { getYoutube, getThumbnail } from '@/lib/helpers'

export const maxDuration = 60

// Multi-genre queries
const GENRE_QUERIES = [
  { genre: 'Pop',      query: 'top pop songs 2024' },
  { genre: 'Hip-Hop',  query: 'top hip hop rap songs 2024' },
  { genre: 'Rock',     query: 'best rock songs 2024' },
  { genre: 'EDM',      query: 'best edm electronic music 2024' },
  { genre: 'K-Pop',    query: 'kpop hits 2024' },
  { genre: 'Jazz',     query: 'best jazz songs relaxing' },
  { genre: 'Dangdut',  query: 'dangdut terbaru 2024' },
  { genre: 'Indonesia',query: 'lagu indonesia terbaru 2024' },
  { genre: 'R&B',      query: 'best rnb songs 2024' },
  { genre: 'Classical',query: 'best classical music relaxing' },
]

function mapVideo(v) {
  return {
    videoId:   v.id,
    title:     v.title?.text      || 'Unknown',
    channel:   v.author?.name     || v.channel?.name || 'Unknown',
    duration:  v.duration?.text   || null,
    thumbnail: getThumbnail(v),
    url:       `https://www.youtube.com/watch?v=${v.id}`,
    views:     v.view_count?.text || null,
  }
}

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const genre = searchParams.get('genre') || null

  try {
    const yt = await getYoutube()

    // Single genre request
    if (genre) {
      const found = GENRE_QUERIES.find(g => g.genre.toLowerCase() === genre.toLowerCase())
      const query = found?.query || `${genre} music 2024`
      const search = await yt.search(query, { type: 'video' })
      const results = (search.videos || []).slice(0, 20).map(mapVideo)
      return NextResponse.json({ success: true, results, genre })
    }

    // All genres: fetch top 3 per genre (limit to 3 genres for speed)
    const featured = GENRE_QUERIES.slice(0, 4)
    const searches = await Promise.allSettled(
      featured.map(g => yt.search(g.query, { type: 'video' }))
    )

    const genres = featured.map((g, i) => {
      const res = searches[i]
      const videos = res.status === 'fulfilled'
        ? (res.value.videos || []).slice(0, 8).map(mapVideo)
        : []
      return { genre: g.genre, videos }
    })

    // Also return flat list for default trending
    const trending = genres.flatMap(g =>
      g.videos.slice(0, 3).map(v => ({ ...v, genre: g.genre }))
    )

    return NextResponse.json({ success: true, trending, genres, allGenres: GENRE_QUERIES.map(g => g.genre) })
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 })
  }
}
