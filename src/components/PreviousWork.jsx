import React from 'react'
import { motion, useReducedMotion } from 'framer-motion'

// Array of images generated in public/images/previous-work
const TOTAL_IMAGES = 20
const imageList = Array.from({ length: TOTAL_IMAGES }, (_, i) => `/images/previous-work/work_${i + 1}.webp`)

export function PreviousWork() {
  const reduceMotion = useReducedMotion()
  const reveal = reduceMotion
    ? {}
    : { initial: { opacity: 0, y: 18 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true } }

  // Duplicate the list to ensure seamless infinite looping marquee
  const marqueeItems = [...imageList, ...imageList]

  return (
    <section className="previous-work-section section-wrap" id="previous-work">
      <motion.div {...reveal} className="section-heading">
        <span className="section-kicker">Proof of Craft</span>
        <h2>Previous Work & Highlights</h2>
        <p>A glimpse into the projects, events, and creative moments brought to life by AARNA.</p>
      </motion.div>

      <div className="marquee-container" aria-label="Previous work gallery marquee" tabIndex={0}>
        <div className="marquee-track">
          {marqueeItems.map((src, index) => (
            <div className="marquee-card" key={`${src}-${index}`}>
              <div className="marquee-img-wrapper">
                <img
                  className="marquee-img"
                  src={src}
                  alt={`Previous Work sample ${(index % TOTAL_IMAGES) + 1}`}
                  loading="lazy"
                  onError={(e) => {
                    // Hide parent card if image doesn't exist
                    const card = e.currentTarget.closest('.marquee-card')
                    if (card) card.style.display = 'none'
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
