/** Accessible three-step OC application form with JSON submission and recovery-friendly errors. */

import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { ArrowLeft, ArrowRight, CheckCircle2, LoaderCircle } from 'lucide-react'
import { useState } from 'react'
import { api } from '../api/client'
import { portfolios } from '../data/clubContent'

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
    if (values.academicDepartment.trim().length < 2) {
      errors.academicDepartment = 'Enter your academic department.'
    }
    if (!['1', '2'].includes(String(values.year))) errors.year = 'Choose your year.'
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
    <label className={'form-field' + (error ? ' has-error' : '')}>
      <span>{label}</span>
      {children}
      {hint && <small>{hint}</small>}
      {error && <small className="field-error" role="alert">{error}</small>}
    </label>
  )
}

export function ApplicationForm() {
  const [step, setStep] = useState(0)
  const [values, setValues] = useState(initialValues)
  const [errors, setErrors] = useState({})
  const [status, setStatus] = useState({ state: 'idle', message: '' })
  const [submission, setSubmission] = useState(null)
  const reduceMotion = useReducedMotion()

  const updateValue = (event) => {
    const { name, value } = event.target
    setValues((current) => ({ ...current, [name]: value }))
    setErrors((current) => ({ ...current, [name]: undefined }))
  }

  const goForward = () => {
    const nextErrors = validateStep(step, values)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length === 0) setStep((current) => current + 1)
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
        }}>
          Submit another application
        </button>
      </motion.div>
    )
  }

  return (
    <form className="application-form" onSubmit={submit} noValidate>
      <ol className="form-progress" aria-label="Application progress">
        {steps.map((label, index) => (
          <li key={label} className={index === step ? 'is-current' : index < step ? 'is-complete' : ''}>
            <span>{index < step ? '✓' : index + 1}</span>{label}
          </li>
        ))}
      </ol>

      <AnimatePresence mode="wait">
        <motion.div
          className="form-step"
          key={step}
          initial={reduceMotion ? false : { opacity: 0, x: 12 }}
          animate={{ opacity: 1, x: 0 }}
          exit={reduceMotion ? undefined : { opacity: 0, x: -12 }}
          transition={{ duration: 0.22 }}
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
                  <input name="academicDepartment" value={values.academicDepartment} onChange={updateValue} placeholder="e.g. CSBS" />
                </FormField>
                <FormField label="Year" name="year" error={errors.year}>
                  <select name="year" value={values.year} onChange={updateValue}>
                    <option value="">Select your year</option>
                    <option value="1">First year</option>
                    <option value="2">Second year</option>
                  </select>
                </FormField>
                <FormField label="Section (optional)" name="section" error={errors.section}>
                  <input name="section" value={values.section} onChange={updateValue} placeholder="e.g. A" />
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

      {status.state === 'error' && <p className="form-alert" role="alert">{status.message}</p>}
      <div className="form-actions">
        {step > 0 ? (
          <button className="button button-quiet" type="button" onClick={() => setStep((current) => current - 1)}>
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
