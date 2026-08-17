import { useState, useRef, useEffect, memo } from 'react'
import { useIsMobile } from '../hooks/useIsMobile'

const VIDEOS = [
  {
    mp4: '/videos/vbithyd_opt.mp4',
    mobileMp4: '/videos/vbithyd_ultra.mp4',
    poster: '/videos/vbithyd_poster.webp',
    objectPositionMobile: 'center 25%'
  },
  {
    mp4: '/videos/H9fk_opt.mp4',
    mobileMp4: '/videos/H9fk_ultra.mp4',
    mobileWebm: '/videos/H9fk_ultra.webm',
    webm: '/videos/H9fk_hd.webm',
    poster: '/videos/poster1.webp',
    objectPositionMobile: 'center 35%'
  },
  {
    mp4: '/videos/rVky_opt.mp4',
    mobileMp4: '/videos/rVky_ultra.mp4',
    mobileWebm: '/videos/rVky_ultra.webm',
    webm: '/videos/rVky_hd.webm',
    poster: '/videos/poster2.webp',
    objectPositionMobile: 'center 30%'
  }
]

function HeroVideoBackgroundComponent() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const videoRef = useRef(null)
  const containerRef = useRef(null)
  const isVisibleRef = useRef(true)
  const isMobile = useIsMobile(768)

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % VIDEOS.length)
  }

  const active = VIDEOS[currentIndex]
  const activeSrc = isMobile && active.mobileMp4 ? active.mobileMp4 : active.mp4
  const activeWebmSrc = isMobile && active.mobileWebm ? active.mobileWebm : active.webm

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    if (isVisibleRef.current) {
      video.load()
      video.play().catch((err) => {
        console.warn('Autoplay prevented or video error:', err)
      })
    }
  }, [currentIndex, isMobile])

  // Pause playback when hero video is scrolled out of viewport, resume when visible
  useEffect(() => {
    const container = containerRef.current
    if (!container || typeof IntersectionObserver === 'undefined') return

    const observer = new IntersectionObserver(
      ([entry]) => {
        isVisibleRef.current = entry.isIntersecting
        const video = videoRef.current
        if (!video) return
        if (entry.isIntersecting) {
          video.play().catch(() => {})
        } else {
          video.pause()
        }
      },
      { threshold: 0.1 }
    )

    observer.observe(container)
    return () => observer.disconnect()
  }, [])

  return (
    <div ref={containerRef} className="hero-video-container" aria-hidden="true">
      <video
        ref={videoRef}
        key={activeSrc}
        poster={active.poster}
        className="hero-video"
        style={{
          objectPosition: isMobile && active.objectPositionMobile ? active.objectPositionMobile : 'center center'
        }}
        autoPlay
        muted
        playsInline
        preload="metadata"
        onEnded={handleNext}
      >
        {activeWebmSrc && <source src={activeWebmSrc} type="video/webm" />}
        <source src={activeSrc} type="video/mp4" />
      </video>
      <div className="hero-video-overlay" />
    </div>
  )
}

export const HeroVideoBackground = memo(HeroVideoBackgroundComponent)

