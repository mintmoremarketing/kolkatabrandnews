'use client'
import { useArchive } from './ArchiveContext'
import { Footer } from './Footer'

export function AboutView() {
  const { settings } = useArchive()
  return (
    <div className="about-view">

      {/* ── Hero ── */}
      <div className="about-hero">
        <div className="about-hero-left">
          <h1 className="about-title">
            <span>KOLKATA</span>
            <span>BRAND</span>
            <span>NEWS</span>
          </h1>
        </div>
        <div className="about-hero-right">
          <div className="about-hero-coords label">
            <span>22°34′N 88°22′E</span>
            <span>EST. {settings.year}</span>
          </div>
          <img src="/kbn-logo.webp" alt="Kolkata Brand News" className="about-hero-badge" />
          <p className="about-hero-desc">{settings.aboutIntro}</p>
          <span className="about-scroll label">↓ SCROLL</span>
        </div>
      </div>

      {/* ── By Mintmore ── */}
      <div className="about-byline">
        <span className="about-byline-pre">by</span>
        <a href="https://mintmoremarketing.com/" target="_blank" rel="noreferrer" className="about-byline-brand">
          <img src="/mintmore-logo.webp" alt="Mintmore Marketing" className="about-byline-logo" />
          <span className="about-byline-name">Mintmore Marketing</span>
        </a>
      </div>

      {/* ── Site credits ── */}
      <div className="about-credits">
        <span>Site by</span>
        <a href="https://www.devdeepsaha.in/" target="_blank" rel="noreferrer">Devdeep Saha</a>
      </div>

      <Footer />
    </div>
  )
}
