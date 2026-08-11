import React, { useState, useEffect, useCallback, useRef } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { ChevronLeft, ChevronRight, X, ZoomIn } from 'lucide-react'

// Array of images generated in public/images/previous-work
const TOTAL_IMAGES = 20
const imageList = Array.from({ length: TOTAL_IMAGES }, (_, i) => `/images/previous-work/work_${i + 1}.webp`)

function PreviousWorkComponent() {
  const reduceMotion = useReducedMotion()
  const [selectedIndex, setSelectedIndex] = useState(null)
  const isMounted = typeof document !== 'undefined'
  const containerRef = useRef(null)
  const isPausedRef = useRef(false)
  const isVisibleRef = useRef(true)
  const manualTimeoutRef = useRef(null)
  const metricsRef = useRef({ loopWidth: 0, cardWidth: 380 })

  const reveal = reduceMotion
    ? {}
    : { initial: { opacity: 0, y: 18 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true } }

  const updateMetrics = useCallback(() => {
    const container = containerRef.current
    if (!container) return
    const track = container.querySelector('.marquee-track')
    if (!track || track.children.length <= TOTAL_IMAGES) {
      metricsRef.current = { loopWidth: container.scrollWidth / 2, cardWidth: 380 }
      return
    }
    const loopWidth = track.children[TOTAL_IMAGES].offsetLeft - track.children[0].offsetLeft
    const cardWidth = track.children[1] ? track.children[1].offsetLeft - track.children[0].offsetLeft : 380
    metricsRef.current = { loopWidth, cardWidth }
  }, [])

  useEffect(() => {
    updateMetrics()

    let resizeTimer
    const handleResize = () => {
      clearTimeout(resizeTimer)
      resizeTimer = setTimeout(updateMetrics, 150)
    }

    window.addEventListener('resize', handleResize)
    return () => {
      clearTimeout(resizeTimer)
      window.removeEventListener('resize', handleResize)
    }
  }, [updateMetrics])

  // IntersectionObserver to pause requestAnimationFrame when marquee is not in viewport
  useEffect(() => {
    const container = containerRef.current
    if (!container || typeof IntersectionObserver === 'undefined') return

    const observer = new IntersectionObserver(
      ([entry]) => {
        isVisibleRef.current = entry.isIntersecting
      },
      { threshold: 0.05 }
    )

    observer.observe(container)
    return () => observer.disconnect()
  }, [])

  // Auto-scroll loop using requestAnimationFrame (only active when visible)
  useEffect(() => {
    const container = containerRef.current
    if (!container || reduceMotion) return

    let animId

    const autoScroll = () => {
      if (container && !isPausedRef.current && isVisibleRef.current) {
        container.scrollLeft += 0.8
        const { loopWidth } = metricsRef.current
        if (loopWidth > 0 && container.scrollLeft >= loopWidth) {
          container.scrollLeft -= loopWidth
        }
      }
      animId = requestAnimationFrame(autoScroll)
    }

    animId = requestAnimationFrame(autoScroll)

    const pauseScroll = () => {
      isPausedRef.current = true
    }
    const resumeScroll = () => {
      isPausedRef.current = false
    }

    container.addEventListener('mouseenter', pauseScroll)
    container.addEventListener('mouseleave', resumeScroll)
    container.addEventListener('mousemove', pauseScroll)
    container.addEventListener('pointerover', pauseScroll)
    container.addEventListener('pointerdown', pauseScroll)
    container.addEventListener('touchstart', pauseScroll, { passive: true })
    container.addEventListener('touchend', resumeScroll, { passive: true })

    return () => {
      cancelAnimationFrame(animId)
      if (container) {
        container.removeEventListener('mouseenter', pauseScroll)
        container.removeEventListener('mouseleave', resumeScroll)
        container.removeEventListener('mousemove', pauseScroll)
        container.removeEventListener('pointerover', pauseScroll)
        container.removeEventListener('pointerdown', pauseScroll)
        container.removeEventListener('touchstart', pauseScroll)
        container.removeEventListener('touchend', resumeScroll)
      }
    }
  }, [reduceMotion])

  // Open Lightbox preview
  const handleCardClick = (index, e) => {
    if (e) e.stopPropagation()
    isPausedRef.current = true
    setSelectedIndex(index % TOTAL_IMAGES)
  }

  // Close Lightbox preview
  const handleClose = (e) => {
    if (e) e.stopPropagation()
    setSelectedIndex(null)
    isPausedRef.current = false
  }

  // Next / Prev Lightbox image
  const handlePrev = useCallback((e) => {
    if (e) e.stopPropagation()
    setSelectedIndex((prev) => (prev === null || prev === 0 ? TOTAL_IMAGES - 1 : prev - 1))
  }, [])

  const handleNext = useCallback((e) => {
    if (e) e.stopPropagation()
    setSelectedIndex((prev) => (prev === null || prev === TOTAL_IMAGES - 1 ? 0 : prev + 1))
  }, [])

  // Keyboard controls for Lightbox
  useEffect(() => {
    if (selectedIndex === null) return

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') handleClose(e)
      if (e.key === 'ArrowLeft') handlePrev(e)
      if (e.key === 'ArrowRight') handleNext(e)
    }

    window.addEventListener('keydown', handleKeyDown)
    document.body.style.overflow = 'hidden'

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [selectedIndex, handlePrev, handleNext])

  // Seamless Manual scroll Left / Right
  const handleManualScroll = (direction, e) => {
    if (e) e.stopPropagation()
    const container = containerRef.current
    if (!container) return

    isPausedRef.current = true
    if (manualTimeoutRef.current) clearTimeout(manualTimeoutRef.current)

    const { loopWidth, cardWidth } = metricsRef.current
    const halfWidth = loopWidth || (container.scrollWidth / 2)
    const scrollDistance = cardWidth || 380

    if (direction === 'left') {
      if (container.scrollLeft < scrollDistance) {
        container.scrollLeft += halfWidth
      }
      container.scrollBy({ left: -scrollDistance, behavior: 'smooth' })
    } else {
      if (container.scrollLeft >= halfWidth) {
        container.scrollLeft -= halfWidth
      }
      container.scrollBy({ left: scrollDistance, behavior: 'smooth' })
    }

    manualTimeoutRef.current = setTimeout(() => {
      isPausedRef.current = false
    }, 750)
  }

  // Duplicate list to support continuous infinite loop
  const marqueeItems = [...imageList, ...imageList]

  return (
    <section className="previous-work-section section-wrap" id="previous-work">
      <motion.div {...reveal} className="previous-work-header">
        <div className="section-heading">
          <span className="section-kicker">Proof of Craft</span>
          <h2>Previous Work & Highlights</h2>
          <p>A glimpse into the projects, events, and creative moments brought to life by AARNA.</p>
        </div>

        {/* Manual Left/Right Navigation Buttons */}
        <div className="marquee-nav-buttons">
          <button
            type="button"
            className="marquee-nav-btn"
            onClick={(e) => handleManualScroll('left', e)}
            aria-label="Scroll left"
            title="Scroll left"
          >
            <ChevronLeft size={22} />
          </button>
          <button
            type="button"
            className="marquee-nav-btn"
            onClick={(e) => handleManualScroll('right', e)}
            aria-label="Scroll right"
            title="Scroll right"
          >
            <ChevronRight size={22} />
          </button>
        </div>
      </motion.div>

      {/* Marquee Scroll Container */}
      <div
        className="marquee-container"
        ref={containerRef}
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
                onPointerDown={() => {
                  isPausedRef.current = true
                }}
                onClick={(e) => handleCardClick(actualIndex, e)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    handleCardClick(actualIndex, e)
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
                      <ZoomIn size={20} /> Click to Preview
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Portal Lightbox Modal directly to document.body */}
      {isMounted &&
        createPortal(
          <AnimatePresence>
            {selectedIndex !== null && (
              <motion.div
                key="lightbox-modal-backdrop"
                className="lightbox-overlay"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={handleClose}
              >
                <motion.div
                  key="lightbox-modal-box"
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

                  {/* Previous Image Button */}
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

                  {/* Next Image Button */}
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
          </AnimatePresence>,
          document.body
        )}
    </section>
  )
}

export const PreviousWork = React.memo(PreviousWorkComponent)

