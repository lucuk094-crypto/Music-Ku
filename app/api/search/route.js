import { NextResponse } from 'next/server'
import { getYoutube, getThumbnail, getDeezerMeta } from '@/lib/helpers'

export const maxDuration = 60

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const q = (searchParams.get('q') || '').trim()

  if (!q) {
    return NextResponse.json({ success: false, message: 'Query tidak boleh kosong' }, { status: 400 })
  }

  try {
    const yt         = await getYoutube()
    const search     = await yt.search(q, { type: 'video' })
    const videos     = (search.videos || []).slice(0, 20)
    const deezerHint = await getDeezerMeta(q)

    const results = videos.map(v => ({
      videoId:   v.id,
      title:     v.title?.text      || 'Unknown',
      channel:   v.author?.name     || v.channel?.name || 'Unknown',
      duration:  v.duration?.text   || null,
      thumbnail: getThumbnail(v),
      url:       `https://www.youtube.com/watch?v=${v.id}`,
      views:     v.view_count?.text || null,
    }))

    return NextResponse.json({ success: true, results, deezerHint })
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message || 'Gagal mencari' }, { status: 500 })
  }
}
