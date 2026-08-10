import { useState, useRef, useEffect } from 'react'

const VIDEOS = [
  {
    mp4: '/videos/vbithyd_opt.mp4',
    poster: '/videos/vbithyd_poster.webp'
  },
  {
    mp4: '/videos/H9fk_master.mp4',
    poster: '/videos/poster1.webp'
  },
  {
    mp4: '/videos/rVky_master.mp4',
    poster: '/videos/poster2.webp'
  }
]

export function HeroVideoBackground() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const videoRef = useRef(null)

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % VIDEOS.length)
  }

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.load()
      videoRef.current.play().catch((err) => {
        console.warn('Autoplay prevented or video error:', err)
      })
    }
  }, [currentIndex])

  const active = VIDEOS[currentIndex]

  return (
    <div className="hero-video-container" aria-hidden="true">
      <video
        ref={videoRef}
        poster={active.poster}
        className="hero-video"
        autoPlay
        muted
        playsInline
        preload="metadata"
        onEnded={handleNext}
      >
        <source src={active.mp4} type="video/mp4" />
      </video>
      <div className="hero-video-overlay" />
    </div>
  )
}
