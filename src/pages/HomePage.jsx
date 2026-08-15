import { useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { ArrowRight, ChevronDown, ChevronUp } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { PortfolioDeck } from '../components/PortfolioDeck'
import { objectives } from '../data/clubContent'
import { PageFlipSection } from '../components/PageFlipSection'
import { HeroVideoBackground } from '../components/HeroVideoBackground'
import { useIsMobile } from '../hooks/useIsMobile'
import { PreviousWork } from '../components/PreviousWork'

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
  const navigate = useNavigate()
  const reduceMotion = useReducedMotion()
  const reveal = reduceMotion ? {} : { initial: { opacity: 0, y: 18 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true } }

  return (
    <div className="home-page-container">
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
            onClick={() => navigate('/apply')}
            style={{ cursor: 'pointer' }}
          >
            <div>
              <span className="section-kicker">Your next chapter</span>
              <h2>Bring your energy. We’ll make space for it.</h2>
            </div>
            <Link
              className="button button-primary"
              to="/apply"
              onClick={(e) => {
                e.stopPropagation()
              }}
            >
              Start your application <ArrowRight size={18} />
            </Link>
          </section>
          <p className="coordinator-note">Faculty Coordinator · K. Keerthana, Assistant Professor · CSBS</p>
        </div>
      </PageFlipSection>
    </div>
  )
}
