'use strict'

/* ═══════════════════════════════════════════════════════════
   MusikKu — Frontend App
   Features: Search, Player, Lyrics Sync, Queue, Artist Info
   ═══════════════════════════════════════════════════════════ */

// ── DOM refs ──────────────────────────────────────────────────
const audio         = document.getElementById('audioPlayer')
const btnPlay       = document.getElementById('btnPlay')
const playIcon      = document.getElementById('playIcon')
const btnPrev       = document.getElementById('btnPrev')
const btnNext       = document.getElementById('btnNext')
const btnShuffle    = document.getElementById('btnShuffle')
const btnRepeat     = document.getElementById('btnRepeat')
const btnMute       = document.getElementById('btnMute')
const volumeIcon    = document.getElementById('volumeIcon')
const volumeSlider  = document.getElementById('volumeSlider')
const progressBar   = document.getElementById('progressBar')
const progressFill  = document.getElementById('progressFill')
const progressThumb = document.getElementById('progressThumb')
const currentTime   = document.getElementById('currentTime')
const totalTime     = document.getElementById('totalTime')
const playerCover   = document.getElementById('playerCover')
const playerTitle   = document.getElementById('playerTitle')
const playerArtist  = document.getElementById('playerArtist')
const btnLike       = document.getElementById('btnLike')
const heartIcon     = document.getElementById('heartIcon')
const searchInput   = document.getElementById('searchInput')
const clearSearch   = document.getElementById('clearSearch')
const searchGrid    = document.getElementById('searchGrid')
const searchHint    = document.getElementById('searchHint')
const trendingGrid  = document.getElementById('trendingGrid')
const queueList     = document.getElementById('queueList')
const queueEmpty    = document.getElementById('queueEmpty')
const queueCount    = document.getElementById('queueCount')
const lyricsContainer = document.getElementById('lyricsContainer')
const lyricsCover   = document.getElementById('lyricsCover')
const lyricsTitle   = document.getElementById('lyricsTitle')
const lyricsArtist  = document.getElementById('lyricsArtist')
const lyricsAlbum   = document.getElementById('lyricsAlbum')
const artistInput   = document.getElementById('artistInput')
const btnSearchArtist = document.getElementById('btnSearchArtist')
const artistResult  = document.getElementById('artistResult')
const loadingOverlay = document.getElementById('loadingOverlay')
const loadingText   = document.getElementById('loadingText')
const toastEl       = document.getElementById('toast')
const sidebarToggle = document.getElementById('sidebarToggle')
const sidebar       = document.getElementById('sidebar')
const themeToggle   = document.getElementById('themeToggle')
const themeIcon     = document.getElementById('themeIcon')
const miniNowPlaying = document.getElementById('miniNowPlaying')
const miniCover     = document.getElementById('miniCover')
const miniTitle     = document.getElementById('miniTitle')
const miniArtist    = document.getElementById('miniArtist')
const miniPlayBtn   = document.getElementById('miniPlayBtn')
const miniPlayIcon  = document.getElementById('miniPlayIcon')
const btnOpenLyrics = document.getElementById('btnOpenLyrics')

// ── State ──────────────────────────────────────────────────────
let queue         = []         // { videoId, title, artist, thumbnail, duration }
let queueIndex    = -1
let isShuffled    = false
let repeatMode    = 0          // 0=off 1=all 2=one
let isDragging    = false
let searchTimer   = null
let syncedLyrics  = []         // [{ time, text }]
let syncInterval  = null
let liked         = new Set()
let currentTrack  = null       // full track data

// ── Init ───────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  lucide.createIcons()
  loadTrending()
  setupEvents()
  setVolume(80)
})

// ── Navigation ─────────────────────────────────────────────────
document.querySelectorAll('.nav-item').forEach(btn => {
  btn.addEventListener('click', () => {
    const page = btn.dataset.page
    document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'))
    btn.classList.add('active')
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'))
    document.getElementById(`page-${page}`)?.classList.add('active')
  })
})

function goToPage(name) {
  document.querySelectorAll('.nav-item').forEach(b => {
    b.classList.toggle('active', b.dataset.page === name)
  })
  document.querySelectorAll('.page').forEach(p => {
    p.classList.toggle('active', p.id === `page-${name}`)
  })
}

// ── Sidebar toggle ─────────────────────────────────────────────
sidebarToggle.addEventListener('click', () => sidebar.classList.toggle('open'))

// ── Theme toggle ───────────────────────────────────────────────
themeToggle.addEventListener('click', () => {
  const html = document.documentElement
  const isDark = html.dataset.theme === 'dark'
  html.dataset.theme = isDark ? 'light' : 'dark'
  themeIcon.setAttribute('data-lucide', isDark ? 'moon' : 'sun')
  lucide.createIcons()
})

// ── Hero buttons ───────────────────────────────────────────────
document.getElementById('btnGoSearch')?.addEventListener('click', () => {
  goToPage('search')
  searchInput.focus()
})
document.getElementById('btnGoTrending')?.addEventListener('click', () => {
  goToPage('home')
  document.getElementById('trendingGrid')?.scrollIntoView({ behavior: 'smooth' })
})
btnOpenLyrics?.addEventListener('click', () => goToPage('lyrics'))

// ── Events setup ───────────────────────────────────────────────
function setupEvents() {
  // Search input
  searchInput.addEventListener('input', () => {
    const val = searchInput.value.trim()
    clearSearch.style.display = val ? 'flex' : 'none'
    clearTimeout(searchTimer)
    if (!val) {
      searchGrid.innerHTML = ''
      searchHint.style.display = 'flex'
      return
    }
    searchHint.style.display = 'none'
    searchTimer = setTimeout(() => doSearch(val), 500)
    goToPage('search')
  })
  searchInput.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      clearTimeout(searchTimer)
      const val = searchInput.value.trim()
      if (val) doSearch(val)
    }
  })
  clearSearch.addEventListener('click', () => {
    searchInput.value = ''
    clearSearch.style.display = 'none'
    searchGrid.innerHTML = ''
    searchHint.style.display = 'flex'
    searchInput.focus()
  })

  // Player controls
  btnPlay.addEventListener('click', togglePlay)
  btnPrev.addEventListener('click', playPrev)
  btnNext.addEventListener('click', playNext)
  btnShuffle.addEventListener('click', toggleShuffle)
  btnRepeat.addEventListener('click', toggleRepeat)
  btnMute.addEventListener('click', toggleMute)
  volumeSlider.addEventListener('input', () => setVolume(+volumeSlider.value))
  btnLike.addEventListener('click', toggleLike)

  // Mini player
  miniPlayBtn?.addEventListener('click', togglePlay)

  // Progress bar
  progressBar.addEventListener('click', seekTo)
  progressBar.addEventListener('mousedown', () => isDragging = true)
  document.addEventListener('mousemove', e => {
    if (!isDragging) return
    const rect = progressBar.getBoundingClientRect()
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
    if (audio.duration) audio.currentTime = ratio * audio.duration
  })
  document.addEventListener('mouseup', () => isDragging = false)

  // Audio events
  audio.addEventListener('timeupdate', onTimeUpdate)
  audio.addEventListener('loadedmetadata', onMetadata)
  audio.addEventListener('ended', onEnded)
  audio.addEventListener('play', () => {
    setPlayIcon(true)
    lucide.createIcons()
  })
  audio.addEventListener('pause', () => {
    setPlayIcon(false)
    lucide.createIcons()
  })
  audio.addEventListener('error', () => {
    showToast('Gagal memutar audio')
    hideLoading()
  })

  // Trending refresh
  document.getElementById('btnRefreshTrending')?.addEventListener('click', loadTrending)

  // Queue clear
  document.getElementById('btnClearQueue')?.addEventListener('click', () => {
    queue = []
    queueIndex = -1
    renderQueue()
    showToast('Antrian dikosongkan')
  })

  // Artist search
  btnSearchArtist.addEventListener('click', () => {
    const name = artistInput.value.trim()
    if (name) doArtistSearch(name)
  })
  artistInput.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      const name = artistInput.value.trim()
      if (name) doArtistSearch(name)
    }
  })
}

// ═══════════════════════════════════════════════════════════════
//  API CALLS
// ═══════════════════════════════════════════════════════════════

async function loadTrending() {
  trendingGrid.innerHTML = Array(6).fill('<div class="skeleton-card"></div>').join('')
  try {
    const res = await fetch('/api/trending')
    const data = await res.json()
    if (data.success) renderCards(trendingGrid, data.results)
    else trendingGrid.innerHTML = '<p class="hint-text">Gagal memuat trending</p>'
  } catch {
    trendingGrid.innerHTML = '<p class="hint-text">Gagal memuat trending</p>'
  }
}

async function doSearch(q) {
  searchGrid.innerHTML = Array(6).fill('<div class="skeleton-card"></div>').join('')
  try {
    const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`)
    const data = await res.json()
    if (data.success && data.results.length) {
      renderCards(searchGrid, data.results)
    } else {
      searchGrid.innerHTML = ''
      searchHint.textContent = 'Tidak ada hasil ditemukan'
      searchHint.style.display = 'flex'
    }
  } catch {
    searchGrid.innerHTML = ''
    searchHint.textContent = 'Gagal melakukan pencarian'
    searchHint.style.display = 'flex'
  }
}

async function playSong(item) {
  showLoading(`Memuat — ${item.title}`)
  try {
    const res = await fetch('/api/play', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        videoId: item.videoId,
        title:   item.title,
        artist:  item.channel || item.artist || '',
      })
    })
    const data = await res.json()
    hideLoading()

    if (!data.success) {
      showToast(data.message || 'Gagal memutar lagu')
      return
    }

    currentTrack = data.result

    // Set audio src
    audio.src = data.result.audioUrl
    audio.load()
    audio.play().catch(() => showToast('Autoplay diblokir browser'))

    // Update player UI
    updatePlayerUI(data.result)
    updateLyricsPage(data.result)

    // Lyrics sync
    setupLyricsSync(data.result.lyrics)

    // Queue: mark active
    const idx = queue.findIndex(q => q.videoId === item.videoId)
    if (idx !== -1) {
      queueIndex = idx
    } else {
      // Add to queue
      queue.push({
        videoId:   item.videoId,
        title:     data.result.title || item.title,
        artist:    data.result.artist || '',
        thumbnail: data.result.cover || item.thumbnail,
        duration:  item.duration || '',
      })
      queueIndex = queue.length - 1
    }
    renderQueue()

  } catch (err) {
    hideLoading()
    showToast('Terjadi kesalahan: ' + err.message)
  }
}

async function doArtistSearch(name) {
  artistResult.innerHTML = `<div class="hint-text"><div class="loading-ring" style="width:28px;height:28px"></div></div>`
  try {
    const res = await fetch(`/api/artist?name=${encodeURIComponent(name)}`)
    const data = await res.json()
    if (data.success) renderArtist(data.artist)
    else artistResult.innerHTML = `<p class="hint-text">Artis tidak ditemukan</p>`
  } catch {
    artistResult.innerHTML = `<p class="hint-text">Gagal mencari artis</p>`
  }
}

// ═══════════════════════════════════════════════════════════════
//  RENDER HELPERS
// ═══════════════════════════════════════════════════════════════

function renderCards(container, items) {
  container.innerHTML = items.map(item => `
    <div class="song-card" data-id="${item.videoId}">
      <div class="card-thumb-wrap">
        <img class="card-thumb" src="${item.thumbnail || ''}" alt="${escHtml(item.title)}" loading="lazy" />
        <div class="card-overlay">
          <div class="card-play-btn">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor" stroke="none">
              <polygon points="5,3 19,12 5,21"/>
            </svg>
          </div>
        </div>
        <button class="card-queue-btn" data-id="${item.videoId}" title="Tambah ke antrian">
          <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        </button>
        ${item.duration ? `<span class="card-duration">${item.duration}</span>` : ''}
      </div>
      <div class="card-info">
        <p class="card-title">${escHtml(item.title)}</p>
        <p class="card-channel">${escHtml(item.channel || item.artist || '—')}</p>
      </div>
    </div>
  `).join('')

  // Events
  container.querySelectorAll('.song-card').forEach(card => {
    const id = card.dataset.id
    const item = items.find(i => i.videoId === id)
    card.addEventListener('click', e => {
      if (e.target.closest('.card-queue-btn')) return
      playSong(item)
    })
  })
  container.querySelectorAll('.card-queue-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation()
      const id = btn.dataset.id
      const item = items.find(i => i.videoId === id)
      addToQueue(item)
    })
  })
}

function addToQueue(item) {
  if (queue.find(q => q.videoId === item.videoId)) {
    showToast('Sudah ada di antrian')
    return
  }
  queue.push({
    videoId:   item.videoId,
    title:     item.title,
    artist:    item.channel || item.artist || '',
    thumbnail: item.thumbnail || '',
    duration:  item.duration || '',
  })
  renderQueue()
  showToast(`Ditambahkan: ${item.title}`)
}

function renderQueue() {
  // Badge
  const count = queue.length
  queueCount.textContent = count
  queueCount.style.display = count > 0 ? 'inline-flex' : 'none'

  if (!count) {
    queueEmpty.style.display = 'flex'
    queueList.innerHTML = ''
    return
  }
  queueEmpty.style.display = 'none'
  queueList.innerHTML = queue.map((item, i) => `
    <div class="queue-item ${i === queueIndex ? 'active' : ''}" data-index="${i}">
      <span class="queue-num">${i === queueIndex
        ? `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>`
        : i + 1}</span>
      <img class="queue-thumb" src="${item.thumbnail || ''}" alt="" loading="lazy" />
      <div class="queue-info">
        <p class="queue-title">${escHtml(item.title)}</p>
        <p class="queue-artist">${escHtml(item.artist || '—')}</p>
      </div>
      <span class="queue-dur">${item.duration || ''}</span>
      <button class="queue-remove" data-index="${i}" title="Hapus">
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    </div>
  `).join('')

  queueList.querySelectorAll('.queue-item').forEach(el => {
    el.addEventListener('click', e => {
      if (e.target.closest('.queue-remove')) return
      const idx = +el.dataset.index
      queueIndex = idx
      playSong(queue[idx])
    })
  })
  queueList.querySelectorAll('.queue-remove').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation()
      const idx = +btn.dataset.index
      queue.splice(idx, 1)
      if (queueIndex >= idx && queueIndex > 0) queueIndex--
      renderQueue()
    })
  })
}

function updatePlayerUI(result) {
  // Cover
  if (result.cover) {
    playerCover.src = result.cover
    playerCover.style.display = 'block'
  } else if (result.thumbnail) {
    playerCover.src = result.thumbnail
    playerCover.style.display = 'block'
  } else {
    playerCover.src = ''
    playerCover.style.display = 'none'
  }

  playerTitle.textContent  = result.title  || 'Unknown'
  playerArtist.textContent = result.artist || '—'
  btnPlay.disabled = false

  // Mini sidebar
  miniNowPlaying.style.display = 'flex'
  miniCover.src     = result.cover || result.thumbnail || ''
  miniTitle.textContent  = result.title  || 'Unknown'
  miniArtist.textContent = result.artist || '—'

  // Like state
  const isLiked = liked.has(result.videoId)
  btnLike.classList.toggle('liked', isLiked)

  lucide.createIcons()
}

function updateLyricsPage(result) {
  lyricsCover.src          = result.cover || result.thumbnail || ''
  lyricsTitle.textContent  = result.title  || '—'
  lyricsArtist.textContent = result.artist || '—'
  lyricsAlbum.textContent  = result.album  || '—'

  if (!result.lyrics) {
    lyricsContainer.innerHTML = `<div class="hint-text"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg> Lirik tidak tersedia</div>`
    return
  }

  if (result.lyrics.synced) {
    renderSyncedLyrics(result.lyrics.synced)
  } else if (result.lyrics.plain) {
    lyricsContainer.innerHTML = `<div class="lyrics-plain">${escHtml(result.lyrics.plain)}</div>`
  }
}

function renderSyncedLyrics(syncedStr) {
  // Parse format: [mm:ss.xx] line
  const lines = syncedStr.split('\n').map(line => {
    const match = line.match(/\[(\d+):(\d+\.\d+)\](.*)/)
    if (!match) return null
    const time = parseFloat(match[1]) * 60 + parseFloat(match[2])
    const text = match[3].trim()
    return { time, text }
  }).filter(Boolean)

  syncedLyrics = lines

  lyricsContainer.innerHTML = `<div class="lyrics-synced">${
    lines.map((l, i) => `<div class="lyric-line" data-index="${i}" data-time="${l.time}">${escHtml(l.text) || '&nbsp;'}</div>`).join('')
  }</div>`

  // Click to seek
  lyricsContainer.querySelectorAll('.lyric-line').forEach(el => {
    el.addEventListener('click', () => {
      const t = parseFloat(el.dataset.time)
      if (audio.duration) audio.currentTime = t
    })
  })
}

function renderArtist(artist) {
  artistResult.innerHTML = `
    <div class="artist-profile">
      <img class="artist-avatar" src="${artist.picture || ''}" alt="${escHtml(artist.name)}" />
      <div class="artist-profile-info">
        <h2>${escHtml(artist.name)}</h2>
        <p class="artist-fans">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          ${artist.fans ? Number(artist.fans).toLocaleString('id-ID') + ' fans' : '—'}
        </p>
      </div>
    </div>
    <p class="top-tracks-title">Top Tracks</p>
    <div class="track-list">${artist.topTracks.map((t, i) => `
      <div class="track-item" data-title="${escHtml(t.title)}" data-artist="${escHtml(artist.name)}">
        <span class="track-num">${i + 1}</span>
        <img class="track-cover" src="${t.cover || ''}" alt="${escHtml(t.title)}" loading="lazy" />
        <div class="track-info">
          <p class="track-title">${escHtml(t.title)}</p>
          <p class="track-album">${escHtml(t.album || '—')}</p>
        </div>
        <span class="track-dur">${fmtSec(t.duration)}</span>
      </div>
    `).join('')}</div>
  `

  // Click track → search + play
  artistResult.querySelectorAll('.track-item').forEach(el => {
    el.addEventListener('click', () => {
      const q = `${el.dataset.artist} ${el.dataset.title}`
      searchInput.value = q
      goToPage('search')
      doSearch(q)
    })
  })
}

// ═══════════════════════════════════════════════════════════════
//  PLAYER LOGIC
// ═══════════════════════════════════════════════════════════════

function togglePlay() {
  if (!audio.src) return
  if (audio.paused) audio.play()
  else audio.pause()
}

function setPlayIcon(playing) {
  playIcon.setAttribute('data-lucide', playing ? 'pause' : 'play')
  miniPlayIcon?.setAttribute('data-lucide', playing ? 'pause' : 'play')
  lucide.createIcons()
}

function playNext() {
  if (!queue.length) return
  if (isShuffled) {
    queueIndex = Math.floor(Math.random() * queue.length)
  } else {
    queueIndex = (queueIndex + 1) % queue.length
  }
  playSong(queue[queueIndex])
}

function playPrev() {
  if (!queue.length) return
  if (audio.currentTime > 3) { audio.currentTime = 0; return }
  queueIndex = (queueIndex - 1 + queue.length) % queue.length
  playSong(queue[queueIndex])
}

function toggleShuffle() {
  isShuffled = !isShuffled
  btnShuffle.classList.toggle('active', isShuffled)
  showToast(isShuffled ? 'Acak: Aktif' : 'Acak: Nonaktif')
}

function toggleRepeat() {
  repeatMode = (repeatMode + 1) % 3
  btnRepeat.classList.toggle('active', repeatMode > 0)
  const icons = ['repeat', 'repeat', 'repeat-1']
  btnRepeat.querySelector('svg')?.setAttribute('data-lucide', icons[repeatMode])
  lucide.createIcons()
  showToast(['Ulangi: Nonaktif', 'Ulangi: Semua', 'Ulangi: Satu'][repeatMode])
}

function toggleMute() {
  audio.muted = !audio.muted
  volumeIcon.setAttribute('data-lucide', audio.muted ? 'volume-x' : 'volume-2')
  lucide.createIcons()
}

function setVolume(v) {
  audio.volume = v / 100
  volumeSlider.value = v
  const icon = v === 0 ? 'volume-x' : v < 50 ? 'volume-1' : 'volume-2'
  volumeIcon.setAttribute('data-lucide', icon)
  lucide.createIcons()
}

function toggleLike() {
  if (!currentTrack) return
  const id = currentTrack.videoId
  if (liked.has(id)) {
    liked.delete(id)
    btnLike.classList.remove('liked')
    showToast('Dihapus dari favorit')
  } else {
    liked.add(id)
    btnLike.classList.add('liked')
    showToast('Ditambahkan ke favorit')
  }
}

function seekTo(e) {
  if (!audio.duration) return
  const rect = progressBar.getBoundingClientRect()
  const ratio = (e.clientX - rect.left) / rect.width
  audio.currentTime = Math.max(0, Math.min(1, ratio)) * audio.duration
}

function onTimeUpdate() {
  if (!audio.duration || isDragging) return
  const ratio = audio.currentTime / audio.duration
  progressFill.style.width  = (ratio * 100) + '%'
  progressThumb.style.left  = (ratio * 100) + '%'
  currentTime.textContent   = fmtTime(audio.currentTime)
  highlightLyric(audio.currentTime)
}

function onMetadata() {
  totalTime.textContent = fmtTime(audio.duration)
}

function onEnded() {
  if (repeatMode === 2) {
    audio.currentTime = 0
    audio.play()
  } else if (repeatMode === 1 || queue.length > 1) {
    playNext()
  } else {
    setPlayIcon(false)
  }
}

// ── Synced lyrics highlight ────────────────────────────────────
function highlightLyric(t) {
  if (!syncedLyrics.length) return
  const lines = lyricsContainer.querySelectorAll('.lyric-line')
  if (!lines.length) return

  let activeIdx = -1
  for (let i = syncedLyrics.length - 1; i >= 0; i--) {
    if (t >= syncedLyrics[i].time) { activeIdx = i; break }
  }

  lines.forEach((el, i) => {
    el.classList.toggle('active', i === activeIdx)
    el.classList.toggle('past',   i < activeIdx)
  })

  // Auto-scroll to active line
  if (activeIdx !== -1) {
    const el = lines[activeIdx]
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }
}

function setupLyricsSync(lyrics) {
  syncedLyrics = []
  if (lyrics?.synced) {
    const lines = lyrics.synced.split('\n').map(line => {
      const m = line.match(/\[(\d+):(\d+\.\d+)\](.*)/)
      if (!m) return null
      return { time: parseFloat(m[1]) * 60 + parseFloat(m[2]), text: m[3].trim() }
    }).filter(Boolean)
    syncedLyrics = lines
  }
}

// ═══════════════════════════════════════════════════════════════
//  UTILITIES
// ═══════════════════════════════════════════════════════════════

function fmtTime(s) {
  if (!s || isNaN(s)) return '0:00'
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  return `${m}:${sec.toString().padStart(2, '0')}`
}

function fmtSec(s) {
  if (!s) return '—'
  return fmtTime(s)
}

function escHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function showLoading(text = 'Memuat...') {
  loadingText.textContent = text
  loadingOverlay.style.display = 'flex'
}

function hideLoading() {
  loadingOverlay.style.display = 'none'
}

let toastTimer = null
function showToast(msg) {
  toastEl.textContent = msg
  toastEl.classList.add('show')
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => toastEl.classList.remove('show'), 2800)
}
