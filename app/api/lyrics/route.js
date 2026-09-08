import { NextResponse } from 'next/server'
import { getLyrics } from '@/lib/helpers'

export const maxDuration = 30

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const title  = (searchParams.get('title')  || '').trim()
  const artist = (searchParams.get('artist') || '').trim()

  if (!title) {
    return NextResponse.json({ success: false, message: 'title diperlukan' }, { status: 400 })
  }

  try {
    const lyrics = await getLyrics(title, artist)
    if (!lyrics) {
      return NextResponse.json({ success: false, message: 'Lirik tidak ditemukan' }, { status: 404 })
    }
    return NextResponse.json({ success: true, lyrics })
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 })
  }
}
