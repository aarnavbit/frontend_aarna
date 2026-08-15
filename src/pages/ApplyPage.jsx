// import { useState } from 'react'
// import { ApplicationForm } from '../components/ApplicationForm'

// export function ApplyPage() {
//   const [isSubmitted, setIsSubmitted] = useState(false)

//   return (
//     <section className={`apply-page section-wrap ${isSubmitted ? 'is-submitted' : ''}`}>
//       {!isSubmitted && (
//         <div className="apply-intro">
//           <span className="announcement">OC Recruitment 2026 · Application</span>
//           <h1>Your ideas have a seat here.</h1>
//           <p>
//             Take a few minutes to tell us who you are and where you would like to contribute.
//             Your application is saved securely before it is shared with the AARNA reviewers.
//           </p>
//         </div>
//       )}
//       <ApplicationForm 
//         onSuccess={() => setIsSubmitted(true)} 
//         onReset={() => setIsSubmitted(false)} 
//       />
//     </section>
//   )
// }
// ============================================================
// AI NOTE — READ BEFORE EDITING (context for future changes)
// ------------------------------------------------------------
// WHY THIS FILE CHANGED:
// AARNA OC Recruitment 2026 registrations have closed. This page
// no longer accepts new applications, so <ApplicationForm> has
// been intentionally REMOVED and replaced with a static recap of
// the recruitment timeline (register → submit tasks → interviews),
// matching what was originally promoted on the poster.
//
// DO NOT re-import or re-render <ApplicationForm> here unless a
// new recruitment cycle officially reopens. If that happens,
// restore the original form-based version of this page instead
// of bolting the form back onto this closed-state markup.
//
// TIMELINE DATA SOURCE OF TRUTH:
// The three cards below (dates, times, mediums) mirror the
// official "Recruitments" poster exactly. If dates ever change,
// update the TIMELINE array — do not hardcode new dates inline
// in the JSX, keep everything driven from that single array.
//
// NO-SCROLL / FIT-TO-VIEWPORT CONSTRAINT (IMPORTANT):
// This page is required to show all 3 cards + header + footer
// within one screen, with NO vertical scrolling, on both mobile
// and desktop. To achieve this every size (title, card padding,
// gaps, logo) is driven by `clamp(min, vh-based-preferred, max)`
// instead of fixed rem values, and the outer wrapper uses
// `height: 100dvh; overflow: hidden;`. If you add a 4th card or
// more copy, you MUST re-check on a short mobile viewport
// (~650px tall) that nothing overflows — shrink the clamp()
// values further rather than letting content scroll.
//
// LIGHT / DARK MODE:
// Theme is local component state (`theme`), toggled by the
// button in the top-right of the card. Colors for both themes
// are defined as CSS custom properties on `.apply-closed-page`
// and swapped via the `data-theme="dark"` attribute. No external
// theme/context provider is used — kept fully self-contained so
// this single file can be dropped into a coupled codebase as-is.
//
// DESIGN INTENT:
// Visual style is a deliberate replica of the official AARNA
// poster (checkerboard purple/orange background, cream card,
// purple info blocks with hard offset shadows, bold brown text).
//
// SINGLE-FILE ON PURPOSE:
// All CSS is inlined via a <style> tag inside this component
// (scoped under `.apply-closed-*` class names only) so this
// whole file can be copy-pasted as-is without a separate .css
// file or touching any other page/shared class.
//
// The center emblem is the real AARNA logo asset, served from:
//   public/images/previous-work/raw/02_web_app_design.png
// Referenced as a root-relative public path ("/images/...") —
// NOT imported — because it lives in /public, not /src.
// If that file is ever moved/renamed, update AARNA_LOGO_SRC below.
// ============================================================

import { useState } from 'react'

const AARNA_LOGO_SRC = '/images/previous-work/raw/02_web_app_design.png'

const TIMELINE = [
  {
    day: 'WED',
    date: '15/08',
    time: '9:00 PM',
    title: 'Last Date to Register for Recruitments',
    tag: 'WEBSITE',
  },
  {
    day: 'WED',
    date: '17/08',
    time: '12:00PM',
    title: 'Last Date to submit their tasks',
    tag: 'GOOGLE FORMS',
  },
  {
    day: 'WED',
    date: '18-19',
    time: 'AUG',
    title: 'Online interviews',
    tag: 'VIRTUAL',
  },
]

export function ApplyPage() {
  const [theme, setTheme] = useState('light')

  return (
    <section className="apply-closed-page" data-theme={theme}>
      <style>{`
        .apply-closed-page {
          /* ---- LIGHT THEME (default) ---- */
          --purple: #c9aef0;
          --orange: #f4795b;
          --cream: #fbeee0;
          --brown: #3b2412;
          --page-bg-a: #f4795b;
          --page-bg-b: #c9aef0;
          --card-shadow: rgba(0, 0, 0, 0.08);
          --toggle-bg: #fbeee0;
          --toggle-fg: #3b2412;

          height: 100dvh;
          width: 100%;
          box-sizing: border-box;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: clamp(8px, 2vh, 24px) clamp(10px, 3vw, 20px);

          background-image:
            linear-gradient(45deg, var(--page-bg-b) 25%, transparent 25%, transparent 75%, var(--page-bg-b) 75%),
            linear-gradient(45deg, var(--page-bg-b) 25%, transparent 25%, transparent 75%, var(--page-bg-b) 75%);
          background-color: var(--page-bg-a);
          background-size: 220px 220px;
          background-position: 0 0, 110px 110px;
          transition: background-color 0.25s ease;
        }

        .apply-closed-page[data-theme='dark'] {
          --purple: #6b4fa0;
          --orange: #a8452f;
          --cream: #211307;
          --brown: #f3e3d3;
          --page-bg-a: #1a0f08;
          --page-bg-b: #2a1a3d;
          --card-shadow: rgba(0, 0, 0, 0.5);
          --toggle-bg: #211307;
          --toggle-fg: #f3e3d3;
        }

        .apply-closed-page * { box-sizing: border-box; }

        .apply-closed-card {
          position: relative;
          width: 100%;
          max-width: 640px;
          height: 100%;
          max-height: 100%;
          display: flex;
          flex-direction: column;
          justify-content: center;
          gap: clamp(6px, 1.6vh, 16px);
          background: var(--cream);
          border-radius: clamp(18px, 3vh, 40px);
          padding: clamp(16px, 3vh, 40px) clamp(16px, 4vw, 44px);
          box-shadow: 0 12px 0 var(--card-shadow);
          font-family: 'Quicksand', 'Poppins', system-ui, sans-serif;
          color: var(--brown);
          overflow: hidden;
          transition: background-color 0.25s ease, color 0.25s ease;
        }

        .apply-closed-topbar {
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
        }

        .apply-closed-title {
          font-size: clamp(1.5rem, 4.4vh, 2.6rem);
          font-weight: 800;
          text-align: center;
          margin: 0;
          letter-spacing: -0.02em;
        }

        .theme-toggle {
          position: absolute;
          right: 0;
          top: 50%;
          transform: translateY(-50%);
          border: none;
          cursor: pointer;
          background: var(--toggle-bg);
          color: var(--toggle-fg);
          font-weight: 700;
          font-size: clamp(0.65rem, 1.6vh, 0.8rem);
          letter-spacing: 0.03em;
          border-radius: 999px;
          padding: clamp(6px, 1.2vh, 10px) clamp(10px, 2vw, 16px);
          box-shadow: 2px 2px 0 var(--brown);
        }

        .apply-closed-block {
          display: flex;
          align-items: stretch;
          gap: clamp(10px, 2vw, 20px);
          background: var(--purple);
          border-radius: clamp(14px, 2vh, 26px);
          padding: clamp(10px, 1.8vh, 22px);
          box-shadow: 5px 5px 0 var(--brown);
          transition: background-color 0.25s ease;
        }

        .apply-closed-date {
          flex: 0 0 auto;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background: var(--cream);
          border-radius: clamp(10px, 1.6vh, 20px);
          padding: clamp(6px, 1.2vh, 16px) clamp(10px, 2vw, 20px);
          min-width: clamp(78px, 12vw, 108px);
          text-align: center;
          transition: background-color 0.25s ease;
        }

        .apply-closed-day {
          font-weight: 800;
          font-size: clamp(0.65rem, 1.6vh, 0.95rem);
          letter-spacing: 0.06em;
        }

        .apply-closed-datenum {
          font-weight: 800;
          font-size: clamp(1.1rem, 3.2vh, 2rem);
          line-height: 1.1;
          margin: 1px 0;
          white-space: nowrap;
        }

        .apply-closed-time {
          font-weight: 700;
          font-size: clamp(0.6rem, 1.4vh, 0.85rem);
        }

        .apply-closed-info {
          display: flex;
          flex-direction: column;
          justify-content: center;
          min-width: 0;
        }

        .apply-closed-info h2 {
          margin: 0 0 4px;
          font-size: clamp(0.85rem, 2.2vh, 1.3rem);
          font-weight: 800;
          line-height: 1.15;
        }

        .apply-closed-tag {
          margin: 0;
          font-size: clamp(0.6rem, 1.4vh, 0.82rem);
          font-weight: 700;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          opacity: 0.85;
        }

        .apply-closed-motto {
          text-align: center;
          font-weight: 800;
          font-size: clamp(0.6rem, 1.6vh, 0.9rem);
          letter-spacing: 0.03em;
          margin: 0;
        }

        .apply-closed-footer {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: clamp(8px, 2vw, 18px);
        }

        .apply-closed-team {
          font-weight: 800;
          font-size: clamp(0.9rem, 2.8vh, 1.5rem);
          letter-spacing: -0.01em;
        }

        .apply-closed-logo {
          width: clamp(36px, 7vh, 60px);
          height: clamp(36px, 7vh, 60px);
          object-fit: contain;
          flex-shrink: 0;
        }

        @media (max-width: 420px) {
          .apply-closed-info h2 { font-size: clamp(0.78rem, 2vh, 1.1rem); }
        }
      `}</style>

      <div className="apply-closed-card">
        <div className="apply-closed-topbar">
          <h1 className="apply-closed-title">Recruitments</h1>
          <button
            type="button"
            className="theme-toggle"
            onClick={() => setTheme((t) => (t === 'light' ? 'dark' : 'light'))}
          >
            {theme === 'light' ? '🌙 DARK' : '☀️ LIGHT'}
          </button>
        </div>

        {TIMELINE.map((item) => (
          <div className="apply-closed-block" key={item.title}>
            <div className="apply-closed-date">
              <span className="apply-closed-day">{item.day}</span>
              <span className="apply-closed-datenum">{item.date}</span>
              <span className="apply-closed-time">{item.time}</span>
            </div>
            <div className="apply-closed-info">
              <h2>{item.title}</h2>
              <p className="apply-closed-tag">{item.tag}</p>
            </div>
          </div>
        ))}

        <p className="apply-closed-motto">TURNING PASSIONS INTO PROFITS</p>

        <div className="apply-closed-footer">
          <span className="apply-closed-team">TEAM</span>
          <img
            src={AARNA_LOGO_SRC}
            alt="AARNA logo"
            className="apply-closed-logo"
          />
          <span className="apply-closed-team">AARNA</span>
        </div>
      </div>
    </section>
  )
}