import { NextResponse } from 'next/server'
import axios from 'axios'

export const maxDuration = 30

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const name = (searchParams.get('name') || '').trim()

  if (!name) {
    return NextResponse.json({ success: false, message: 'name diperlukan' }, { status: 400 })
  }

  try {
    const searchRes  = await axios.get('https://api.deezer.com/search/artist', {
      params: { q: name, limit: 1 },
      timeout: 8000,
    })
    const artistData = searchRes.data?.data?.[0]
    if (!artistData) {
      return NextResponse.json({ success: false, message: 'Artis tidak ditemukan' }, { status: 404 })
    }

    const tracksRes = await axios.get(`https://api.deezer.com/artist/${artistData.id}/top`, {
      params: { limit: 10 },
      timeout: 8000,
    })
    const tracks = (tracksRes.data?.data || []).map(t => ({
      deezerId: t.id,
      title:    t.title,
      album:    t.album?.title    || null,
      cover:    t.album?.cover_xl || null,
      duration: t.duration,
    }))

    return NextResponse.json({
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
    return NextResponse.json({ success: false, message: err.message }, { status: 500 })
  }
}
