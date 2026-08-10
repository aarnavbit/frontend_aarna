import { useState } from 'react'
import { ApplicationForm } from '../components/ApplicationForm'

export function ApplyPage() {
  const [isSubmitted, setIsSubmitted] = useState(false)

  return (
    <section className={`apply-page section-wrap ${isSubmitted ? 'is-submitted' : ''}`}>
      {!isSubmitted && (
        <div className="apply-intro">
          <span className="announcement">OC Recruitment 2026 · Application</span>
          <h1>Your ideas have a seat here.</h1>
          <p>
            Take a few minutes to tell us who you are and where you would like to contribute.
            Your application is saved securely before it is shared with the AARNA reviewers.
          </p>
        </div>
      )}
      <ApplicationForm 
        onSuccess={() => setIsSubmitted(true)} 
        onReset={() => setIsSubmitted(false)} 
      />
      {!isSubmitted && (
        <aside className="application-note">
          <strong>A note on your data</strong>
          <p>One application is allowed per college email and phone number. AARNA reviewers receive new applications in their Google Sheet within 15 minutes.</p>
        </aside>
      )}
    </section>
  )
}
