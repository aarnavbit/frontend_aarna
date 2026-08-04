/** Motion-first portfolio explorer that turns the seven teams into an Awwwards-level physical card stack. */

import { motion, useReducedMotion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { portfolios } from '../data/clubContent'

// Dummy members for placeholder
const dummyMembers = Array(8).fill(null).map((_, i) => ({
  id: i,
  name: `NAME ${i + 1}`,
  role: 'ROLE',
  position: 'POSITION',
  about: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.',
  skills: ['Frontend', 'Backend', 'UI/UX', 'Cloud', 'DevOps', 'AI'],
  experience: [
    { title: 'Senior Role Placeholder', date: '2024 - Present', company: 'Organization Name', description: 'Placeholder experience details highlighting past projects and achievements.' },
    { title: 'Previous Role Placeholder', date: '2023 - 2024', company: 'Organization Name', description: 'Brief description of previous responsibilities.' }
  ],
  projects: [
    { title: 'Project Alpha', description: 'A seamless platform for managing university events.', tags: ['React', 'Node.js'] },
    { title: 'Design System', description: 'Comprehensive UI kit and component library.', tags: ['Figma', 'CSS'] },
    { title: 'Web Scraper', description: 'Automated data extraction tool for research.', tags: ['Python', 'Data'] }
  ],
  contact: 'Placeholder contact info (e.g., LinkedIn, GitHub, Email).'
}))

export function PortfolioDeck() {
  const [activeIndex, setActiveIndex] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)
  const [expandedPortfolio, setExpandedPortfolio] = useState(null)
  const [activeMemberIndex, setActiveMemberIndex] = useState(0)
  const [isHovered, setIsHovered] = useState(false)
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
      if (expandedPortfolio) {
        if (e.key === 'Escape') setExpandedPortfolio(null)
        if (e.key === 'ArrowRight') setActiveMemberIndex(curr => (curr + 1) % dummyMembers.length)
        if (e.key === 'ArrowLeft') setActiveMemberIndex(curr => (curr - 1 + dummyMembers.length) % dummyMembers.length)
        return
      }
      if (e.key === 'ArrowRight') {
        move(1)
      } else if (e.key === 'ArrowLeft') {
        move(-1)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [move, expandedPortfolio])

  // Body scroll lock when expanded
  useEffect(() => {
    if (expandedPortfolio) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [expandedPortfolio])

  // Auto-scroll logic
  useEffect(() => {
    if (expandedPortfolio || isHovered) return
    const interval = setInterval(() => {
      move(1)
    }, 4000)
    return () => clearInterval(interval)
  }, [move, expandedPortfolio, isHovered])

  return (
    <div 
      className="portfolio-deck"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
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
                layoutId={`card-${portfolio.name}`}
                className={`portfolio-card ${isCurrent ? 'is-active' : ''}`}
                onClick={() => {
                  setExpandedPortfolio(portfolio)
                  setActiveMemberIndex(0)
                }}
                style={{ cursor: 'pointer' }}
                initial={false}
                animate={
                  reduceMotion
                    ? { opacity: isCurrent ? 1 : 0, zIndex: isCurrent ? 10 : 0, pointerEvents: isCurrent ? 'auto' : 'none' }
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
                        pointerEvents: 'auto',
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

      <AnimatePresence>
        {expandedPortfolio && (
          <motion.div
            className="portfolio-modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setExpandedPortfolio(null)}
          >
            <motion.div
              layoutId={`card-${expandedPortfolio.name}`}
              className="portfolio-expanded-card"
              onClick={(e) => e.stopPropagation()}
              initial={{ rotateY: 8, scale: 0.95, opacity: 0 }}
              animate={{ rotateY: 0, scale: 1, opacity: 1 }}
              exit={{ rotateY: -8, scale: 0.95, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            >
              <button className="member-back-nav" onClick={() => setExpandedPortfolio(null)}>
                <ArrowLeft size={16} /> Back to Deck
              </button>
              
              <div className="member-nav-bar">
                <div className="member-indicator">
                  0{activeMemberIndex + 1} / 0{dummyMembers.length}
                </div>
                <div className="member-arrows">
                  <button onClick={() => setActiveMemberIndex(curr => (curr - 1 + dummyMembers.length) % dummyMembers.length)}>
                    <ArrowLeft size={16} />
                  </button>
                  <button onClick={() => setActiveMemberIndex(curr => (curr + 1) % dummyMembers.length)}>
                    <ArrowRight size={16} />
                  </button>
                </div>
              </div>

              <div className="member-left-col">
                <div className="member-radial-glow" />
                <div className="member-portrait" />
                <div className="member-identity">
                  <AnimatePresence mode="wait">
                    <motion.h2 
                      key={`name-${activeMemberIndex}`}
                      initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} transition={{ duration: 0.2 }}
                      className="member-huge-name"
                    >
                      {dummyMembers[activeMemberIndex].name}
                    </motion.h2>
                  </AnimatePresence>
                  <AnimatePresence mode="wait">
                    <motion.p 
                      key={`role-${activeMemberIndex}`}
                      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2, delay: 0.05 }}
                      className="member-gold-role"
                    >
                      {dummyMembers[activeMemberIndex].role}
                    </motion.p>
                  </AnimatePresence>
                  <AnimatePresence mode="wait">
                    <motion.p 
                      key={`pos-${activeMemberIndex}`}
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2, delay: 0.1 }}
                      className="member-position"
                    >
                      {dummyMembers[activeMemberIndex].position}
                    </motion.p>
                  </AnimatePresence>
                </div>
              </div>

              <div className="member-right-col">
                <AnimatePresence mode="wait">
                  <motion.div 
                    key={`info-${activeMemberIndex}`}
                    initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }}
                    className="member-info-content"
                  >
                    <div className="member-section">
                      <h4>About</h4>
                      <p>{dummyMembers[activeMemberIndex].about}</p>
                    </div>
                    
                    <div className="member-section">
                      <h4>Skills</h4>
                      <div className="member-skills">
                        {dummyMembers[activeMemberIndex].skills.map(skill => (
                          <span key={skill} className="member-skill-chip">{skill}</span>
                        ))}
                      </div>
                    </div>

                    <div className="member-section">
                      <h4>Experience</h4>
                      <div className="member-experience-list">
                        {dummyMembers[activeMemberIndex].experience.map((exp, i) => (
                          <div key={i} className="experience-item">
                            <div className="exp-header">
                              <span className="exp-title">{exp.title}</span>
                              <span className="exp-date">{exp.date}</span>
                            </div>
                            <div className="exp-company">{exp.company}</div>
                            <p className="exp-desc">{exp.description}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="member-section">
                      <h4>Projects</h4>
                      <div className="member-projects-carousel">
                        {dummyMembers[activeMemberIndex].projects.map((proj, i) => (
                          <div key={i} className="project-card">
                            <div className="project-thumbnail" />
                            <div className="project-details">
                              <span className="project-title">{proj.title}</span>
                              <p className="project-desc">{proj.description}</p>
                              <div className="project-tags">
                                {proj.tags.map(tag => <span key={tag} className="project-tag">{tag}</span>)}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="member-section">
                      <h4>Contact</h4>
                      <p>{dummyMembers[activeMemberIndex].contact}</p>
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
