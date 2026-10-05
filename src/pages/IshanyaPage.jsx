import { useState, useCallback } from 'react'
import { ishanyaApi } from '../api/ishanyaApi'
import './IshanyaPage.css'

const TEAM_MEMBER_COUNT = 3
const ADDITIONAL_MEMBERS = TEAM_MEMBER_COUNT - 1
const FIXED_AMOUNT = 150
const AMOUNT_PER_MEMBER = 50

function createEmptyMembers() {
  return Array.from({ length: ADDITIONAL_MEMBERS }, () => ({
    name: '',
    roll_no: '',
    department: '',
    sec: '',
    email: '',
    phone: '',
  }))
}

export function IshanyaPage() {
  const [activeTab, setActiveTab] = useState('register')

  // --- Register state ---
  const [teamName, setTeamName] = useState('')
  const [leaderName, setLeaderName] = useState('')
  const [leaderRollNo, setLeaderRollNo] = useState('')
  const [leaderDept, setLeaderDept] = useState('')
  const [leaderSec, setLeaderSec] = useState('')
  const [leaderEmail, setLeaderEmail] = useState('')
  const [leaderPhone, setLeaderPhone] = useState('')
  const [members, setMembers] = useState(createEmptyMembers)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  // --- Payment modal state ---
  const [showModal, setShowModal] = useState(false)
  const [modalStep, setModalStep] = useState('qr') // 'qr' | 'utr' | 'done'
  const [registrationId, setRegistrationId] = useState('')
  const [utrNumber, setUtrNumber] = useState('')
  const [screenshotFile, setScreenshotFile] = useState(null)
  const [paymentSubmitting, setPaymentSubmitting] = useState(false)
  const [paymentError, setPaymentError] = useState('')
  const [copied, setCopied] = useState(false)

  // --- Status tab state ---
  const [statusId, setStatusId] = useState('')
  const [statusData, setStatusData] = useState(null)
  const [statusLoading, setStatusLoading] = useState(false)
  const [statusError, setStatusError] = useState('')
  const [editingMembers, setEditingMembers] = useState(false)
  const [editMembers, setEditMembers] = useState([])
  const [editSubmitting, setEditSubmitting] = useState(false)

  const updateMember = useCallback((index, field, value) => {
    setMembers(prev => {
      const updated = [...prev]
      updated[index] = { ...updated[index], [field]: value }
      return updated
    })
  }, [])

  const updateEditMember = useCallback((index, field, value) => {
    setEditMembers(prev => {
      const updated = [...prev]
      updated[index] = { ...updated[index], [field]: value }
      return updated
    })
  }, [])

  // --- Register submit ---
  const handleRegister = async (e) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      const data = await ishanyaApi.register({
        team_name: teamName,
        leader_name: leaderName,
        leader_roll_no: leaderRollNo,
        leader_dept: leaderDept,
        leader_sec: leaderSec,
        leader_email: leaderEmail,
        leader_phone: leaderPhone,
        amount: FIXED_AMOUNT,
        members: members.map(m => ({
          name: m.name,
          roll_no: m.roll_no,
          department: m.department,
          sec: m.sec,
          email: m.email,
          phone: m.phone,
        })),
      })
      setRegistrationId(data.registration_id)
      setShowModal(true)
      setModalStep('qr')
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  // --- File to base64 ---
  const fileToBase64 = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result.split(',')[1])
      reader.onerror = reject
      reader.readAsDataURL(file)
    })

  // --- Payment submit ---
  const handlePayment = async () => {
    setPaymentError('')
    if (!utrNumber.trim()) {
      setPaymentError('UTR number is required')
      return
    }
    setPaymentSubmitting(true)
    try {
      let screenshot_base64 = null
      if (screenshotFile) {
        screenshot_base64 = await fileToBase64(screenshotFile)
      }
      await ishanyaApi.submitPayment({
        registration_id: registrationId,
        utr_number: utrNumber,
        screenshot_base64,
      })
      setModalStep('done')
    } catch (err) {
      setPaymentError(err.message)
    } finally {
      setPaymentSubmitting(false)
    }
  }

  // --- Copy ID ---
  const handleCopy = () => {
    navigator.clipboard.writeText(registrationId).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  // --- Close modal & reset form ---
  const handleCloseModal = () => {
    setShowModal(false)
    setModalStep('qr')
    setUtrNumber('')
    setScreenshotFile(null)
    setPaymentError('')
    setCopied(false)
    // Reset form
    setTeamName('')
    setLeaderName('')
    setLeaderRollNo('')
    setLeaderDept('')
    setLeaderSec('')
    setLeaderEmail('')
    setLeaderPhone('')
    setMembers(createEmptyMembers())
  }

  // --- Status check ---
  const handleCheckStatus = async (e) => {
    e.preventDefault()
    setStatusError('')
    setStatusData(null)
    setEditingMembers(false)
    if (!statusId.trim()) {
      setStatusError('Please enter your registration ID')
      return
    }
    setStatusLoading(true)
    try {
      const data = await ishanyaApi.getStatus(statusId.trim())
      setStatusData(data)
    } catch (err) {
      setStatusError(err.message)
    } finally {
      setStatusLoading(false)
    }
  }

  // --- Edit members ---
  const startEditMembers = () => {
    setEditMembers(statusData.members.map(m => ({
      name: m.name || '',
      roll_no: m.roll_no || '',
      department: m.department || '',
      sec: m.section || m.sec || '',
      email: m.email || '',
      phone: m.phone || '',
    })))
    setEditingMembers(true)
  }

  const handleSaveMembers = async () => {
    setEditSubmitting(true)
    try {
      await ishanyaApi.updateMembers(statusData.registration_id, {
        members: editMembers.map(m => ({
          name: m.name,
          roll_no: m.roll_no,
          department: m.department,
          sec: m.sec,
          email: m.email,
          phone: m.phone,
        }))
      })
      const updated = await ishanyaApi.getStatus(statusData.registration_id)
      setStatusData(updated)
      setEditingMembers(false)
    } catch (err) {
      setStatusError(err.message)
    } finally {
      setEditSubmitting(false)
    }
  }

  return (
    <div className="ishanya-page">
      <div className="ishanya-header">
        <img
          src="/images/ishanya_logo.png"
          alt="Ishanya 26 - Visualize. Create. Inspire."
          className="ishanya-brand-logo"
        />
        <p className="ishanya-header-sub">Team Registration &bull; Visualize. Create. Inspire.</p>
      </div>

      <div className="ishanya-tabs">
        <button
          className={`ishanya-tab ${activeTab === 'register' ? 'active' : ''}`}
          onClick={() => setActiveTab('register')}
        >
          Register
        </button>
        <button
          className={`ishanya-tab ${activeTab === 'status' ? 'active' : ''}`}
          onClick={() => setActiveTab('status')}
        >
          Check Status
        </button>
      </div>

      {/* ========== REGISTER TAB ========== */}
      {activeTab === 'register' && (
        <form onSubmit={handleRegister}>
          {/* Team Details & Automatic Amount Summary */}
          <div className="ishanya-card">
            <h2>Team Details</h2>
            <div className="ishanya-input-group">
              <label className="ishanya-label">Team Name</label>
              <input
                className="ishanya-input"
                type="text"
                placeholder="Enter your team name"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                required
              />
            </div>

            <div className="ishanya-fee-summary-box">
              <div className="ishanya-fee-summary-row">
                <span className="ishanya-fee-label">Team Size:</span>
                <span className="ishanya-fee-value">{TEAM_MEMBER_COUNT} Members (Fixed)</span>
              </div>
              <div className="ishanya-fee-summary-row">
                <span className="ishanya-fee-label">Registration Fee:</span>
                <span className="ishanya-fee-value highlight">₹{FIXED_AMOUNT}</span>
              </div>
              <p className="ishanya-fee-note">
                ⚡ Automatic calculation: Fixed at ₹{AMOUNT_PER_MEMBER} per member (Total ₹{FIXED_AMOUNT} for {TEAM_MEMBER_COUNT} members).
              </p>
            </div>
          </div>

          {/* Member 1 (Team Leader) */}
          <div className="ishanya-card">
            <div className="ishanya-card-header-badge">
              <h2>Member 1 (Team Leader)</h2>
              <span className="ishanya-member-badge">Leader</span>
            </div>
            <div className="ishanya-member-grid">
              <div className="ishanya-input-group">
                <label className="ishanya-label">Name</label>
                <input
                  className="ishanya-input"
                  type="text"
                  placeholder="Leader's full name"
                  value={leaderName}
                  onChange={(e) => setLeaderName(e.target.value)}
                  required
                />
              </div>
              <div className="ishanya-input-group">
                <label className="ishanya-label">Roll No</label>
                <input
                  className="ishanya-input"
                  type="text"
                  placeholder="Leader's roll number"
                  value={leaderRollNo}
                  onChange={(e) => setLeaderRollNo(e.target.value)}
                  required
                />
              </div>
              <div className="ishanya-input-group">
                <label className="ishanya-label">Department</label>
                <input
                  className="ishanya-input"
                  type="text"
                  placeholder="e.g. CSE / IT / ECE"
                  value={leaderDept}
                  onChange={(e) => setLeaderDept(e.target.value)}
                  required
                />
              </div>
              <div className="ishanya-input-group">
                <label className="ishanya-label">Sec</label>
                <input
                  className="ishanya-input"
                  type="text"
                  placeholder="e.g. A / B / C"
                  value={leaderSec}
                  onChange={(e) => setLeaderSec(e.target.value)}
                  required
                />
              </div>
              <div className="ishanya-input-group">
                <label className="ishanya-label">Email</label>
                <input
                  className="ishanya-input"
                  type="email"
                  placeholder="Leader's email address"
                  value={leaderEmail}
                  onChange={(e) => setLeaderEmail(e.target.value)}
                  required
                />
              </div>
              <div className="ishanya-input-group">
                <label className="ishanya-label">Phone No</label>
                <input
                  className="ishanya-input"
                  type="tel"
                  placeholder="Leader's phone number"
                  value={leaderPhone}
                  onChange={(e) => setLeaderPhone(e.target.value)}
                  required
                />
              </div>
            </div>
          </div>

          {/* Members 2 & 3 (Exact same details collected) */}
          {members.map((member, i) => (
            <div className="ishanya-card" key={i}>
              <div className="ishanya-card-header-badge">
                <h2>Member {i + 2}</h2>
                <span className="ishanya-member-badge">Member</span>
              </div>
              <div className="ishanya-member-grid">
                <div className="ishanya-input-group">
                  <label className="ishanya-label">Name</label>
                  <input
                    className="ishanya-input"
                    type="text"
                    placeholder={`Member ${i + 2}'s full name`}
                    value={member.name}
                    onChange={(e) => updateMember(i, 'name', e.target.value)}
                    required
                  />
                </div>
                <div className="ishanya-input-group">
                  <label className="ishanya-label">Roll No</label>
                  <input
                    className="ishanya-input"
                    type="text"
                    placeholder={`Member ${i + 2}'s roll number`}
                    value={member.roll_no}
                    onChange={(e) => updateMember(i, 'roll_no', e.target.value)}
                    required
                  />
                </div>
                <div className="ishanya-input-group">
                  <label className="ishanya-label">Department</label>
                  <input
                    className="ishanya-input"
                    type="text"
                    placeholder="e.g. CSE / IT / ECE"
                    value={member.department}
                    onChange={(e) => updateMember(i, 'department', e.target.value)}
                    required
                  />
                </div>
                <div className="ishanya-input-group">
                  <label className="ishanya-label">Sec</label>
                  <input
                    className="ishanya-input"
                    type="text"
                    placeholder="e.g. A / B / C"
                    value={member.sec}
                    onChange={(e) => updateMember(i, 'sec', e.target.value)}
                    required
                  />
                </div>
                <div className="ishanya-input-group">
                  <label className="ishanya-label">Email</label>
                  <input
                    className="ishanya-input"
                    type="email"
                    placeholder={`Member ${i + 2}'s email address`}
                    value={member.email}
                    onChange={(e) => updateMember(i, 'email', e.target.value)}
                    required
                  />
                </div>
                <div className="ishanya-input-group">
                  <label className="ishanya-label">Phone No</label>
                  <input
                    className="ishanya-input"
                    type="tel"
                    placeholder={`Member ${i + 2}'s phone number`}
                    value={member.phone}
                    onChange={(e) => updateMember(i, 'phone', e.target.value)}
                    required
                  />
                </div>
              </div>
            </div>
          ))}

          {error && <div className="ishanya-error" style={{ maxWidth: 600, margin: '0 auto 1rem' }}>{error}</div>}

          <div style={{ maxWidth: 600, margin: '0 auto', textAlign: 'center' }}>
            <button className="ishanya-btn" type="submit" disabled={submitting}>
              {submitting ? 'Registering...' : `Register Team (₹${FIXED_AMOUNT})`}
            </button>
          </div>
        </form>
      )}

      {/* ========== STATUS TAB ========== */}
      {activeTab === 'status' && (
        <div>
          <form onSubmit={handleCheckStatus}>
            <div className="ishanya-card">
              <h2>Check Registration Status</h2>
              <div className="ishanya-input-group">
                <label className="ishanya-label">Registration ID</label>
                <input
                  className="ishanya-input"
                  type="text"
                  placeholder="e.g. ISH-A3B7"
                  value={statusId}
                  onChange={(e) => setStatusId(e.target.value)}
                />
              </div>
              <button className="ishanya-btn ishanya-btn-secondary" type="submit" disabled={statusLoading}>
                {statusLoading ? 'Checking...' : 'Check Status'}
              </button>
            </div>
          </form>

          {statusError && <div className="ishanya-error" style={{ maxWidth: 600, margin: '0 auto 1rem' }}>{statusError}</div>}

          {statusData && (
            <div className="ishanya-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '8px' }}>
                <h2>Team: {statusData.team_name}</h2>
                <span className={`ishanya-status-badge ${statusData.status}`}>{statusData.status}</span>
              </div>

              <div className="ishanya-status-summary-grid">
                <div><strong>Registration ID:</strong> <span style={{ fontFamily: 'monospace', color: 'var(--gold)', fontWeight: 800 }}>{statusData.registration_id}</span></div>
                <div><strong>Registration Fee:</strong> <span style={{ fontWeight: 800 }}>₹{statusData.amount || FIXED_AMOUNT} (Fixed: {TEAM_MEMBER_COUNT} Members)</span></div>
                {statusData.utr_number && <div><strong>UTR:</strong> <span style={{ fontFamily: 'monospace' }}>{statusData.utr_number}</span></div>}
              </div>

              {/* Leader Details Card */}
              <div className="ishanya-member-card" style={{ marginTop: '1.25rem' }}>
                <h3>Member 1 (Team Leader)</h3>
                <div className="ishanya-member-info-grid">
                  <div><strong>Name:</strong> {statusData.leader_name}</div>
                  <div><strong>Roll No:</strong> {statusData.leader_roll_no || 'N/A'}</div>
                  <div><strong>Dept:</strong> {statusData.leader_dept || 'N/A'}</div>
                  <div><strong>Sec:</strong> {statusData.leader_sec || 'N/A'}</div>
                  <div><strong>Email:</strong> {statusData.leader_email}</div>
                  <div><strong>Phone:</strong> {statusData.leader_phone}</div>
                </div>
              </div>

              {/* Members 2 & 3 */}
              <h3 style={{ marginTop: '1.25rem', fontWeight: 800, color: 'var(--ink)' }}>Other Members</h3>
              {!editingMembers ? (
                <>
                  {statusData.members.map((m, i) => (
                    <div key={i} className="ishanya-member-card">
                      <h3>Member {i + 2}</h3>
                      <div className="ishanya-member-info-grid">
                        <div><strong>Name:</strong> {m.name}</div>
                        <div><strong>Roll No:</strong> {m.roll_no || 'N/A'}</div>
                        <div><strong>Dept:</strong> {m.department || 'N/A'}</div>
                        <div><strong>Sec:</strong> {m.section || 'N/A'}</div>
                        <div><strong>Email:</strong> {m.email || 'N/A'}</div>
                        <div><strong>Phone:</strong> {m.phone}</div>
                      </div>
                    </div>
                  ))}
                  {statusData.status === 'pending' && (
                    <button className="ishanya-btn ishanya-btn-secondary" type="button" onClick={startEditMembers} style={{ marginTop: '0.75rem' }}>
                      Edit Members
                    </button>
                  )}
                </>
              ) : (
                <>
                  {editMembers.map((m, i) => (
                    <div key={i} className="ishanya-member-card">
                      <h3>Member {i + 2}</h3>
                      <div className="ishanya-member-grid">
                        <div className="ishanya-input-group">
                          <label className="ishanya-label">Name</label>
                          <input className="ishanya-input" value={m.name} onChange={(e) => updateEditMember(i, 'name', e.target.value)} required />
                        </div>
                        <div className="ishanya-input-group">
                          <label className="ishanya-label">Roll No</label>
                          <input className="ishanya-input" value={m.roll_no} onChange={(e) => updateEditMember(i, 'roll_no', e.target.value)} required />
                        </div>
                        <div className="ishanya-input-group">
                          <label className="ishanya-label">Department</label>
                          <input className="ishanya-input" value={m.department} onChange={(e) => updateEditMember(i, 'department', e.target.value)} required />
                        </div>
                        <div className="ishanya-input-group">
                          <label className="ishanya-label">Sec</label>
                          <input className="ishanya-input" value={m.sec} onChange={(e) => updateEditMember(i, 'sec', e.target.value)} required />
                        </div>
                        <div className="ishanya-input-group">
                          <label className="ishanya-label">Email</label>
                          <input className="ishanya-input" type="email" value={m.email} onChange={(e) => updateEditMember(i, 'email', e.target.value)} required />
                        </div>
                        <div className="ishanya-input-group">
                          <label className="ishanya-label">Phone No</label>
                          <input className="ishanya-input" type="tel" value={m.phone} onChange={(e) => updateEditMember(i, 'phone', e.target.value)} required />
                        </div>
                      </div>
                    </div>
                  ))}
                  <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.75rem' }}>
                    <button className="ishanya-btn ishanya-btn-success" type="button" onClick={handleSaveMembers} disabled={editSubmitting}>
                      {editSubmitting ? 'Saving...' : 'Save'}
                    </button>
                    <button className="ishanya-btn ishanya-btn-danger" type="button" onClick={() => setEditingMembers(false)}>
                      Cancel
                    </button>
                  </div>
                </>
              )}

              {statusData.status === 'accepted' && (
                <div style={{
                  background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.12), rgba(5, 150, 105, 0.05))',
                  border: '1px solid rgba(16, 185, 129, 0.4)',
                  borderRadius: '12px',
                  padding: '1.25rem',
                  marginTop: '1.5rem',
                  textAlign: 'center',
                }}>
                  <div style={{ color: '#10b981', fontWeight: 800, fontSize: '1.15rem', marginBottom: '0.35rem' }}>
                    🎉 Payment Verified & Registration Confirmed!
                  </div>
                  <p style={{ color: 'var(--ink-muted)', fontSize: '0.875rem', margin: '0 0 1rem' }}>
                    Your team is officially cleared to participate in Ishanya. Keep your Registration ID (<strong style={{ color: 'var(--gold)' }}>{statusData.registration_id}</strong>) ready or screenshot this pass for gate entry.
                  </p>
                  {statusData.whatsapp_link && (
                    <a
                      href={statusData.whatsapp_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ishanya-whatsapp-link"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        padding: '0.85rem 1.75rem',
                        background: '#25D366',
                        color: '#fff',
                        textDecoration: 'none',
                        borderRadius: '8px',
                        fontWeight: 700,
                        fontSize: '0.95rem',
                        boxShadow: '0 4px 14px rgba(37, 211, 102, 0.35)',
                      }}
                    >
                      📱 Join Official WhatsApp Group
                    </a>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ========== PAYMENT QR MODAL ========== */}
      {showModal && (
        <div className="ishanya-modal-overlay" onClick={modalStep === 'done' ? handleCloseModal : undefined}>
          <div className="ishanya-modal" onClick={(e) => e.stopPropagation()}>
            {modalStep === 'qr' && (
              <>
                <h2>Complete Payment</h2>
                <div className="ishanya-payment-amount-box">
                  <span className="ishanya-payment-amount-label">Payable Amount</span>
                  <span className="ishanya-payment-amount-val">₹{FIXED_AMOUNT}</span>
                  <span className="ishanya-payment-amount-sub">Fixed: {TEAM_MEMBER_COUNT} Members × ₹{AMOUNT_PER_MEMBER}</span>
                </div>
                <p style={{ color: 'var(--ink)', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                  Scan the QR code below to pay <strong>₹{FIXED_AMOUNT}</strong>
                </p>
                <img src="/images/ishanya_payment_qr.png" alt="Payment QR Code" className="ishanya-qr-image" />
                <div style={{ marginTop: '1.25rem' }}>
                  <button className="ishanya-btn" type="button" onClick={() => setModalStep('utr')}>
                    Done — Enter UTR Number
                  </button>
                </div>
              </>
            )}

            {modalStep === 'utr' && (
              <>
                <h2>Submit Payment Details</h2>
                <div className="ishanya-payment-amount-box small">
                  <span>Payable Amount: <strong>₹{FIXED_AMOUNT}</strong> ({TEAM_MEMBER_COUNT} Members)</span>
                </div>
                <div className="ishanya-input-group" style={{ textAlign: 'left' }}>
                  <label className="ishanya-label">UTR / Transaction Number</label>
                  <input
                    className="ishanya-input"
                    type="text"
                    placeholder="Enter 12-digit UTR number"
                    value={utrNumber}
                    onChange={(e) => setUtrNumber(e.target.value)}
                  />
                </div>
                <div className="ishanya-input-group" style={{ textAlign: 'left' }}>
                  <label className="ishanya-label">Payment Screenshot (optional)</label>
                  <input
                    className="ishanya-input"
                    type="file"
                    accept="image/*"
                    onChange={(e) => setScreenshotFile(e.target.files[0] || null)}
                    style={{ padding: '0.5rem' }}
                  />
                </div>
                {paymentError && <div className="ishanya-error">{paymentError}</div>}
                <button className="ishanya-btn ishanya-btn-success" type="button" onClick={handlePayment} disabled={paymentSubmitting}>
                  {paymentSubmitting ? 'Submitting...' : 'Submit Payment'}
                </button>
              </>
            )}

            {modalStep === 'done' && (
              <>
                <h2>🎉 Registration Complete!</h2>
                <p style={{ color: 'var(--ink)' }}>Save your registration ID:</p>
                <div className="ishanya-success-id">
                  <span>{registrationId}</span>
                  <button onClick={handleCopy}>{copied ? 'Copied!' : 'Copy'}</button>
                </div>
                <p style={{ color: 'var(--ink-muted)', fontSize: '0.85rem' }}>Use this ID to check your status later.</p>
                <button className="ishanya-btn" type="button" onClick={handleCloseModal} style={{ marginTop: '1rem' }}>
                  Close
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
