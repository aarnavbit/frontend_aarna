import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { ArrowLeft, ArrowRight, CheckCircle2, LoaderCircle } from 'lucide-react'
import { useState, useEffect, useRef, useCallback } from 'react'
import { api } from '../api/client'
import { portfolios } from '../data/clubContent'
import { useIsMobile } from '../hooks/useIsMobile'

const initialValues = {
  fullName: '',
  collegeEmail: '',
  phone: '',
  rollNumber: '',
  academicDepartment: '',
  year: '',
  section: '',
  primaryPortfolio: '',
  secondaryPortfolio: '',
  skills: '',
  experience: '',
  motivation: '',
}

const steps = ['Your details', 'College context', 'Your direction']

function validateStep(step, values) {
  const errors = {}
  if (step === 0) {
    if (values.fullName.trim().length < 2) errors.fullName = 'Please enter your full name.'
    if (!/^\S+@\S+\.\S+$/.test(values.collegeEmail)) {
      errors.collegeEmail = 'Enter your college email address.'
    }
    if (!/^\+?[0-9 ()-]{10,16}$/.test(values.phone)) {
      errors.phone = 'Enter a valid 10-digit phone number.'
    }
  }
  if (step === 1) {
    if (values.rollNumber.trim().length < 2) errors.rollNumber = 'Enter your college roll number.'
    if (!values.academicDepartment) errors.academicDepartment = 'Select your department.'
    if (!['2', '3'].includes(String(values.year))) errors.year = 'Choose your year.'
    if (!values.section) errors.section = 'Select your section.'
  }
  if (step === 2) {
    if (!values.primaryPortfolio) errors.primaryPortfolio = 'Choose your first preference.'
    if (!values.secondaryPortfolio) errors.secondaryPortfolio = 'Choose your second preference.'
    if (values.primaryPortfolio === values.secondaryPortfolio && values.primaryPortfolio) {
      errors.secondaryPortfolio = 'Your preferences need to be different.'
    }
    if (values.skills.trim().length < 2) errors.skills = 'Share a few relevant skills.'
    if (values.experience.trim().length < 2) errors.experience = 'Tell us about your experience.'
    if (values.motivation.trim().length < 20) {
      errors.motivation = 'Please write at least a short paragraph (20 characters).'
    }
  }
  return errors
}

function FormField({ label, error, hint, children }) {
  return (
    <motion.label 
      className={'form-field' + (error ? ' has-error' : '')}
      initial={false}
      animate={error ? { x: [0, -4, 4, -4, 4, 0] } : { x: 0 }}
      transition={{ duration: 0.3 }}
    >
      <span>{label}</span>
      {children}
      {hint && <small>{hint}</small>}
      {error && <small className="field-error" role="alert">{error}</small>}
    </motion.label>
  )
}

function getSavedDraft() {
  if (typeof window === 'undefined') return null
  try {
    const saved = localStorage.getItem('aarna_apply_draft')
    return saved ? JSON.parse(saved) : null
  } catch {
    return null
  }
}

export function ApplicationForm({ onSuccess, onReset }) {
  const [step, setStep] = useState(() => getSavedDraft()?.step ?? 0)
  const [direction, setDirection] = useState(1)
  const [values, setValues] = useState(() => getSavedDraft()?.values || initialValues)
  const [errors, setErrors] = useState({})
  const [status, setStatus] = useState({ state: 'idle', message: '' })
  const [submission, setSubmission] = useState(null)
  const reduceMotion = useReducedMotion()
  const isMobile = useIsMobile(768)
  const isInitialMount = useRef(true)
  const formRef = useRef(null)
  const userHasModifiedCurrentStep = useRef(false)

  // Auto-scroll after 4 seconds of inactivity
  useEffect(() => {
    let timeoutId
    let cancelled = false

    const handleInteraction = () => {
      cancelled = true
      clearTimeout(timeoutId)
    }

    // Listen for any manual scrolling or typing to cancel
    window.addEventListener('wheel', handleInteraction, { once: true, passive: true })
    window.addEventListener('touchmove', handleInteraction, { once: true, passive: true })
    window.addEventListener('keydown', handleInteraction, { once: true, passive: true })

    timeoutId = setTimeout(() => {
      if (!cancelled && formRef.current) {
        const y = formRef.current.getBoundingClientRect().top + window.scrollY - 80
        window.scrollTo({ top: y, behavior: 'smooth' })
      }
    }, 4000)

    return () => {
      clearTimeout(timeoutId)
      window.removeEventListener('wheel', handleInteraction)
      window.removeEventListener('touchmove', handleInteraction)
      window.removeEventListener('keydown', handleInteraction)
    }
  }, [step])

  // Wake up backend silently
  useEffect(() => {
    if (!sessionStorage.getItem('aarna_warmup')) {
      api.wakeup()
      sessionStorage.setItem('aarna_warmup', 'true')
    }
  }, [])

  // Auto-save draft
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false
      return
    }
    if (status.state !== 'success' && status.state !== 'submitting') {
      const timer = setTimeout(() => {
        localStorage.setItem('aarna_apply_draft', JSON.stringify({ values, step }))
      }, 400)
      return () => clearTimeout(timer)
    }
  }, [values, step, status.state])

  const goForward = useCallback(() => {
    const nextErrors = validateStep(step, values)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length === 0) {
      setDirection(1)
      userHasModifiedCurrentStep.current = false
      setStep((current) => current + 1)
    }
  }, [step, values])

  // Auto-continue when step is completely valid (except for final submit step)
  useEffect(() => {
    if (step < steps.length - 1 && userHasModifiedCurrentStep.current) {
      const currentErrors = validateStep(step, values)
      if (Object.keys(currentErrors).length === 0) {
        const timer = setTimeout(() => {
          if (userHasModifiedCurrentStep.current) {
            goForward()
          }
        }, 3000)
        return () => clearTimeout(timer)
      }
    }
  }, [values, step, goForward])

  const updateValue = (event) => {
    const { name, value } = event.target
    setValues((current) => ({ ...current, [name]: value }))
    userHasModifiedCurrentStep.current = true
    if (errors[name]) setErrors((current) => ({ ...current, [name]: undefined }))
  }

  const goBack = () => {
    setDirection(-1)
    userHasModifiedCurrentStep.current = false
    setStep((current) => current - 1)
  }

  const submit = async (event) => {
    event.preventDefault()
    const nextErrors = validateStep(2, values)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) return

    setStatus({ state: 'submitting', message: 'Saving your application securely…' })
    try {
      const result = await api.submitApplication({ ...values, year: Number(values.year) })
      setSubmission(result)
      setStatus({ state: 'success', message: result.message })
      localStorage.removeItem('aarna_apply_draft') // Clear on success
      if (onSuccess) onSuccess()
    } catch (error) {
      setErrors(error.fields || {})
      const isNetworkError = !error.status
      setStatus({
        state: 'error',
        message: isNetworkError
          ? 'The server may be waking up. Your details are still here—please try once more.'
          : error.message,
      })
    }
  }

  if (submission) {
    return (
      <motion.div
        className="submission-success"
        initial={reduceMotion ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <CheckCircle2 size={44} aria-hidden="true" />
        <span className="section-kicker">Application received</span>
        <h2>You’re on the AARNA list.</h2>
        <p>{submission.message}</p>
        <p className="submission-id">Reference · {submission.applicationId}</p>
        <button className="button button-quiet" type="button" onClick={() => {
          setSubmission(null)
          setStatus({ state: 'idle', message: '' })
          setStep(0)
          setValues(initialValues)
          if (onReset) onReset()
        }}>
          Submit another application
        </button>
      </motion.div>
    )
  }

  // Step Variants (Slide for mobile, 3D Card Stack for desktop)
  const cardVariants = {
    enter: (dir) => (isMobile ? {
      opacity: 0,
      x: dir > 0 ? 40 : -40,
      y: 0,
      scale: 1,
      rotateX: 0,
      rotateY: 0,
    } : {
      opacity: 0,
      y: dir > 0 ? 30 : -30,
      scale: 0.95,
      rotateX: dir > 0 ? -10 : 10,
      zIndex: 0,
      position: 'relative'
    }),
    center: {
      opacity: 1,
      x: 0,
      y: 0,
      scale: 1,
      rotateX: 0,
      rotateY: 0,
      zIndex: 1,
      position: 'relative'
    },
    exit: (dir) => (isMobile ? {
      opacity: 0,
      x: dir > 0 ? -40 : 40,
      y: 0,
      scale: 1,
      rotateX: 0,
      rotateY: 0,
    } : {
      opacity: 0,
      y: dir > 0 ? 60 : -60,
      scale: 0.9,
      rotateX: dir > 0 ? 15 : -15,
      rotateY: dir > 0 ? -8 : 8,
      zIndex: 2,
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0
    })
  }

  return (
    <form className="application-form" onSubmit={submit} noValidate ref={formRef}>
      <ol className="form-progress" aria-label="Application progress">
        {steps.map((label, index) => {
          const isComplete = index < step;
          const isCurrent = index === step;
          return (
            <li key={label} className={isCurrent ? 'is-current' : isComplete ? 'is-complete' : ''}>
              <span className="progress-marker">
                {isComplete ? (
                  <motion.div
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", bounce: 0.4 }}
                  >
                    <CheckCircle2 size={16} strokeWidth={3} />
                  </motion.div>
                ) : (
                  <span>{index + 1}</span>
                )}
                {isCurrent && !reduceMotion && (
                  <motion.div
                    className="progress-indicator-active"
                    layoutId="active-step-indicator"
                    transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                  />
                )}
              </span>
              <span className="step-label-text">{label}</span>
            </li>
          )
        })}
      </ol>

      <motion.div layout className="form-steps-container" transition={{ duration: 0.4, ease: "easeOut" }}>
        <AnimatePresence initial={false} custom={direction}>
          <motion.div
            className="form-step"
            key={step}
            custom={direction}
            variants={reduceMotion ? {} : cardVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={isMobile ? { duration: 0.25, ease: 'easeInOut' } : { type: 'spring', stiffness: 280, damping: 26 }}
            style={{ perspective: isMobile ? 'none' : 1000 }}
          >
            {step === 0 && (
              <>
                <div className="step-heading">
                  <span className="section-kicker">Step 01</span>
                  <h2>Let’s begin with you.</h2>
                  <p>We use your email and phone only to make sure every student applies once.</p>
                </div>
                <div className="form-grid">
                  <FormField label="Full name" name="fullName" error={errors.fullName}>
                    <input name="fullName" value={values.fullName} onChange={updateValue} autoComplete="name" />
                  </FormField>
                  <FormField label="College email" name="collegeEmail" error={errors.collegeEmail} hint="Use your official college address.">
                    <input name="collegeEmail" type="email" value={values.collegeEmail} onChange={updateValue} autoComplete="email" />
                  </FormField>
                  <FormField label="Phone number" name="phone" error={errors.phone} hint="10-digit Indian mobile number">
                    <input name="phone" type="tel" inputMode="numeric" value={values.phone} onChange={updateValue} autoComplete="tel" />
                  </FormField>
                </div>
              </>
            )}

            {step === 1 && (
              <>
                <div className="step-heading">
                  <span className="section-kicker">Step 02</span>
                  <h2>Your college context.</h2>
                  <p>A little detail helps the club organise applications with care.</p>
                </div>
                <div className="form-grid">
                  <FormField label="Roll number" name="rollNumber" error={errors.rollNumber}>
                    <input name="rollNumber" value={values.rollNumber} onChange={updateValue} />
                  </FormField>
                  <FormField label="Academic department" name="academicDepartment" error={errors.academicDepartment}>
                    <select name="academicDepartment" value={values.academicDepartment} onChange={updateValue}>
                      <option value="">Select department</option>
                      <option value="CSE">CSE</option>
                      <option value="CSM">CSM</option>
                      <option value="CSC">CSC</option>
                      <option value="CSD">CSD</option>
                      <option value="CSB">CSB</option>
                      <option value="IT">IT</option>
                      <option value="ECE">ECE</option>
                      <option value="EEE">EEE</option>
                      <option value="CIVIL">CIVIL</option>
                      <option value="MECH">MECH</option>
                    </select>
                  </FormField>
                  <FormField label="Year" name="year" error={errors.year}>
                    <select name="year" value={values.year} onChange={updateValue}>
                      <option value="">Select your year</option>
                      <option value="2">Second year</option>
                      <option value="3">Third year</option>
                    </select>
                  </FormField>
                  <FormField label="Section" name="section" error={errors.section}>
                    <select name="section" value={values.section} onChange={updateValue}>
                      <option value="">Select section</option>
                      <option value="A">Section A</option>
                      <option value="B">Section B</option>
                      <option value="C">Section C</option>
                      <option value="D">Section D</option>
                      <option value="E">Section E</option>
                      <option value="F">Section F</option>
                    </select>
                  </FormField>
                </div>
              </>
            )}

            {step === 2 && (
              <>
                <div className="step-heading">
                  <span className="section-kicker">Step 03</span>
                  <h2>Where would you make your mark?</h2>
                  <p>Rank two distinct teams, then show us what you would bring to the room.</p>
                </div>
                <div className="form-grid">
                  <FormField label="First portfolio preference" name="primaryPortfolio" error={errors.primaryPortfolio}>
                    <select name="primaryPortfolio" value={values.primaryPortfolio} onChange={updateValue}>
                      <option value="">Choose your first preference</option>
                      {portfolios.map((portfolio) => <option key={portfolio.name} value={portfolio.name}>{portfolio.name}</option>)}
                    </select>
                  </FormField>
                  <FormField label="Second portfolio preference" name="secondaryPortfolio" error={errors.secondaryPortfolio}>
                    <select name="secondaryPortfolio" value={values.secondaryPortfolio} onChange={updateValue}>
                      <option value="">Choose your second preference</option>
                      {portfolios.map((portfolio) => <option key={portfolio.name} value={portfolio.name}>{portfolio.name}</option>)}
                    </select>
                  </FormField>
                  <FormField label="Skills" name="skills" error={errors.skills} hint="Tools, strengths, or interests are all welcome.">
                    <input name="skills" value={values.skills} onChange={updateValue} placeholder="e.g. Figma, React, storytelling" />
                  </FormField>
                </div>
                <div className="form-grid form-grid-single">
                  <FormField label="Previous experience" name="experience" error={errors.experience}>
                    <textarea name="experience" value={values.experience} onChange={updateValue} rows="4" placeholder="Share projects, volunteering, events, or experiences that shaped you." />
                  </FormField>
                  <FormField label="Why do you want to join AARNA?" name="motivation" error={errors.motivation}>
                    <textarea name="motivation" value={values.motivation} onChange={updateValue} rows="5" placeholder="A few honest lines about what you would like to learn, make, or lead." />
                  </FormField>
                </div>
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </motion.div>

      {status.state === 'error' && <p className="form-alert" role="alert">{status.message}</p>}
      <div className="form-actions">
        {step > 0 ? (
          <button className="button button-quiet" type="button" onClick={goBack}>
            <ArrowLeft size={17} /> Back
          </button>
        ) : <span />}
        {step < steps.length - 1 ? (
          <button className="button button-primary" type="button" onClick={goForward}>
            Continue <ArrowRight size={17} />
          </button>
        ) : (
          <button className="button button-primary" type="submit" disabled={status.state === 'submitting'}>
            {status.state === 'submitting' ? <><LoaderCircle className="spin" size={17} /> Saving</> : <>Send application <ArrowRight size={17} /></>}
          </button>
        )}
      </div>
    </form>
  )
}
