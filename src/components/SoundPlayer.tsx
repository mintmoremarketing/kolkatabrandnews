'use client'
import { useEffect, useRef, useState } from 'react'
import type { Track } from '@/lib/types'

export function SoundPlayer({ tracks, requested }: { tracks: Track[]; requested: boolean }) {
  const audio = useRef<HTMLAudioElement>(null)
  const root = useRef<HTMLDivElement>(null)
  const [index, setIndex] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [error, setError] = useState('')
  const track = tracks[index]
  const play = () => {
    setError('')
    audio.current?.play().then(() => setPlaying(true)).catch(() => { setPlaying(false); setError('Press play to listen') })
  }
  useEffect(() => { if (requested) play() }, [requested])
  useEffect(() => { if (playing) play() }, [index])
  useEffect(() => {
    const close = (event: PointerEvent) => { if (!root.current?.contains(event.target as Node)) setExpanded(false) }
    const key = (event: KeyboardEvent) => { if (event.key === 'Escape') setExpanded(false) }
    document.addEventListener('pointerdown', close); document.addEventListener('keydown', key)
    return () => { document.removeEventListener('pointerdown', close); document.removeEventListener('keydown', key) }
  }, [])
  if (!track) return null
  const toggle = () => { if (playing) { audio.current?.pause(); setPlaying(false) } else play() }
  return <div className="sound-player" ref={root}>
    <audio ref={audio} src={track.src} preload="none" onEnded={() => { setIndex((index + 1) % tracks.length); setPlaying(true) }} onError={() => { setPlaying(false); setError('Track unavailable') }} />
    <div className="sound-controls">
      <button className="sound-toggle" onClick={toggle} aria-label={`${playing ? 'Pause' : 'Play'} ${track.artist} — ${track.title}`}>
        <span className={`sound-cover ${playing ? 'is-playing' : ''}`}>
          {track.artwork && <img src={track.artwork} alt="" />}
          <span className="equalizer"><i /><i /><i /></span>
        </span>
      </button>
      <button className="sound-title" aria-expanded={expanded} aria-controls="playlist" onClick={() => setExpanded(!expanded)}>
        <span className={playing ? 'marquee' : ''}>{track.artist} - {track.title} / {track.artist} - {track.title}</span>
      </button>
    </div>
    {expanded && <div id="playlist" className="playlist"><span className="label playlist-heading">STUDIO ROTATION ({String(tracks.length).padStart(2,'0')})</span>
      {tracks.map((t, i) => <button key={`${t.title}-${i}`} className={i === index ? 'selected' : ''} onClick={() => { if (index === i) toggle(); else { setIndex(i); setPlaying(true) } }}>
        {t.artwork && <img src={t.artwork} alt="" />}<span>{t.title}<small>{t.artist}</small></span><span className="track-icon">{i === index && playing ? 'Ⅱ' : '↗'}</span>
      </button>)}
      {error && <p className="label sound-error" role="status">{error}</p>}
    </div>}
  </div>
}
