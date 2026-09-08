import './globals.css'
import { PlayerProvider } from '@/context/PlayerContext'

export const metadata = {
  title: 'MusikKu — Streaming Musik Gratis',
  description: 'Streaming jutaan lagu gratis dengan lirik sinkron, cover art HD, dan info artis lengkap.',
}

export default function RootLayout({ children }) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <PlayerProvider>
          {children}
        </PlayerProvider>
      </body>
    </html>
  )
}
