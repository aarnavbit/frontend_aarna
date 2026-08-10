import React, { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { ChevronLeft, ChevronRight, X, ZoomIn } from 'lucide-react'

// Array of images generated in public/images/previous-work
const TOTAL_IMAGES = 20
const imageList = Array.from({ length: TOTAL_IMAGES }, (_, i) => `/images/previous-work/work_${i + 1}.webp`)

export function PreviousWork() {
  const reduceMotion = useReducedMotion()
  const [selectedIndex, setSelectedIndex] = useState(null)
  const marqueeContainerRef = useRef(null)

  const reveal = reduceMotion
    ? {}
    : { initial: { opacity: 0, y: 18 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true } }

  // Open preview modal
  const handleCardClick = (index) => {
    setSelectedIndex(index % TOTAL_IMAGES)
  }

  // Close preview modal
  const handleClose = () => {
    setSelectedIndex(null)
  }

  // Navigate lightbox images
  const handlePrev = useCallback(() => {
    setSelectedIndex((prev) => (prev === 0 ? TOTAL_IMAGES - 1 : prev - 1))
  }, [])

  const handleNext = useCallback(() => {
    setSelectedIndex((prev) => (prev === TOTAL_IMAGES - 1 ? 0 : prev + 1))
  }, [])

  // Keyboard navigation for Lightbox
  useEffect(() => {
    if (selectedIndex === null) return

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') handleClose()
      if (e.key === 'ArrowLeft') handlePrev()
      if (e.key === 'ArrowRight') handleNext()
    }

    window.addEventListener('keydown', handleKeyDown)
    // Prevent background scrolling when modal is open
    document.body.style.overflow = 'hidden'

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [selectedIndex, handlePrev, handleNext])

  // Manual scroll controls for the marquee container
  const scrollMarquee = (direction) => {
    if (!marqueeContainerRef.current) return
    const scrollAmount = 400
    marqueeContainerRef.current.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    })
  }

  // Duplicate image list for seamless infinite looping
  const marqueeItems = [...imageList, ...imageList]

  return (
    <section className="previous-work-section section-wrap" id="previous-work">
      <motion.div {...reveal} className="previous-work-header">
        <div className="section-heading">
          <span className="section-kicker">Proof of Craft</span>
          <h2>Previous Work & Highlights</h2>
          <p>A glimpse into the projects, events, and creative moments brought to life by AARNA.</p>
        </div>

        {/* Manual Left/Right Navigation Controls */}
        <div className="marquee-nav-buttons">
          <button
            type="button"
            className="marquee-nav-btn"
            onClick={() => scrollMarquee('left')}
            aria-label="Scroll left"
            title="Scroll left"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            type="button"
            className="marquee-nav-btn"
            onClick={() => scrollMarquee('right')}
            aria-label="Scroll right"
            title="Scroll right"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </motion.div>

      {/* Marquee Container */}
      <div
        className="marquee-container"
        ref={marqueeContainerRef}
        aria-label="Previous work gallery marquee"
        tabIndex={0}
      >
        <div className="marquee-track">
          {marqueeItems.map((src, index) => {
            const actualIndex = index % TOTAL_IMAGES
            return (
              <div
                className="marquee-card"
                key={`${src}-${index}`}
                onClick={() => handleCardClick(actualIndex)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    handleCardClick(actualIndex)
                  }
                }}
              >
                <div className="marquee-img-wrapper">
                  <img
                    className="marquee-img"
                    src={src}
                    alt={`Previous Work sample ${actualIndex + 1}`}
                    loading="lazy"
                    onError={(e) => {
                      const card = e.currentTarget.closest('.marquee-card')
                      if (card) card.style.display = 'none'
                    }}
                  />
                  <div className="marquee-card-hover-overlay">
                    <span className="zoom-hint">
                      <ZoomIn size={22} /> Click to Preview
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Lightbox / Preview Modal */}
      <AnimatePresence>
        {selectedIndex !== null && (
          <motion.div
            className="lightbox-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
          >
            <motion.div
              className="lightbox-content"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              <button
                type="button"
                className="lightbox-close-btn"
                onClick={handleClose}
                aria-label="Close preview"
              >
                <X size={24} />
              </button>

              {/* Prev Button */}
              <button
                type="button"
                className="lightbox-arrow lightbox-arrow-left"
                onClick={handlePrev}
                aria-label="Previous image"
              >
                <ChevronLeft size={28} />
              </button>

              {/* Preview Image */}
              <div className="lightbox-image-wrapper">
                <img
                  src={imageList[selectedIndex]}
                  alt={`Previous Work Preview ${selectedIndex + 1}`}
                  className="lightbox-image"
                />
              </div>

              {/* Next Button */}
              <button
                type="button"
                className="lightbox-arrow lightbox-arrow-right"
                onClick={handleNext}
                aria-label="Next image"
              >
                <ChevronRight size={28} />
              </button>

              {/* Image Counter */}
              <div className="lightbox-caption">
                <span>
                  {selectedIndex + 1} / {TOTAL_IMAGES}
                </span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  )
}
