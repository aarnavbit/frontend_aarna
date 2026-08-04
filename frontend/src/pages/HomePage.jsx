/** Editorial home page presenting AARNA's purpose before inviting an OC application. */

import { motion, useReducedMotion } from 'framer-motion'
import { ArrowRight, Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'
import { PortfolioDeck } from '../components/PortfolioDeck'
import { objectives } from '../data/clubContent'
import { PageFlipSection } from '../components/PageFlipSection'
import { HeroVideoBackground } from '../components/HeroVideoBackground'

export function HomePage() {
  const reduceMotion = useReducedMotion()
  const reveal = reduceMotion ? {} : { initial: { opacity: 0, y: 18 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true } }

  return (
    <div className="home-page-container">
      <PageFlipSection zIndex={10}>
        <section className="hero-section section-wrap">
          <HeroVideoBackground />
          <motion.div
            className="hero-copy"
            initial={reduceMotion ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: 'easeOut' }}
          >
            <span className="announcement"><Sparkles size={15} /> OC Recruitment 2026 · Now open</span>
            <p className="hero-eyebrow">A place for student ambition</p>
            <h1>Make your <em>passion</em> your next opportunity.</h1>
            <p className="hero-intro">
              AARNA is a student freelancing club for people ready to sharpen their craft,
              find their voice, and turn meaningful work into momentum.
            </p>
            <div className="hero-actions">
              <Link className="button button-primary" to="/apply">Apply for OC <ArrowRight size={18} /></Link>
              <a className="button button-quiet" href="#portfolios">Explore teams</a>
            </div>
          </motion.div>
          <motion.div
            className="hero-orbit"
            aria-hidden="true"
            initial={reduceMotion ? false : { opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.15, duration: 0.65 }}
          >
            <span>CREATE</span>
            <span>CONNECT</span>
            <span>GROW</span>
            <strong>A</strong>
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
            We believe earning is a mindset: every talent can grow into an opportunity, and
            every dream deserves the room to flourish. Whether you code, write, design, market,
            organise, or are still finding your strength, AARNA helps you develop it alongside
            your studies.
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

      <PageFlipSection zIndex={5} isLast={true}>
        <div style={{ paddingBottom: '1px' }}>
          <section className="cta-section section-wrap">
            <div>
              <span className="section-kicker">Your next chapter</span>
              <h2>Bring your energy. We’ll make space for it.</h2>
            </div>
            <Link className="button button-primary" to="/apply">Start your application <ArrowRight size={18} /></Link>
          </section>
          <p className="coordinator-note">Faculty Coordinator · K. Keerthana, Assistant Professor · CSBS</p>
        </div>
      </PageFlipSection>
    </div>
  )
}
