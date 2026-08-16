import { motion, useReducedMotion, useScroll, useSpring, useTransform, useMotionValueEvent } from 'framer-motion'
import { useRef, useState, memo } from 'react'
import { useIsMobile } from '../hooks/useIsMobile'

function PageFlipSectionComponent({ children, zIndex, isLast = false }) {
  const containerRef = useRef(null)
  const reduceMotion = useReducedMotion()
  const isMobile = useIsMobile(1024)

  // Exit animation (this page lifting and flipping away)
  const { scrollYProgress: exitProgress } = useScroll({
    target: containerRef,
    offset: ['end end', 'end start'],
  })

  // Enter animation (this page rising from underneath)
  const { scrollYProgress: enterProgress } = useScroll({
    target: containerRef,
    offset: ['start end', 'start start'],
  })

  // Spring configuration for premium, inert-like feel
  const springConfig = { stiffness: 400, damping: 45, mass: 1 }

  const smoothExit = useSpring(exitProgress, springConfig)
  const smoothEnter = useSpring(enterProgress, springConfig)

  // 1. Lift & Flip (Exit Transforms)
  // When exiting (smoothExit 0 -> 1):
  // rotateX goes from 0 to 18deg
  // translateY goes from 0% to -15%
  // scale goes from 1 to 0.96
  const exitRotateX = useTransform(smoothExit, [0, 1], [0, 18])
  const exitY = useTransform(smoothExit, [0, 1], ['0%', '-15%'])
  const exitScale = useTransform(smoothExit, [0, 0.4, 1], [1, 0.995, 0.96])
  const exitOpacity = useTransform(smoothExit, [0.8, 1], [1, 0])
  const exitShadowOpacity = useTransform(smoothExit, [0, 1], [0, 0.6])
  
  const [isExited, setIsExited] = useState(false)
  useMotionValueEvent(smoothExit, 'change', (latest) => {
    const exited = latest > 0.1
    if (exited !== isExited) setIsExited(exited)
  })
  
  // Shadow box for the page lifting up
  const exitBoxShadow = useTransform(
    smoothExit,
    [0, 1],
    ['0px 0px 0px rgba(0,0,0,0)', '0px 40px 60px -10px rgba(0,0,0,0.3)']
  )

  // 2. Reveal (Enter Transforms)
  // When entering (smoothEnter 0 -> 1):
  // rotateX goes from -3deg to 0
  // translateY goes from 30px to 0px
  // scale goes from 0.98 to 1
  const enterRotateX = useTransform(smoothEnter, [0, 1], [-3, 0])
  const enterY = useTransform(smoothEnter, [0, 1], ['30px', '0px'])
  const enterScale = useTransform(smoothEnter, [0, 1], [0.98, 1])

  // Fallback for reduced motion or mobile viewports
  if (reduceMotion || isMobile) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.15 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        style={{ position: 'relative', zIndex, background: 'var(--canvas)', width: '100%' }}
      >
        {children}
      </motion.div>
    )
  }

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        width: '100%',
        zIndex,
        paddingBottom: isLast ? '0' : '100dvh',
        marginBottom: isLast ? '0' : '-100dvh',
        pointerEvents: 'none',
      }}
    >
      {/* Sticky container that holds the pinned section during the extra scroll space */}
      <div
        style={{
          position: 'sticky',
          bottom: 0,
          width: '100%',
          perspective: '1500px',
          pointerEvents: isExited ? 'none' : 'auto',
        }}
      >
        {/* The Exit Wrapper (handles the lift and flip out) */}
        <motion.div
          style={{
            rotateX: exitRotateX,
            y: exitY,
            scale: exitScale,
            opacity: exitOpacity,
            pointerEvents: isExited ? 'none' : 'auto',
            transformOrigin: '50% 0%', // Pivot from the top
            width: '100%',
            willChange: 'transform, opacity',
            boxShadow: exitBoxShadow,
          }}
        >
          {/* The Enter Wrapper (handles the rise and reveal in) */}
          <motion.div
            style={{
              rotateX: enterRotateX,
              y: enterY,
              scale: enterScale,
              width: '100%',
              background: 'var(--canvas)', // Must be opaque to hide the section underneath
              willChange: 'transform',
            }}
          >
            {children}

            {/* Optical Illusion for Curvature: Overlay gradient that darkens the bottom edge as it lifts */}
            <motion.div
              style={{
                position: 'absolute',
                inset: 0,
                pointerEvents: 'none',
                background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent 40%)',
                opacity: exitShadowOpacity,
                mixBlendMode: 'multiply',
              }}
            />
          </motion.div>
        </motion.div>
      </div>
    </div>
  )
}

export const PageFlipSection = memo(PageFlipSectionComponent)

