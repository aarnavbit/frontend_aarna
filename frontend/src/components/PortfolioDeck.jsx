/** Motion-first portfolio explorer that turns the seven teams into an Awwwards-level physical card stack. */

import { motion, useReducedMotion } from 'framer-motion'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { portfolios } from '../data/clubContent'

export function PortfolioDeck() {
  const [activeIndex, setActiveIndex] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)
  const reduceMotion = useReducedMotion()

  const move = useCallback((direction) => {
    if (isAnimating) return
    setIsAnimating(true)
    setActiveIndex((current) => (current + direction + portfolios.length) % portfolios.length)
    setTimeout(() => setIsAnimating(false), 550)
  }, [isAnimating])

  const handleTabClick = useCallback((index) => {
    if (isAnimating || index === activeIndex) return
    setIsAnimating(true)
    setActiveIndex(index)
    setTimeout(() => setIsAnimating(false), 550)
  }, [isAnimating, activeIndex])

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowRight') {
        move(1)
      } else if (e.key === 'ArrowLeft') {
        move(-1)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [move])

  return (
    <div className="portfolio-deck">
      <div className="portfolio-tabs" role="tablist" aria-label="AARNA portfolios">
        {portfolios.map((portfolio, index) => {
          const isActive = index === activeIndex
          return (
            <button
              key={portfolio.name}
              type="button"
              role="tab"
              aria-selected={isActive}
              className={isActive ? 'is-active' : ''}
              onClick={() => handleTabClick(index)}
            >
              {isActive && !reduceMotion && (
                <motion.div
                  className="tab-indicator"
                  layoutId="tabIndicator"
                  transition={{
                    type: 'spring',
                    stiffness: 380,
                    damping: 26,
                    mass: 0.8,
                  }}
                >
                  <motion.div
                    key={activeIndex}
                    initial={{ y: 0, scaleX: 1, scaleY: 1 }}
                    animate={{
                      y: [0, -18, 0],
                      scaleX: [1, 0.88, 1.15, 0.95, 1],
                      scaleY: [1, 1.12, 0.85, 1.05, 1],
                    }}
                    transition={{
                      duration: 0.55,
                      times: [0, 0.4, 0.7, 0.88, 1],
                      ease: 'easeInOut',
                    }}
                    className="tab-indicator-inner"
                  />
                </motion.div>
              )}
              <motion.span
                style={{ position: 'relative', zIndex: 2 }}
                animate={{
                  scale: isActive ? 1.08 : 1,
                  opacity: isActive ? 1 : 0.7,
                }}
                transition={{ duration: 0.2 }}
              >
                0{index + 1}
              </motion.span>
            </button>
          )
        })}
      </div>

      <div className="portfolio-stage">
        <div className="portfolio-stack">
          {portfolios.map((portfolio, index) => {
            const isPast = index < activeIndex
            const isCurrent = index === activeIndex
            const offset = index - activeIndex

            return (
              <motion.article
                key={portfolio.name}
                className={`portfolio-card ${isCurrent ? 'is-active' : ''}`}
                initial={false}
                animate={
                  reduceMotion
                    ? { opacity: isCurrent ? 1 : 0, zIndex: isCurrent ? 10 : 0 }
                    : isPast
                    ? {
                        x: '115%',
                        y: 40,
                        rotate: 3.5,
                        scale: 0.94,
                        opacity: 0,
                        zIndex: 0,
                        pointerEvents: 'none',
                      }
                    : {
                        x: 0,
                        y: offset * 9,
                        rotate: 0,
                        scale: Math.max(0.88, 1 - offset * 0.025),
                        opacity: Math.max(0, 1 - offset * 0.15),
                        zIndex: portfolios.length - offset,
                        pointerEvents: isCurrent ? 'auto' : 'none',
                      }
                }
                transition={
                  reduceMotion
                    ? { duration: 0.2 }
                    : {
                        type: 'spring',
                        stiffness: 260,
                        damping: 26,
                        mass: 0.9,
                      }
                }
              >
                {/* Dynamic Background Rings */}
                <motion.div
                  className="portfolio-background-rings"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 75, repeat: Infinity, ease: 'linear' }}
                >
                  <motion.div
                    className="ring ring-outer"
                    animate={{
                      rotate: activeIndex * 15,
                      scale: isCurrent ? [1, 1.05, 1] : 1,
                    }}
                    transition={{ duration: 0.7, ease: 'easeOut' }}
                  />
                  <motion.div
                    className="ring ring-inner"
                    animate={{
                      rotate: -activeIndex * 20,
                      scale: isCurrent ? [1, 1.08, 1] : 1,
                    }}
                    transition={{ duration: 0.7, ease: 'easeOut' }}
                  />
                </motion.div>

                {/* Card Content with Staggered Motion Blur Reveal */}
                <motion.span
                  className="section-kicker"
                  animate={isCurrent ? { opacity: 1, y: 0 } : { opacity: 0, y: 12 }}
                  transition={{ duration: 0.4, delay: isCurrent ? 0.12 : 0 }}
                >
                  {portfolio.eyebrow}
                </motion.span>

                <motion.h3
                  animate={
                    isCurrent
                      ? { opacity: 1, y: 0, filter: 'blur(0px)' }
                      : { opacity: 0, y: 22, filter: 'blur(8px)' }
                  }
                  transition={{ duration: 0.5, delay: isCurrent ? 0.18 : 0, ease: [0.215, 0.61, 0.355, 1] }}
                >
                  {portfolio.name}
                </motion.h3>

                <motion.p
                  animate={isCurrent ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
                  transition={{ duration: 0.45, delay: isCurrent ? 0.26 : 0 }}
                >
                  {portfolio.description}
                </motion.p>

                <motion.span
                  className="portfolio-number"
                  animate={isCurrent ? { opacity: 1, scale: 1 } : { opacity: 0.4, scale: 0.9 }}
                  transition={{ duration: 0.3, delay: isCurrent ? 0.15 : 0 }}
                >
                  0{index + 1} / 0{portfolios.length}
                </motion.span>
              </motion.article>
            )
          })}
        </div>

        <div className="deck-controls">
          <motion.button
            type="button"
            onClick={() => move(-1)}
            aria-label="Previous portfolio"
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.92 }}
          >
            <motion.span style={{ display: 'flex' }} whileHover={{ x: -2 }} whileTap={{ x: -4 }}>
              <ArrowLeft size={18} />
            </motion.span>
          </motion.button>
          <motion.button
            type="button"
            onClick={() => move(1)}
            aria-label="Next portfolio"
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.92 }}
          >
            <motion.span style={{ display: 'flex' }} whileHover={{ x: 2 }} whileTap={{ x: 4 }}>
              <ArrowRight size={18} />
            </motion.span>
          </motion.button>
        </div>
      </div>
    </div>
  )
}

