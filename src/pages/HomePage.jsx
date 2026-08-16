import { useState, useEffect } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { ArrowRight, ChevronDown, ChevronUp, Instagram, X } from 'lucide-react'
import { Link } from 'react-router-dom'
import { PortfolioDeck } from '../components/PortfolioDeck'
import { objectives } from '../data/clubContent'
import { PageFlipSection } from '../components/PageFlipSection'
import { HeroVideoBackground } from '../components/HeroVideoBackground'
import { useIsMobile } from '../hooks/useIsMobile'
import { PreviousWork } from '../components/PreviousWork'

// ============================================================
// GLOBAL SOCIAL PAGES LINK CONFIGURATION
// Paste your social page link (e.g. Instagram, LinkedIn, Linktree) below.
// If empty (''), clicking will default to '#' or perform no navigation.
// ============================================================
const SOCIAL_PAGES_URL = 'https://www.instagram.com/aarna.vbit/'

function ExpandableText({ children, maxLength = 120 }) {
  const isMobile = useIsMobile(768)
  const [expanded, setExpanded] = useState(false)

  if (!isMobile || typeof children !== 'string' || children.length <= maxLength) {
    return <>{children}</>
  }

  const displayText = expanded ? children : children.slice(0, maxLength) + '...'

  return (
    <span>
      {displayText}{' '}
      <button
        type="button"
        className="read-more-toggle"
        onClick={() => setExpanded(!expanded)}
      >
        {expanded ? <>Less <ChevronUp size={14} /></> : <>Read more <ChevronDown size={14} /></>}
      </button>
    </span>
  )
}

export function HomePage() {
  const reduceMotion = useReducedMotion()
  const [showNotice, setShowNotice] = useState(true)
  const reveal = reduceMotion ? {} : { initial: { opacity: 0, y: 18 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true } }

  // Prevent background scroll and dismiss on Escape key when notice modal is visible
  useEffect(() => {
    if (!showNotice) return
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setShowNotice(false)
    }
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = prevOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [showNotice])

  const handleExplorePreviousWork = () => {
    setShowNotice(false)
    const el = document.getElementById('events')
    if (el) {
      setTimeout(() => el.scrollIntoView({ behavior: 'smooth' }), 100)
    }
  }

  return (
    <div className="home-page-container">
      {/* Registration Closed Notice Modal */}
      <AnimatePresence>
        {showNotice && (
          <motion.div
            className="notice-modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowNotice(false)}
          >
            <motion.div
              className="notice-modal-card"
              initial={reduceMotion ? false : { opacity: 0, scale: 0.92, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 280 }}
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-labelledby="notice-title"
            >
              <button
                type="button"
                className="notice-close-btn"
                onClick={() => setShowNotice(false)}
                aria-label="Close notice"
              >
                <X size={18} />
              </button>

              <div className="notice-badge">
                <span className="notice-badge-dot"></span>
                <span>REGISTRATIONS CLOSED</span>
              </div>

              <h2 id="notice-title" className="notice-title">
                OC Recruitment 2026 Registrations are Done!
              </h2>

              <p className="notice-description">
                Thank you for the tremendous response! Registrations for AARNA OC 2026 are officially closed.
                Explore the projects and moments from our previous events, or view task submission updates if you applied.
              </p>

              <div className="notice-actions">
                <button
                  type="button"
                  className="button button-primary notice-primary-btn"
                  onClick={handleExplorePreviousWork}
                >
                  Explore previous work <ArrowRight size={17} />
                </button>

                <Link
                  to="/apply"
                  className="button button-quiet notice-secondary-btn"
                  onClick={() => setShowNotice(false)}
                >
                  View updates
                </Link>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <PageFlipSection zIndex={10}>
        <section className="hero-section">
          <HeroVideoBackground />
          <motion.div
            className="hero-logo-display"
            initial={reduceMotion ? false : { opacity: 0, scale: 0.92, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
          >
            <img
              src="/aarna_brand.png"
              alt="AARNA - Freelancing Club"
              className="hero-brand-logo-img"
            />
            <p className="hero-tagline">Turning Passions into Profits</p>
            <div className="hero-actions">
              <Link className="button button-primary" to="/apply">
                New Updates <ArrowRight size={18} />
              </Link>
              <a
                className="button button-quiet"
                href="#events"
                onClick={(e) => {
                  const el = document.getElementById('events')
                  if (el) {
                    e.preventDefault()
                    el.scrollIntoView({ behavior: 'smooth' })
                  }
                }}
              >
                Events
              </a>
              <a
                className="button button-quiet hero-socials-btn"
                href={SOCIAL_PAGES_URL || 'https://www.instagram.com/aarna.vbit/'}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Instagram size={18} />
                Our Socials
              </a>
            </div>
          </motion.div>
        </section>
      </PageFlipSection>

      <PageFlipSection zIndex={9}>
        <section className="story-section section-wrap" id="about">
          <motion.div {...reveal} className="story-intro">
            <span className="section-kicker">What is AARNA?</span>
            <h2>A dynamic platform for skills, stories, and self-made possibilities.</h2>
          </motion.div>
          <motion.p {...reveal} className="story-copy">
            <ExpandableText maxLength={140}>
              We believe earning is a mindset: every talent can grow into an opportunity, and
              every dream deserves the room to flourish. Whether you code, write, design, market,
              organise, or are still finding your strength, AARNA helps you develop it alongside
              your studies.
            </ExpandableText>
          </motion.p>
        </section>
      </PageFlipSection>

      <PageFlipSection zIndex={8}>
        <section className="belief-section">
          <div className="section-wrap belief-grid">
            <motion.article {...reveal} className="belief-card">
              <span className="section-kicker">Mission</span>
              <p>Empower students to turn skills and passions into thriving professional opportunities.</p>
            </motion.article>
            <motion.article {...reveal} className="belief-card belief-card-accent">
              <span className="section-kicker">Vision</span>
              <p>Build a generous ecosystem where innovation, freelancing, creativity, and ambition flourish.</p>
            </motion.article>
          </div>
        </section>
      </PageFlipSection>

      <PageFlipSection zIndex={7}>
        <section className="portfolio-section section-wrap" id="portfolios">
          <motion.div {...reveal} className="section-heading">
            <span className="section-kicker">Find your room</span>
            <h2>Seven teams. One bold collective.</h2>
            <p>Choose the work that makes you curious, then bring your point of view.</p>
          </motion.div>
          <PortfolioDeck />
        </section>
      </PageFlipSection>

      <PageFlipSection zIndex={6}>
        <section className="objective-section section-wrap">
          <motion.div {...reveal} className="objective-aside">
            <span className="section-kicker">Why join?</span>
            <h2>Build more than a college memory.</h2>
            <p>Work with collaborators, real-world clients, and ideas worth carrying forward.</p>
          </motion.div>
          <ul className="objective-list">
            {objectives.map((objective, index) => (
              <motion.li {...reveal} key={objective}>
                <span>0{index + 1}</span>
                {objective}
              </motion.li>
            ))}
          </ul>
        </section>
      </PageFlipSection>

      <PageFlipSection zIndex={5}>
        <PreviousWork />
      </PageFlipSection>

      <PageFlipSection zIndex={4} isLast={true}>
        <div style={{ paddingBottom: '1px' }}>
          <section
            className="cta-section section-wrap"
            onClick={() => {
              if (SOCIAL_PAGES_URL && SOCIAL_PAGES_URL.trim() && SOCIAL_PAGES_URL !== '#') {
                window.open(SOCIAL_PAGES_URL, '_blank', 'noopener,noreferrer')
              }
            }}
            style={{ cursor: 'pointer' }}
          >
            <div>
              <span className="section-kicker">Stay connected</span>
              <h2>Follow our journey. Be part of the community.</h2>
            </div>
            <a
              className="button button-primary"
              href={SOCIAL_PAGES_URL || '#'}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => {
                e.stopPropagation()
                if (!SOCIAL_PAGES_URL || !SOCIAL_PAGES_URL.trim() || SOCIAL_PAGES_URL === '#') {
                  e.preventDefault()
                }
              }}
            >
              Explore our social pages <ArrowRight size={18} />
            </a>
          </section>
          <p className="coordinator-note">Faculty Coordinator · K. Keerthana, Assistant Professor · CSBS</p>
        </div>
      </PageFlipSection>
    </div>
  )
}
