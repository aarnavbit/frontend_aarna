import { useState, useRef, useEffect } from 'react'
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
    poster: '/videos/poster1.webp',
    objectPositionMobile: 'center 35%'
  },
  {
    mp4: '/videos/rVky_opt.mp4',
    mobileMp4: '/videos/rVky_ultra.mp4',
    poster: '/videos/poster2.webp',
    objectPositionMobile: 'center 30%'
  }
]

export function HeroVideoBackground() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const videoRef = useRef(null)
  const isMobile = useIsMobile(768)

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % VIDEOS.length)
  }

  const active = VIDEOS[currentIndex]
  const activeSrc = isMobile && active.mobileMp4 ? active.mobileMp4 : active.mp4

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.load()
      videoRef.current.play().catch((err) => {
        console.warn('Autoplay prevented or video error:', err)
      })
    }
  }, [currentIndex, isMobile])

  return (
    <div className="hero-video-container" aria-hidden="true">
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
        <source src={activeSrc} type="video/mp4" />
      </video>
      <div className="hero-video-overlay" />
    </div>
  )
}
