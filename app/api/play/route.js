import { NextResponse } from 'next/server'
import { resolveAudio, getDeezerMeta, getLyrics } from '@/lib/helpers'

export const maxDuration = 60

export async function POST(request) {
  let body = {}
  try { body = await request.json() } catch { body = {} }

  const { videoId, title, artist } = body
  if (!videoId) {
    return NextResponse.json({ success: false, message: 'videoId diperlukan' }, { status: 400 })
  }

  try {
    const videoUrl    = `https://www.youtube.com/watch?v=${videoId}`
    const searchQuery = [title, artist].filter(Boolean).join(' ') || videoId

    const [audioData, deezerData, lyricsData] = await Promise.allSettled([
      resolveAudio(videoUrl),
      getDeezerMeta(searchQuery),
      getLyrics(title || '', artist || ''),
    ])

    const audio  = audioData.status  === 'fulfilled' ? audioData.value  : null
    const deezer = deezerData.status === 'fulfilled' ? deezerData.value : null
    const lyrics = lyricsData.status === 'fulfilled' ? lyricsData.value : null

    if (!audio) {
      return NextResponse.json(
        { success: false, message: audioData.reason?.message || 'Gagal mendapatkan audio' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      result: {
        videoId,
        url:      videoUrl,
        audioUrl: audio.audio,
        duration: audio.duration,
        title:    deezer?.title  || title  || audio.title  || 'Unknown',
        artist:   deezer?.artist || artist || 'Unknown',
        album:    deezer?.album  || null,
        cover:    deezer?.cover  || null,
        lyrics:   lyrics ? { plain: lyrics.plain, synced: lyrics.synced } : null,
      },
    })
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message || 'Terjadi kesalahan' }, { status: 500 })
  }
}
