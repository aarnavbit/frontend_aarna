/** Motion-first portfolio explorer that turns the seven teams into a focused story. */

import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { useState } from 'react'
import { portfolios } from '../data/clubContent'

export function PortfolioDeck() {
  const [activeIndex, setActiveIndex] = useState(0)
  const reduceMotion = useReducedMotion()
  const activePortfolio = portfolios[activeIndex]

  const move = (direction) => {
    setActiveIndex((current) => (current + direction + portfolios.length) % portfolios.length)
  }

  return (
    <div className="portfolio-deck">
      <div className="portfolio-tabs" role="tablist" aria-label="AARNA portfolios">
        {portfolios.map((portfolio, index) => (
          <button
            key={portfolio.name}
            type="button"
            role="tab"
            aria-selected={index === activeIndex}
            className={index === activeIndex ? 'is-active' : ''}
            onClick={() => setActiveIndex(index)}
          >
            0{index + 1}
          </button>
        ))}
      </div>
      <div className="portfolio-stage">
        <AnimatePresence mode="wait">
          <motion.article
            key={activePortfolio.name}
            className="portfolio-card"
            initial={reduceMotion ? false : { opacity: 0, y: 18, rotate: -1 }}
            animate={{ opacity: 1, y: 0, rotate: 0 }}
            exit={reduceMotion ? undefined : { opacity: 0, y: -12, rotate: 1 }}
            transition={{ duration: 0.32, ease: 'easeOut' }}
          >
            <span className="section-kicker">{activePortfolio.eyebrow}</span>
            <h3>{activePortfolio.name}</h3>
            <p>{activePortfolio.description}</p>
            <span className="portfolio-number">0{activeIndex + 1} / 0{portfolios.length}</span>
          </motion.article>
        </AnimatePresence>
        <div className="deck-controls">
          <button type="button" onClick={() => move(-1)} aria-label="Previous portfolio">
            <ArrowLeft size={18} />
          </button>
          <button type="button" onClick={() => move(1)} aria-label="Next portfolio">
            <ArrowRight size={18} />
          </button>
        </div>
      </div>
    </div>
  )
}
