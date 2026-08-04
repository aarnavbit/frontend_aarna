import { useState, useRef, useEffect } from 'react'

const VIDEOS = [
  '/videos/H9fkFctW301jHJzB59bGofFpn0.mp4',
  '/videos/rVkyfXDsqZkXstqpf2snha897eY.mp4'
]

export function HeroVideoBackground() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const videoRef = useRef(null)

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % VIDEOS.length)
  }

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.play().catch((err) => {
        console.warn('Autoplay prevented or video playback error:', err)
      })
    }
  }, [currentIndex])

  return (
    <div className="hero-video-container" aria-hidden="true">
      <video
        ref={videoRef}
        src={VIDEOS[currentIndex]}
        className="hero-video"
        autoPlay
        muted
        playsInline
        onEnded={handleNext}
      />
      <div className="hero-video-overlay" />
    </div>
  )
}
