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

const AARNA_LOGO_SRC = '/images/previous-work/raw/02_web_app_design.png'

// ============================================================
// GLOBAL TASK LINKS CONFIGURATION
// Paste your links here. If left empty (''), clicking the button
// will not perform any action.
// ============================================================
const TASK_LINKS = {
  VIEW_YOUR_TASK: '/docs/Aarna_OC_tasks.pdf',   // 'View your task' PDF path or URL
  SUBMIT_YOUR_TASK: '', // Paste 'Submit your task' URL here (e.g. 'https://forms.gle/...')
}

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

function handleTaskAction(url) {
  const targetUrl = (typeof url === 'string' ? url : '').trim()

  if (!targetUrl || targetUrl === '#') {
    return
  }

  if (targetUrl === 'Aarna_OC_tasks' || targetUrl === '/docs/Aarna_OC_tasks.pdf') {
    window.open('/docs/Aarna_OC_tasks.pdf', '_blank', 'noopener,noreferrer')
    return
  }

  if (targetUrl.startsWith('http://') || targetUrl.startsWith('https://') || targetUrl.startsWith('/') || targetUrl.endsWith('.pdf')) {
    window.open(targetUrl, '_blank', 'noopener,noreferrer')
  } else {
    window.location.href = targetUrl
  }
}

export function ApplyPage() {
  return (
    <section className="apply-closed-page">
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

          height: 100dvh;
          width: 100%;
          box-sizing: border-box;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: clamp(6px, 1.8vh, 20px) clamp(10px, 3vw, 20px);

          background-image:
            linear-gradient(45deg, var(--page-bg-b) 25%, transparent 25%, transparent 75%, var(--page-bg-b) 75%),
            linear-gradient(45deg, var(--page-bg-b) 25%, transparent 25%, transparent 75%, var(--page-bg-b) 75%);
          background-color: var(--page-bg-a);
          background-size: 220px 220px;
          background-position: 0 0, 110px 110px;
          transition: background-color 0.25s ease;
        }

        :root[data-theme='dark'] .apply-closed-page,
        [data-theme='dark'] .apply-closed-page {
          --purple: #6b4fa0;
          --orange: #a8452f;
          --cream: #211307;
          --brown: #f3e3d3;
          --page-bg-a: #1a0f08;
          --page-bg-b: #2a1a3d;
          --card-shadow: rgba(0, 0, 0, 0.5);
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
          gap: clamp(6px, 1.3vh, 14px);
          background: var(--cream);
          border-radius: clamp(16px, 2.6vh, 36px);
          padding: clamp(14px, 2.4vh, 32px) clamp(14px, 3.5vw, 38px);
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
          font-size: clamp(1.35rem, 3.8vh, 2.3rem);
          font-weight: 800;
          text-align: center;
          margin: 0;
          letter-spacing: -0.02em;
        }

        .apply-closed-block {
          display: flex;
          align-items: stretch;
          gap: clamp(8px, 1.6vw, 16px);
          background: var(--purple);
          border-radius: clamp(12px, 1.6vh, 22px);
          padding: clamp(8px, 1.4vh, 16px);
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
          border-radius: clamp(9px, 1.3vh, 16px);
          padding: clamp(4px, 1vh, 12px) clamp(8px, 1.6vw, 16px);
          min-width: clamp(70px, 11vw, 100px);
          text-align: center;
          transition: background-color 0.25s ease;
        }

        .apply-closed-day {
          font-weight: 800;
          font-size: clamp(0.62rem, 1.4vh, 0.9rem);
          letter-spacing: 0.06em;
        }

        .apply-closed-datenum {
          font-weight: 800;
          font-size: clamp(1rem, 2.6vh, 1.75rem);
          line-height: 1.1;
          margin: 1px 0;
          white-space: nowrap;
        }

        .apply-closed-time {
          font-weight: 700;
          font-size: clamp(0.58rem, 1.2vh, 0.8rem);
        }

        .apply-closed-info {
          display: flex;
          flex-direction: column;
          justify-content: center;
          min-width: 0;
        }

        .apply-closed-info h2 {
          margin: 0 0 3px;
          font-size: clamp(0.78rem, 1.8vh, 1.15rem);
          font-weight: 800;
          line-height: 1.15;
        }

        .apply-closed-tag {
          margin: 0;
          font-size: clamp(0.55rem, 1.2vh, 0.78rem);
          font-weight: 700;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          opacity: 0.85;
        }

        .apply-closed-actions {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: clamp(8px, 1.8vw, 16px);
          width: 100%;
        }

        .apply-action-btn {
          flex: 1;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          text-align: center;
          font-family: inherit;
          font-weight: 800;
          font-size: clamp(0.72rem, 1.6vh, 0.95rem);
          letter-spacing: 0.02em;
          min-height: 44px;
          padding: clamp(7px, 1.3vh, 12px) clamp(10px, 2vw, 16px);
          border-radius: clamp(10px, 1.6vh, 18px);
          border: 2px solid var(--brown);
          cursor: pointer;
          text-decoration: none;
          transition: transform 0.15s ease, box-shadow 0.15s ease, background-color 0.25s ease, color 0.25s ease;
          box-shadow: 4px 4px 0 var(--brown);
          user-select: none;
        }

        .apply-action-btn:hover {
          transform: translate(-1px, -1px);
          box-shadow: 5px 5px 0 var(--brown);
        }

        .apply-action-btn:active {
          transform: translate(2px, 2px);
          box-shadow: 2px 2px 0 var(--brown);
        }

        .view-task-btn {
          background: linear-gradient(135deg, var(--purple) 0%, var(--orange) 100%);
          color: var(--brown);
        }

        .view-task-btn:hover {
          background: linear-gradient(135deg, var(--orange) 0%, var(--purple) 100%);
        }

        .submit-task-btn {
          background: linear-gradient(135deg, var(--orange) 0%, var(--purple) 100%);
          color: var(--cream);
        }

        :root[data-theme='dark'] .submit-task-btn,
        [data-theme='dark'] .submit-task-btn {
          color: var(--brown);
        }

        .apply-closed-motto {
          text-align: center;
          font-weight: 800;
          font-size: clamp(0.58rem, 1.3vh, 0.82rem);
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
          font-size: clamp(0.82rem, 2.2vh, 1.3rem);
          letter-spacing: -0.01em;
        }

        .apply-closed-logo {
          width: clamp(30px, 5.5vh, 50px);
          height: clamp(30px, 5.5vh, 50px);
          object-fit: contain;
          flex-shrink: 0;
        }

        @media (max-width: 420px) {
          .apply-closed-info h2 { font-size: clamp(0.72rem, 1.7vh, 1rem); }
          .apply-action-btn { font-size: clamp(0.68rem, 1.4vh, 0.85rem); padding: 7px 8px; min-height: 44px; }
        }

        @media (max-height: 480px) {
          .apply-closed-page {
            height: auto;
            min-height: 100dvh;
            overflow-y: auto;
            padding: 20px 10px;
          }
          .apply-closed-card {
            height: auto;
            max-height: none;
          }
        }
      `}</style>

      <div className="apply-closed-card">
        <div className="apply-closed-topbar">
          <h1 className="apply-closed-title">Recruitments</h1>
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

        <div className="apply-closed-actions">
          <button
            type="button"
            className="apply-action-btn view-task-btn"
            onClick={() => handleTaskAction(TASK_LINKS.VIEW_YOUR_TASK)}
          >
            View your task
          </button>
          {/* <button
            type="button"
            className="apply-action-btn submit-task-btn"
            onClick={() => handleTaskAction(TASK_LINKS.SUBMIT_YOUR_TASK)}
          >
            Submit your task
          </button> */}
        </div>

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