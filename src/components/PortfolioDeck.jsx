/**
 * PortfolioDeck - Compact lead cards with full-row expansion popup modal.
 * Features Neo-Brutalist design, lead photo avatars, core team roster grid,
 * smooth spring animations, keyboard navigation, and tab controls.
 */

import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import {
  ArrowLeft,
  ArrowRight,
  ChevronRight,
  Github,
  Linkedin,
  Users,
  X,
} from 'lucide-react'
import { memo, useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { portfolios } from '../data/clubContent'

/**
 * Avatar with graceful fallback to styled Neo-Brutalist initials
 */
function AvatarWithFallback({ src, alt, name, className }) {
  const [error, setError] = useState(false)

  const initials = name
    ? name
        .split(' ')
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'A'

  if (error || !src) {
    return (
      <div className={`portfolio-avatar-placeholder ${className || ''}`} aria-label={alt || name}>
        <span className="avatar-initials-text">{initials}</span>
      </div>
    )
  }

  return (
    <img
      src={src}
      alt={alt || name}
      className={`portfolio-avatar-img ${className || ''}`}
      onError={() => setError(true)}
      loading="lazy"
    />
  )
}

function PortfolioDeckComponent() {
  const reduceMotion = useReducedMotion()
  const [activeIndex, setActiveIndex] = useState(0)
  const [selectedTeam, setSelectedTeam] = useState(null)
  const [isHovered, setIsHovered] = useState(false)
  const [isDragging, setIsDragging] = useState(false)

  const containerRef = useRef(null)
  const cardRefs = useRef([])
  const dragStartRef = useRef({ x: 0, scrollLeft: 0, hasDragged: false })

  // Scroll carousel to a specific card index
  const scrollToCard = useCallback((index) => {
    const container = containerRef.current
    if (!container) return

    const clampedIndex = Math.max(0, Math.min(portfolios.length - 1, index))
    const firstCard = container.querySelector('.portfolio-team-card')
    const cardWidth = firstCard ? firstCard.offsetWidth : 300
    const gap = 20

    container.scrollTo({
      left: clampedIndex * (cardWidth + gap),
      behavior: 'smooth',
    })
    setActiveIndex(clampedIndex)
  }, [])

  // Move exactly one card left or right
  const moveOneCard = useCallback((direction) => {
    setActiveIndex((prev) => {
      let next = prev + direction
      if (next < 0) next = portfolios.length - 1
      if (next >= portfolios.length) next = 0
      scrollToCard(next)
      return next
    })
  }, [scrollToCard])

  // Open full-width modal for a selected team
  const handleOpenTeam = useCallback((portfolio, index) => {
    setSelectedTeam(portfolio)
    setActiveIndex(index)
    scrollToCard(index)
  }, [scrollToCard])

  // Close modal
  const handleCloseModal = useCallback(() => {
    setSelectedTeam(null)
  }, [])

  // Navigate between teams while in modal
  const handlePrevTeam = useCallback(() => {
    if (!selectedTeam) {
      moveOneCard(-1)
      return
    }
    const currentIdx = portfolios.findIndex((p) => p.name === selectedTeam.name)
    const prevIdx = (currentIdx - 1 + portfolios.length) % portfolios.length
    setSelectedTeam(portfolios[prevIdx])
    scrollToCard(prevIdx)
  }, [selectedTeam, moveOneCard, scrollToCard])

  const handleNextTeam = useCallback(() => {
    if (!selectedTeam) {
      moveOneCard(1)
      return
    }
    const currentIdx = portfolios.findIndex((p) => p.name === selectedTeam.name)
    const nextIdx = (currentIdx + 1) % portfolios.length
    setSelectedTeam(portfolios[nextIdx])
    scrollToCard(nextIdx)
  }, [selectedTeam, moveOneCard, scrollToCard])

  // Keyboard navigation: Escape closes modal, Left/Right cycles teams/cards
  useEffect(() => {
    const handleKeyDown = (e) => {
      const tag = document.activeElement ? document.activeElement.tagName : ''
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return

      if (e.key === 'Escape') {
        if (selectedTeam) {
          e.preventDefault()
          handleCloseModal()
        }
      } else if (e.key === 'ArrowRight') {
        e.preventDefault()
        if (selectedTeam) {
          handleNextTeam()
        } else {
          moveOneCard(1)
        }
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault()
        if (selectedTeam) {
          handlePrevTeam()
        } else {
          moveOneCard(-1)
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedTeam, handleCloseModal, handleNextTeam, handlePrevTeam, moveOneCard])

  // Prevent background scrolling while modal is open
  useEffect(() => {
    if (selectedTeam) {
      const originalOverflow = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = originalOverflow
      }
    }
  }, [selectedTeam])

  // Auto-scroll loop (pauses on hover, drag, or when modal is open)
  useEffect(() => {
    if (isHovered || isDragging || selectedTeam) return

    const interval = setInterval(() => {
      moveOneCard(1)
    }, 4200)

    return () => clearInterval(interval)
  }, [isHovered, isDragging, selectedTeam, moveOneCard])

  // Mouse drag-to-scroll handlers
  const handleMouseDown = (e) => {
    const container = containerRef.current
    if (!container) return

    setIsDragging(true)
    dragStartRef.current = {
      x: e.pageX - container.offsetLeft,
      scrollLeft: container.scrollLeft,
      hasDragged: false,
    }
  }

  const handleMouseMove = (e) => {
    if (!isDragging) return
    const container = containerRef.current
    if (!container) return

    e.preventDefault()
    const x = e.pageX - container.offsetLeft
    const walk = (x - dragStartRef.current.x) * 1.5
    if (Math.abs(walk) > 5) {
      dragStartRef.current.hasDragged = true
    }
    container.scrollLeft = dragStartRef.current.scrollLeft - walk
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  // Update active index based on scroll position
  const handleScroll = () => {
    const container = containerRef.current
    if (!container || isDragging) return

    const firstCard = container.querySelector('.portfolio-team-card')
    const cardWidth = firstCard ? firstCard.offsetWidth : 300
    const gap = 20
    const itemFullWidth = cardWidth + gap
    const scrollPos = container.scrollLeft

    const closestIndex = Math.round(scrollPos / itemFullWidth)
    const clampedIndex = Math.max(0, Math.min(portfolios.length - 1, closestIndex))

    if (clampedIndex !== activeIndex) {
      setActiveIndex(clampedIndex)
    }
  }

  const selectedTeamIndex = selectedTeam
    ? portfolios.findIndex((p) => p.name === selectedTeam.name)
    : -1

  return (
    <div
      className="portfolio-deck"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false)
        setIsDragging(false)
      }}
    >
      {/* Top Number Tabs Navigation */}
      <div className="portfolio-nav-header">
        <div className="portfolio-tabs" role="tablist" aria-label="Portfolio teams list">
          {portfolios.map((portfolio, index) => {
            const isActive = index === activeIndex
            return (
              <button
                key={portfolio.name}
                type="button"
                role="tab"
                aria-selected={isActive}
                className={isActive ? 'is-active' : ''}
                onClick={() => {
                  scrollToCard(index)
                  if (selectedTeam) {
                    setSelectedTeam(portfolio)
                  }
                }}
              >
                {isActive && (
                  <motion.div
                    layoutId="portfolio-tab-indicator"
                    className="tab-indicator"
                    transition={{
                      type: 'spring',
                      stiffness: 400,
                      damping: 30,
                    }}
                  />
                )}
                <span className="tab-number-text">0{index + 1}</span>
              </button>
            )
          })}
        </div>

        {/* Arrow Controls */}
        <div className="portfolio-arrow-controls">
          <button
            type="button"
            className="portfolio-nav-arrow"
            onClick={() => moveOneCard(-1)}
            aria-label="Previous team"
          >
            <ArrowLeft size={18} />
          </button>
          <button
            type="button"
            className="portfolio-nav-arrow"
            onClick={() => moveOneCard(1)}
            aria-label="Next team"
          >
            <ArrowRight size={18} />
          </button>
        </div>
      </div>

      {/* Draggable Carousel Track (Compact Cards - 3 per row on desktop) */}
      <div
        ref={containerRef}
        className={`portfolio-scroll-track ${isDragging ? 'is-dragging' : ''}`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onScroll={handleScroll}
      >
        {portfolios.map((portfolio, index) => {
          return (
            <motion.article
              key={portfolio.name}
              ref={(el) => (cardRefs.current[index] = el)}
              className="portfolio-team-card"
              onClick={() => {
                if (!dragStartRef.current.hasDragged) {
                  handleOpenTeam(portfolio, index)
                }
              }}
              whileHover={
                reduceMotion || isDragging
                  ? {}
                  : {
                      y: -8,
                      transition: { type: 'spring', stiffness: 350, damping: 25 },
                    }
              }
            >
              {/* Card Banner */}
              <div
                className="portfolio-card-banner"
                style={{
                  background: `linear-gradient(135deg, ${portfolio.color || 'var(--violet)'} 0%, var(--gold) 100%)`,
                }}
              >
                <div className="portfolio-card-banner-overlay" />
                <span className="portfolio-card-number">0{index + 1}</span>
                <span className="portfolio-card-badge">{portfolio.eyebrow}</span>
              </div>

              {/* Card Body */}
              <div className="portfolio-card-content">
                {/* Team Lead Section */}
                <div className="portfolio-lead-section">
                  <div className="portfolio-lead-avatar-wrap">
                    <AvatarWithFallback
                      src={portfolio.lead?.photo}
                      name={portfolio.lead?.name}
                      alt={portfolio.lead?.name}
                      className="portfolio-lead-avatar"
                    />
                    <span className="portfolio-lead-badge-mini" title="Team Lead">Lead</span>
                  </div>
                  <div className="portfolio-lead-meta">
                    <span className="portfolio-lead-kicker">TEAM LEAD</span>
                    <h4 className="portfolio-lead-name">{portfolio.lead?.name || 'Team Lead'}</h4>
                    <span className="portfolio-lead-role">{portfolio.lead?.role || 'Lead Coordinator'}</span>
                  </div>
                </div>

                {/* Team Info */}
                <div className="portfolio-team-info">
                  <h3 className="portfolio-card-title">{portfolio.name}</h3>
                  <p className="portfolio-card-domain">{portfolio.domain}</p>
                  <p className="portfolio-card-desc">{portfolio.desc || portfolio.description}</p>
                </div>

                {/* Footer Action Pill */}
                <div className="portfolio-card-footer">
                  <div className="portfolio-member-count-pill">
                    <Users size={13} />
                    <span>{(portfolio.members?.length || 0) + 1} Members</span>
                  </div>
                  <span className="portfolio-expand-cta">
                    View Team
                    <ChevronRight size={15} />
                  </span>
                </div>
              </div>
            </motion.article>
          )
        })}
      </div>

      {/* Full-Row Expansion Popup Modal (Portaled to document.body) */}
      {typeof document !== 'undefined' &&
        createPortal(
          <AnimatePresence>
            {selectedTeam && (
              <motion.div
                key="portfolio-modal-backdrop"
                className="portfolio-modal-backdrop"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                onClick={handleCloseModal}
                role="dialog"
                aria-modal="true"
                aria-label={`${selectedTeam.name} team roster`}
              >
                <motion.div
                  key={`portfolio-modal-dialog-${selectedTeam.name}`}
                  className="portfolio-modal-dialog"
                  initial={{ opacity: 0, scale: 0.92, y: 24 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.94, y: 16 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Modal Header Banner */}
                  <div
                    className="portfolio-modal-header"
                    style={{
                      background: `linear-gradient(135deg, ${selectedTeam.color || 'var(--violet)'} 0%, var(--gold) 100%)`,
                    }}
                  >
                    <div className="portfolio-modal-header-top">
                      <div className="portfolio-modal-badges">
                        <span className="portfolio-modal-number">
                          0{selectedTeamIndex + 1}
                        </span>
                        <span className="portfolio-modal-kicker">
                          {selectedTeam.eyebrow}
                        </span>
                        <span className="portfolio-modal-badge-tag">
                          {selectedTeam.badge || 'Team Roster'}
                        </span>
                      </div>

                      <div className="portfolio-modal-actions">
                        <button
                          type="button"
                          className="portfolio-modal-arrow-btn"
                          onClick={handlePrevTeam}
                          title="Previous team (Left arrow)"
                          aria-label="Previous team"
                        >
                          <ArrowLeft size={18} />
                        </button>
                        <button
                          type="button"
                          className="portfolio-modal-arrow-btn"
                          onClick={handleNextTeam}
                          title="Next team (Right arrow)"
                          aria-label="Next team"
                        >
                          <ArrowRight size={18} />
                        </button>
                        <button
                          type="button"
                          className="portfolio-modal-close-btn"
                          onClick={handleCloseModal}
                          title="Close team view (Escape)"
                          aria-label="Close full team view"
                        >
                          <X size={20} />
                        </button>
                      </div>
                    </div>

                    <div className="portfolio-modal-header-info">
                      <h2 className="portfolio-modal-title">{selectedTeam.name}</h2>
                      <p className="portfolio-modal-domain">{selectedTeam.domain}</p>
                      <p className="portfolio-modal-desc">
                        {selectedTeam.description || selectedTeam.desc}
                      </p>
                    </div>
                  </div>

                  {/* Modal Body */}
                  <div className="portfolio-modal-body">
                    {/* Team Lead Spotlight Section */}
                    {selectedTeam.lead && (
                      <div className="portfolio-lead-spotlight-card">
                        <div className="portfolio-lead-spotlight-avatar-box">
                          <AvatarWithFallback
                            src={selectedTeam.lead.photo}
                            name={selectedTeam.lead.name}
                            alt={selectedTeam.lead.name}
                            className="portfolio-spotlight-avatar"
                          />
                          <span className="portfolio-lead-tag-ribbon">LEAD</span>
                        </div>

                        <div className="portfolio-lead-spotlight-details">
                          <div className="portfolio-lead-spotlight-header">
                            <div>
                              <span className="portfolio-spotlight-kicker">PORTFOLIO LEAD</span>
                              <h3 className="portfolio-spotlight-name">{selectedTeam.lead.name}</h3>
                              <p className="portfolio-spotlight-role">{selectedTeam.lead.role}</p>
                            </div>

                            <div className="portfolio-member-socials">
                              {selectedTeam.lead.github ? (
                                <a
                                  href={selectedTeam.lead.github}
                                  target="_blank"
                                  rel="noreferrer noopener"
                                  className="portfolio-social-link"
                                  title="GitHub Profile"
                                  aria-label={`${selectedTeam.lead.name}'s GitHub`}
                                >
                                  <Github size={16} />
                                </a>
                              ) : null}
                              {selectedTeam.lead.linkedin ? (
                                <a
                                  href={selectedTeam.lead.linkedin}
                                  target="_blank"
                                  rel="noreferrer noopener"
                                  className="portfolio-social-link"
                                  title="LinkedIn Profile"
                                  aria-label={`${selectedTeam.lead.name}'s LinkedIn`}
                                >
                                  <Linkedin size={16} />
                                </a>
                              ) : null}
                            </div>
                          </div>

                          {selectedTeam.tools && selectedTeam.tools.length > 0 && (
                            <div className="portfolio-spotlight-tools">
                              <span className="portfolio-tools-label">Core Focus & Tools:</span>
                              <div className="portfolio-tools-wrap">
                                {selectedTeam.tools.map((tool) => (
                                  <span key={tool} className="portfolio-tool-pill">
                                    {tool}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Team Members Grid Section */}
                    <div className="portfolio-roster-section">
                      <div className="portfolio-roster-header">
                        <h4 className="portfolio-roster-title">
                          Team Roster{' '}
                          <span className="portfolio-roster-count">
                            ({(selectedTeam.members?.length || 0) + 1} Total)
                          </span>
                        </h4>
                        <span className="portfolio-roster-subtitle">
                          Core contributors and specialists
                        </span>
                      </div>

                      <div className="portfolio-roster-grid">
                        {selectedTeam.members?.map((member) => (
                          <div key={member.name} className="portfolio-member-card">
                            <div className="portfolio-member-avatar-box">
                              <AvatarWithFallback
                                src={member.photo}
                                name={member.name}
                                alt={member.name}
                                className="portfolio-member-avatar"
                              />
                            </div>
                            <h5 className="portfolio-member-name">{member.name}</h5>
                            <p className="portfolio-member-role">{member.role}</p>

                            <div className="portfolio-member-socials">
                              {member.github ? (
                                <a
                                  href={member.github}
                                  target="_blank"
                                  rel="noreferrer noopener"
                                  className="portfolio-social-link"
                                  title="GitHub"
                                  aria-label={`${member.name}'s GitHub`}
                                >
                                  <Github size={14} />
                                </a>
                              ) : null}
                              {member.linkedin ? (
                                <a
                                  href={member.linkedin}
                                  target="_blank"
                                  rel="noreferrer noopener"
                                  className="portfolio-social-link"
                                  title="LinkedIn"
                                  aria-label={`${member.name}'s LinkedIn`}
                                >
                                  <Linkedin size={14} />
                                </a>
                              ) : null}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Modal Quick Nav Footer */}
                  <div className="portfolio-modal-footer">
                    <button
                      type="button"
                      className="portfolio-footer-nav-btn"
                      onClick={handlePrevTeam}
                    >
                      <ArrowLeft size={16} />
                      <span>Previous Team</span>
                    </button>
                    <div className="portfolio-footer-counter">
                      <span>
                        0{selectedTeamIndex + 1} / 0{portfolios.length}
                      </span>
                    </div>
                    <button
                      type="button"
                      className="portfolio-footer-nav-btn"
                      onClick={handleNextTeam}
                    >
                      <span>Next Team</span>
                      <ArrowRight size={16} />
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body
        )}
    </div>
  )
}

export const PortfolioDeck = memo(PortfolioDeckComponent)
