import { NextResponse } from 'next/server'
import { getYoutube, getThumbnail } from '@/lib/helpers'

export const maxDuration = 60

export async function GET() {
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

    return NextResponse.json({ success: true, results })
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 })
  }
}
