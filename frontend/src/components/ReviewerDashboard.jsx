/** Read-only reviewer workspace; authentication stays in component memory by design. */

import { LoaderCircle, LogOut, Search, ShieldCheck, X } from 'lucide-react'
import { useCallback, useState } from 'react'
import { api } from '../api/client'
import { portfolios } from '../data/clubContent'

function formatDate(value) {
  if (!value) return '—'
  return new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Kolkata',
  }).format(new Date(value))
}

function DashboardLogin({ onLogin }) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (event) => {
    event.preventDefault()
    setLoading(true)
    setError('')
    try {
      const session = await api.createReviewerSession(password)
      onLogin(session.token)
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="dashboard-login">
      <ShieldCheck size={38} aria-hidden="true" />
      <span className="section-kicker">Reviewer access</span>
      <h2>Private, read-only workspace.</h2>
      <p>Enter the AARNA reviewer password to view applications and sync health.</p>
      <form onSubmit={submit}>
        <label>
          <span>Reviewer password</span>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
            required
          />
        </label>
        {error && <p className="form-alert" role="alert">{error}</p>}
        <button className="button button-primary" type="submit" disabled={loading}>
          {loading ? <><LoaderCircle className="spin" size={17} /> Checking</> : 'Enter dashboard'}
        </button>
      </form>
    </div>
  )
}

function SyncSummary({ sync }) {
  const lastRun = sync?.lastRun
  return (
    <div className="sync-summary">
      <div>
        <span>Pending export</span>
        <strong>{sync?.pendingCount ?? '—'}</strong>
      </div>
      <div>
        <span>Last batch</span>
        <strong className={lastRun?.status === 'failed' ? 'is-danger' : ''}>
          {lastRun ? lastRun.status : 'No run yet'}
        </strong>
      </div>
      <div>
        <span>Last checked</span>
        <strong>{formatDate(lastRun?.completedAt)}</strong>
      </div>
    </div>
  )
}

function ApplicationDrawer({ application, onClose }) {
  if (!application) return null
  const rows = [
    ['Email', application.collegeEmail],
    ['Phone', application.phone],
    ['Roll number', application.rollNumber],
    ['Department', application.academicDepartment],
    ['Year', application.year === 1 ? 'First year' : 'Second year'],
    ['Section', application.section || '—'],
    ['First preference', application.primaryPortfolio],
    ['Second preference', application.secondaryPortfolio],
    ['Skills', application.skills],
    ['Experience', application.experience],
    ['Motivation', application.motivation],
    ['Sheets status', application.syncStatus],
    ['Submitted', formatDate(application.submittedAt)],
  ]
  return (
    <div className="drawer-backdrop" role="presentation" onMouseDown={onClose}>
      <aside className="application-drawer" role="dialog" aria-modal="true" aria-labelledby="application-name" onMouseDown={(event) => event.stopPropagation()}>
        <button className="drawer-close" type="button" onClick={onClose} aria-label="Close details"><X size={18} /></button>
        <span className="section-kicker">Application details</span>
        <h2 id="application-name">{application.fullName}</h2>
        <dl>
          {rows.map(([label, value]) => (
            <div key={label}>
              <dt>{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
      </aside>
    </div>
  )
}

export function ReviewerDashboard() {
  const [token, setToken] = useState('')
  const [applications, setApplications] = useState([])
  const [sync, setSync] = useState(null)
  const [selected, setSelected] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [filters, setFilters] = useState({ q: '', year: '', portfolio: '', syncState: '' })

  const load = useCallback(async (activeToken, activeFilters = filters) => {
    if (!activeToken) return
    setLoading(true)
    setError('')
    try {
      const [applicationResponse, syncResponse] = await Promise.all([
        api.getApplications(activeToken, { ...activeFilters, limit: '25', offset: '0' }),
        api.getSyncStatus(activeToken),
      ])
      setApplications(applicationResponse.applications)
      setSync(syncResponse)
    } catch (requestError) {
      if (requestError.status === 401) setToken('')
      setError(requestError.message)
    } finally {
      setLoading(false)
    }
  }, [filters])

  const handleLogin = (nextToken) => {
    setToken(nextToken)
    void load(nextToken)
  }

  const submitFilters = (event) => {
    event.preventDefault()
    setSelected(null)
    load(token)
  }

  const changeFilter = (event) => {
    const { name, value } = event.target
    setFilters((current) => ({ ...current, [name]: value }))
  }

  if (!token) return <DashboardLogin onLogin={handleLogin} />

  return (
    <div className="reviewer-dashboard">
      <div className="dashboard-heading">
        <div>
          <span className="section-kicker">AARNA reviewers</span>
          <h2>Applications, in one calm place.</h2>
        </div>
        <button className="button button-quiet" type="button" onClick={() => setToken('')}><LogOut size={16} /> Sign out</button>
      </div>
      <SyncSummary sync={sync} />
      <form className="reviewer-filters" onSubmit={submitFilters}>
        <label className="search-control">
          <Search size={17} aria-hidden="true" />
          <input name="q" value={filters.q} onChange={changeFilter} placeholder="Search name, email, or roll number" />
        </label>
        <select name="year" value={filters.year} onChange={changeFilter} aria-label="Filter by year">
          <option value="">All years</option>
          <option value="1">First year</option>
          <option value="2">Second year</option>
        </select>
        <select name="portfolio" value={filters.portfolio} onChange={changeFilter} aria-label="Filter by portfolio">
          <option value="">All portfolios</option>
          {portfolios.map((portfolio) => <option key={portfolio.name} value={portfolio.name}>{portfolio.name}</option>)}
        </select>
        <select name="syncState" value={filters.syncState} onChange={changeFilter} aria-label="Filter by Sheets sync">
          <option value="">All sync states</option>
          <option value="pending">Pending export</option>
          <option value="synced">Synced</option>
        </select>
        <button className="button button-primary" type="submit">Filter</button>
      </form>
      {error && <p className="form-alert" role="alert">{error}</p>}
      <div className="reviewer-table-wrap">
        {loading ? (
          <div className="dashboard-loading"><LoaderCircle className="spin" size={23} /> Loading applications</div>
        ) : applications.length === 0 ? (
          <div className="empty-dashboard">No applications match these filters yet.</div>
        ) : (
          <table className="reviewer-table">
            <thead>
              <tr><th>Applicant</th><th>Year</th><th>Preferences</th><th>Submitted</th><th>Sheets</th></tr>
            </thead>
            <tbody>
              {applications.map((application) => (
                <tr key={application.applicationId} onClick={() => setSelected(application)} tabIndex="0" onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') setSelected(application)
                }}>
                  <td><strong>{application.fullName}</strong><span>{application.collegeEmail}</span></td>
                  <td>{application.year === 1 ? 'First' : 'Second'}</td>
                  <td>{application.primaryPortfolio}<span>{application.secondaryPortfolio}</span></td>
                  <td>{formatDate(application.submittedAt)}</td>
                  <td><span className={'sync-badge ' + application.syncStatus}>{application.syncStatus}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <ApplicationDrawer application={selected} onClose={() => setSelected(null)} />
    </div>
  )
}
