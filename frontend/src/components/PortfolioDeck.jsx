/** Motion-first portfolio explorer that turns the seven teams into an Awwwards-level physical card stack. */

import { motion, useReducedMotion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { useCallback, useEffect, useState, useRef } from 'react'
import { createPortal } from 'react-dom'
import { portfolios } from '../data/clubContent'
import { useIsMobile } from '../hooks/useIsMobile'

const ModalPortal = ({ children }) => {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  return mounted ? createPortal(children, document.body) : null
}

// Particle generator for cinematic background floating dust
function CinematicParticles() {
  const particles = Array.from({ length: 16 }).map((_, i) => ({
    id: i,
    left: `${(i * 6.25 + (i % 3) * 4) % 95}%`,
    size: `${3 + (i % 5) * 2}px`,
    duration: `${6 + (i % 4) * 2.5}s`,
    delay: `${(i % 5) * 0.8}s`,
    maxOpacity: 0.3 + (i % 4) * 0.15,
    driftX: `${(i % 2 === 0 ? 1 : -1) * (20 + (i % 3) * 25)}px`
  }))

  return (
    <div className="cinematic-particles-container">
      {particles.map((p) => (
        <div
          key={p.id}
          className="dust-particle"
          style={{
            left: p.left,
            width: p.size,
            height: p.size,
            '--duration': p.duration,
            '--delay': p.delay,
            '--max-opacity': p.maxOpacity,
            '--drift-x': p.driftX
          }}
        />
      ))}
    </div>
  )
}

// Dummy team members formatted as professional club introduction cards
const memberNames = [
  'Aarav Sharma', 'Ananya Verma', 'Rohan Mehta', 'Isha Kapoor',
  'Kabir Sengupta', 'Diya Roy', 'Aditya Nair', 'Sanya Malhotra'
]
const memberTitles = [
  'Technical Lead', 'Creative Director', 'Production Head', 'Documentation Specialist',
  'Marketing Strategist', 'Hospitality Lead', 'Event Coordinator', 'Core Executive'
]

const baseMembers = Array(8).fill(null).map((_, i) => ({
  id: i,
  name: memberNames[i % memberNames.length],
  title: memberTitles[i % memberTitles.length],
  team: 'AARNA EXECUTIVE',
  photoOnly: false,
  about: 'Passionate student leader driving innovation, team collaboration, and impactful campus initiatives at AARNA. Experienced in leading multidisciplinary projects from vision to execution.',
  competencies: [
    { name: 'Web Architecture', level: 94 - (i * 2) },
    { name: 'UI/UX Design', level: 90 + (i % 4) },
    { name: 'System Design', level: 88 + (i % 5) },
    { name: 'Team Leadership', level: 95 - (i % 3) },
    { name: 'Project Execution', level: 89 + (i % 3) },
    { name: 'Creative Strategy', level: 86 + (i % 6) }
  ],
  skills: ['Frontend', 'Backend', 'UI/UX', 'Cloud', 'DevOps', 'AI'],
  experience: [
    { title: 'Core Lead Placeholder', date: '2024 - Present', company: 'AARNA Club', description: 'Overseeing technical architecture and project delivery across university events.' },
    { title: 'Executive Member', date: '2023 - 2024', company: 'AARNA Club', description: 'Contributed to key student initiatives and collaborative team projects.' }
  ],
  projects: [
    { title: 'Project Alpha', description: 'A seamless platform for managing university events.', tags: ['React', 'Node.js'] },
    { title: 'Design System', description: 'Comprehensive UI kit and component library.', tags: ['Figma', 'CSS'] },
    { title: 'Web Scraper', description: 'Automated data extraction tool for research.', tags: ['Python', 'Data'] }
  ],
  contact: 'Placeholder contact info (e.g., LinkedIn, GitHub, Email).'
}))

const dummyMembers = [
  ...baseMembers,
  {
    id: 8,
    name: 'The Sentinel',
    title: 'Shadow Athlete (Photo Only)',
    team: 'AARNA EXECUTIVE',
    photoOnly: true,
    about: '',
    competencies: [],
    skills: [],
    experience: [],
    projects: [],
    contact: ''
  }
]

function MemberCardTilt({ member, introStage, isSwitching, photoOnly }) {
  const cardRef = useRef(null)
  const [rotateX, setRotateX] = useState(0)
  const [rotateY, setRotateY] = useState(0)
  const [glarePos, setGlarePos] = useState({ x: 50, y: 50, opacity: 0 })

  const handleMouseMove = (e) => {
    if (!cardRef.current) return
    const rect = cardRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const centerX = rect.width / 2
    const centerY = rect.height / 2

    const rX = ((y - centerY) / centerY) * -12
    const rY = ((x - centerX) / centerX) * 12

    setRotateX(rX)
    setRotateY(rY)

    const glareX = (x / rect.width) * 100
    const glareY = (y / rect.height) * 100
    setGlarePos({ x: glareX, y: glareY, opacity: 0.55 })
  }

  const handleMouseLeave = () => {
    setRotateX(0)
    setRotateY(0)
    setGlarePos(prev => ({ ...prev, opacity: 0 }))
  }

  return (
    <div className="player-card-3d-wrapper">
      <motion.div
        ref={cardRef}
        className={`member-intro-card ${photoOnly ? 'is-photo-only' : ''}`}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        animate={
          photoOnly && introStage >= 2
            ? {
                rotateX: [rotateX - 2, rotateX + 2, rotateX - 2],
                rotateY: [rotateY + 3, rotateY - 3, rotateY + 3],
                scale: [1.02, 1.05, 1.02],
                boxShadow: [
                  '0 25px 60px rgba(0, 0, 0, 0.55), 0 0 30px rgba(255, 215, 0, 0.3)',
                  '0 30px 80px rgba(0, 0, 0, 0.75), 0 0 60px rgba(255, 215, 0, 0.6)',
                  '0 25px 60px rgba(0, 0, 0, 0.55), 0 0 30px rgba(255, 215, 0, 0.3)'
                ]
              }
            : { rotateX, rotateY }
        }
        transition={
          photoOnly && introStage >= 2
            ? { duration: 4, repeat: Infinity, ease: 'easeInOut' }
            : { type: 'spring', stiffness: 280, damping: 22 }
        }
        style={{ transformStyle: 'preserve-3d' }}
      >
        {/* Rim Light */}
        <div className="member-rim-light" />

        {/* Dynamic ambient glass glare */}
        <div
          className="intro-card-glare"
          style={{
            background: `radial-gradient(circle at ${glarePos.x}% ${glarePos.y}%, rgba(255, 255, 255, 0.6) 0%, rgba(212, 175, 55, 0.25) 35%, transparent 75%)`,
            opacity: glarePos.opacity,
          }}
        />

        {/* Card Header: Club Tag + Status */}
        <div className="intro-card-header">
          <span className="intro-card-club-tag">AARNA CLUB</span>
          <span className="intro-card-status-badge">MEMBER CARD</span>
        </div>

        {/* Portrait Container - Scene 2 Character Rise & Quick Switch */}
        <div className="intro-portrait-frame">
          <motion.div
            key={member.id}
            className="intro-portrait-wrapper"
            initial={{ y: 90, opacity: 0, scale: 0.85, filter: 'brightness(0.2) contrast(0.5)' }}
            animate={
              isSwitching
                ? { y: [90, -8, 0], opacity: [0, 1], scale: [0.85, 1.04, 1], filter: ['brightness(0.3)', 'brightness(1.1)', 'brightness(1)'] }
                : introStage >= 1
                ? { y: 0, opacity: 1, scale: 1, filter: 'brightness(1) contrast(1)' }
                : { y: 90, opacity: 0.1, scale: 0.85, filter: 'brightness(0.2) contrast(0.5)' }
            }
            transition={
              isSwitching
                ? { duration: 1.1, ease: [0.16, 1, 0.3, 1] }
                : { type: 'spring', stiffness: 140, damping: 14, mass: 1.1 }
            }
          >
            <div className="intro-portrait-placeholder">
              {/* Silhouette / Athletic Icon Emblem */}
              <div className="portrait-athlete-emblem">
                <span>{member.name.split(' ').map(n => n[0]).join('')}</span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Member Identity Block */}
        <motion.div
          className="intro-card-bottom"
          animate={introStage >= 1 ? { opacity: 1, y: 0 } : { opacity: 0.2, y: 15 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <h2 className="intro-member-name">{member.name}</h2>
          <div className="intro-card-divider" />
          <p className="intro-member-title">{member.title}</p>
        </motion.div>
      </motion.div>
    </div>
  )
}

export function PortfolioDeck() {
  const [activeIndex, setActiveIndex] = useState(0)
  const isAnimatingRef = useRef(false)
  const [expandedPortfolio, setExpandedPortfolio] = useState(null)
  const [activeMemberIndex, setActiveMemberIndex] = useState(0)
  const [isHovered, setIsHovered] = useState(false)
  const reduceMotion = useReducedMotion()
  const isMobile = useIsMobile(768)

  // Cinematic Intro Stages
  const [introStage, setIntroStage] = useState(0)
  const [isSwitching, setIsSwitching] = useState(false)

  const move = useCallback((direction) => {
    if (isAnimatingRef.current) return
    isAnimatingRef.current = true
    setActiveIndex((current) => (current + direction + portfolios.length) % portfolios.length)
    setTimeout(() => {
      isAnimatingRef.current = false
    }, 550)
  }, [])

  const handleTabClick = useCallback((index) => {
    if (isAnimatingRef.current || index === activeIndex) return
    isAnimatingRef.current = true
    setActiveIndex(index)
    setTimeout(() => {
      isAnimatingRef.current = false
    }, 550)
  }, [activeIndex])

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (expandedPortfolio) {
        if (e.key === 'Escape') setExpandedPortfolio(null)
        if (e.key === 'ArrowRight') handleMemberChange((activeMemberIndex + 1) % dummyMembers.length)
        if (e.key === 'ArrowLeft') handleMemberChange((activeMemberIndex - 1 + dummyMembers.length) % dummyMembers.length)
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
  }, [move, expandedPortfolio, activeMemberIndex])

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

  // Auto-scroll logic for deck
  useEffect(() => {
    if (expandedPortfolio || isHovered) return
    const interval = setInterval(() => {
      move(1)
    }, 4000)
    return () => clearInterval(interval)
  }, [move, expandedPortfolio, isHovered])

  // Trigger 4.5s cinematic sequence when modal opens
  useEffect(() => {
    if (!expandedPortfolio) {
      setIntroStage(0)
      setIsSwitching(false)
      return
    }

    const currentMember = dummyMembers[activeMemberIndex]
    const photoOnly = !currentMember || currentMember.photoOnly || !currentMember.about

    // Scene 1: Dark Reveal (0s - 0.8s)
    setIntroStage(0)

    // Scene 2: Character Rise (0.8s - 1.8s)
    const t1 = setTimeout(() => setIntroStage(1), 800)

    // Scene 3: Camera Focus (1.8s - 2.3s)
    const t2 = setTimeout(() => setIntroStage(2), 1800)

    let t3, t4
    if (!photoOnly) {
      // Scene 4: Card Slides Left (2.3s - 3.0s)
      t3 = setTimeout(() => setIntroStage(3), 2300)
      // Scene 5: Details Reveal Stagger (3.0s - 4.5s)
      t4 = setTimeout(() => setIntroStage(4), 3000)
    }

    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
      if (t3) clearTimeout(t3)
      if (t4) clearTimeout(t4)
    }
  }, [expandedPortfolio])

  // Handle switching members with condensed 1-2s transition
  const handleMemberChange = (newIndex) => {
    setIsSwitching(true)
    setActiveMemberIndex(newIndex)

    const targetMember = dummyMembers[newIndex]
    const photoOnly = !targetMember || targetMember.photoOnly || !targetMember.about

    if (photoOnly) {
      setIntroStage(2)
    } else if (introStage < 3) {
      setIntroStage(3)
      setTimeout(() => setIntroStage(4), 600)
    }

    setTimeout(() => {
      setIsSwitching(false)
    }, 1100)
  }

  return (
    <div 
      className="portfolio-deck"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onTouchStart={() => setIsHovered(true)}
      onTouchEnd={() => setIsHovered(false)}
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
                drag={isCurrent ? 'x' : false}
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.2}
                onDragEnd={(e, { offset: dragOffset, velocity }) => {
                  if (dragOffset.x < -60 || velocity.x < -300) {
                    move(1)
                  } else if (dragOffset.x > 60 || velocity.x > 300) {
                    move(-1)
                  }
                }}
                onClick={() => {
                  setExpandedPortfolio(portfolio)
                  setActiveMemberIndex(0)
                }}
                style={{ cursor: 'pointer', touchAction: isCurrent ? 'pan-y' : 'auto' }}
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
                  animate={isMobile ? false : { rotate: 360 }}
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

                {/* Card Content */}
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
            onClick={(e) => {
              e.stopPropagation()
              move(-1)
            }}
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
            onClick={(e) => {
              e.stopPropagation()
              move(1)
            }}
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

      {/* --- CINEMATIC SPORTS PLAYER INTRO MODAL --- */}
      <ModalPortal>
        <AnimatePresence>
          {expandedPortfolio && (
            <motion.div
              className={`portfolio-modal-backdrop stage-${introStage}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setExpandedPortfolio(null)}
            >
              {/* Faint Bottom Spotlight Ray */}
              <div className="cinematic-spotlight-ray" />

              {/* Floating Dust Particles */}
              <CinematicParticles />

              {/* Cinematic Vignette */}
              <div className="cinematic-vignette" />

              <motion.div
                className={`portfolio-expanded-card stage-${introStage} ${
                  dummyMembers[activeMemberIndex]?.photoOnly ? 'is-photo-only-layout' : ''
                }`}
                onClick={(e) => e.stopPropagation()}
                initial={{ scale: 0.92, opacity: 0, y: 30 }}
                animate={{
                  scale: introStage >= 2 && dummyMembers[activeMemberIndex]?.photoOnly ? 1.05 : 1,
                  opacity: 1,
                  y: 0
                }}
                exit={{ scale: 0.92, opacity: 0, y: 30 }}
                transition={{ type: 'spring', damping: 25, stiffness: 180 }}
              >
                {/* Member Card Left Col */}
                <motion.div
                  className="member-left-col"
                  animate={
                    dummyMembers[activeMemberIndex]?.photoOnly
                      ? { width: '100%', margin: '0 auto' }
                      : introStage >= 3
                      ? { width: isMobile ? '100%' : '38%', padding: isMobile ? '24px' : '40px' }
                      : { width: '100%', margin: '0 auto' }
                  }
                  transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                >
                  <MemberCardTilt
                    member={dummyMembers[activeMemberIndex]}
                    introStage={introStage}
                    isSwitching={isSwitching}
                    photoOnly={dummyMembers[activeMemberIndex]?.photoOnly}
                  />
                </motion.div>

                {/* Right Details Panel - Scene 4 & 5 */}
                {!dummyMembers[activeMemberIndex]?.photoOnly && (
                  <motion.div
                    className="member-right-col"
                    animate={
                      introStage >= 3
                        ? { opacity: 1, x: 0, width: isMobile ? '100%' : '62%', display: 'flex' }
                        : { opacity: 0, x: 40, width: '0%', display: 'none' }
                    }
                    transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                  >
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={`info-${activeMemberIndex}`}
                        initial={{ opacity: 0, y: 20 }}
                        animate={introStage >= 4 ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.5 }}
                        className="member-info-content"
                      >
                        <motion.div
                          className="member-section"
                          initial={{ opacity: 0, y: 15 }}
                          animate={introStage >= 4 ? { opacity: 1, y: 0 } : { opacity: 0, y: 15 }}
                          transition={{ delay: 0.05 }}
                        >
                          <h4>Member Bio</h4>
                          <p>{dummyMembers[activeMemberIndex].about}</p>
                        </motion.div>

                        <motion.div
                          className="member-section"
                          initial={{ opacity: 0, y: 15 }}
                          animate={introStage >= 4 ? { opacity: 1, y: 0 } : { opacity: 0, y: 15 }}
                          transition={{ delay: 0.15 }}
                        >
                          <h4>Core Competencies & Expertise</h4>
                          <div className="competency-grid">
                            {dummyMembers[activeMemberIndex].competencies.map((comp, idx) => (
                              <motion.div
                                key={comp.name}
                                className="competency-item"
                                initial={{ opacity: 0, y: 10 }}
                                animate={introStage >= 4 ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
                                transition={{ delay: 0.2 + idx * 0.06 }}
                              >
                                <div className="competency-header">
                                  <span className="competency-name">{comp.name}</span>
                                  <span className="competency-level">{comp.level}%</span>
                                </div>
                                <div className="competency-bar-track">
                                  <motion.div
                                    className="competency-bar-fill"
                                    initial={{ width: '0%' }}
                                    animate={introStage >= 4 ? { width: `${comp.level}%` } : { width: '0%' }}
                                    transition={{ duration: 1, delay: 0.3 + idx * 0.08, ease: 'easeOut' }}
                                  />
                                </div>
                              </motion.div>
                            ))}
                          </div>
                        </motion.div>

                        <motion.div
                          className="member-section"
                          initial={{ opacity: 0, y: 15 }}
                          animate={introStage >= 4 ? { opacity: 1, y: 0 } : { opacity: 0, y: 15 }}
                          transition={{ delay: 0.35 }}
                        >
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
                        </motion.div>

                        <motion.div
                          className="member-section"
                          initial={{ opacity: 0, y: 15 }}
                          animate={introStage >= 4 ? { opacity: 1, y: 0 } : { opacity: 0, y: 15 }}
                          transition={{ delay: 0.45 }}
                        >
                          <h4>Featured Projects</h4>
                          <div className="member-projects-carousel">
                            {dummyMembers[activeMemberIndex].projects.map((proj, i) => (
                              <div key={i} className="project-card">
                                <div className="project-thumbnail" />
                                <div className="project-details">
                                  <span className="project-title">{proj.title}</span>
                                  <p className="project-desc">{proj.description}</p>
                                  <div className="project-tags">
                                    {proj.tags.map(tag => (
                                      <span key={tag} className="project-tag">{tag}</span>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </motion.div>

                        <motion.div
                          className="member-section"
                          initial={{ opacity: 0, y: 15 }}
                          animate={introStage >= 4 ? { opacity: 1, y: 0 } : { opacity: 0, y: 15 }}
                          transition={{ delay: 0.55 }}
                        >
                          <h4>Contact & Socials</h4>
                          <p>{dummyMembers[activeMemberIndex].contact}</p>
                        </motion.div>
                      </motion.div>
                    </AnimatePresence>
                  </motion.div>
                )}

                {/* Controls Overlay */}
                <button 
                  type="button"
                  className="member-back-nav" 
                  onClick={(e) => {
                    e.stopPropagation()
                    setExpandedPortfolio(null)
                  }}
                >
                  <ArrowLeft size={16} /> Back to Deck
                </button>
                
                <div className="member-nav-bar">
                  <div className="member-indicator">
                    0{activeMemberIndex + 1} / 0{dummyMembers.length}
                  </div>
                  <div className="member-arrows">
                    <button 
                      type="button"
                      aria-label="Previous member"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleMemberChange((activeMemberIndex - 1 + dummyMembers.length) % dummyMembers.length)
                      }}
                    >
                      <ArrowLeft size={16} />
                    </button>
                    <button 
                      type="button"
                      aria-label="Next member"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleMemberChange((activeMemberIndex + 1) % dummyMembers.length)
                      }}
                    >
                      <ArrowRight size={16} />
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </ModalPortal>
    </div>
  )
}
