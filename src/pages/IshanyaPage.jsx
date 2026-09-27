import { useState, useCallback } from 'react'
import { ishanyaApi } from '../api/ishanyaApi'
import './IshanyaPage.css'

const TEAM_MEMBER_COUNT = 3
const ADDITIONAL_MEMBERS = TEAM_MEMBER_COUNT - 1

function createEmptyMembers() {
  return Array.from({ length: ADDITIONAL_MEMBERS }, () => ({ name: '', phone: '' }))
}

export function IshanyaPage() {
  const [activeTab, setActiveTab] = useState('register')

  // --- Register state ---
  const [teamName, setTeamName] = useState('')
  const [leaderName, setLeaderName] = useState('')
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
        leader_email: leaderEmail,
        leader_phone: leaderPhone,
        members,
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
    setEditMembers(statusData.members.map(m => ({ name: m.name, phone: m.phone })))
    setEditingMembers(true)
  }

  const handleSaveMembers = async () => {
    setEditSubmitting(true)
    try {
      await ishanyaApi.updateMembers(statusData.registration_id, { members: editMembers })
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
          </div>

          <div className="ishanya-card">
            <h2>Team Leader (Member 1)</h2>
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
              <label className="ishanya-label">Phone</label>
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

          {members.map((member, i) => (
            <div className="ishanya-card" key={i}>
              <div className="ishanya-member-card">
                <h3>Member {i + 2}</h3>
                <div className="ishanya-member-grid">
                  <div className="ishanya-input-group">
                    <label className="ishanya-label">Name</label>
                    <input
                      className="ishanya-input"
                      type="text"
                      placeholder="Member name"
                      value={member.name}
                      onChange={(e) => updateMember(i, 'name', e.target.value)}
                      required
                    />
                  </div>
                  <div className="ishanya-input-group">
                    <label className="ishanya-label">Phone</label>
                    <input
                      className="ishanya-input"
                      type="tel"
                      placeholder="Member phone"
                      value={member.phone}
                      onChange={(e) => updateMember(i, 'phone', e.target.value)}
                      required
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}

          {error && <div className="ishanya-error" style={{ maxWidth: 600, margin: '0 auto 1rem' }}>{error}</div>}

          <div style={{ maxWidth: 600, margin: '0 auto', textAlign: 'center' }}>
            <button className="ishanya-btn" type="submit" disabled={submitting}>
              {submitting ? 'Registering...' : 'Register Team'}
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
              <h2>Team: {statusData.team_name}</h2>
              <div style={{ marginBottom: '1rem' }}>
                <span className="ishanya-label" style={{ marginRight: 8 }}>Status:</span>
                <span className={`ishanya-status-badge ${statusData.status}`}>{statusData.status}</span>
              </div>
              <div style={{ marginBottom: '0.5rem' }}><strong>ID:</strong> {statusData.registration_id}</div>
              <div style={{ marginBottom: '0.5rem' }}><strong>Leader:</strong> {statusData.leader_name} ({statusData.leader_email})</div>
              <div style={{ marginBottom: '0.5rem' }}><strong>Phone:</strong> {statusData.leader_phone}</div>
              {statusData.utr_number && <div style={{ marginBottom: '0.5rem' }}><strong>UTR:</strong> {statusData.utr_number}</div>}

              <h3 style={{ marginTop: '1.25rem', fontWeight: 700, color: '#291809' }}>Members</h3>
              {!editingMembers ? (
                <>
                  {statusData.members.map((m, i) => (
                    <div key={i} className="ishanya-member-card">
                      <div><strong>{m.name}</strong> — {m.phone}</div>
                    </div>
                  ))}
                  {statusData.status === 'pending' && (
                    <button className="ishanya-btn ishanya-btn-secondary" type="button" onClick={startEditMembers} style={{ marginTop: '0.5rem' }}>
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
                          <label className="ishanya-label">Phone</label>
                          <input className="ishanya-input" value={m.phone} onChange={(e) => updateEditMember(i, 'phone', e.target.value)} required />
                        </div>
                      </div>
                    </div>
                  ))}
                  <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                    <button className="ishanya-btn ishanya-btn-success" type="button" onClick={handleSaveMembers} disabled={editSubmitting}>
                      {editSubmitting ? 'Saving...' : 'Save'}
                    </button>
                    <button className="ishanya-btn ishanya-btn-danger" type="button" onClick={() => setEditingMembers(false)}>
                      Cancel
                    </button>
                  </div>
                </>
              )}

              {statusData.status === 'accepted' && statusData.whatsapp_link && (
                <a href={statusData.whatsapp_link} target="_blank" rel="noopener noreferrer" className="ishanya-whatsapp-link">
                  📱 Join WhatsApp Group
                </a>
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
                <p style={{ color: '#291809', marginBottom: '0.5rem' }}>Scan the QR code below to pay</p>
                <img src="/images/ishanya_payment_qr.svg" alt="Payment QR Code" className="ishanya-qr-image" />
                <div style={{ marginTop: '1.25rem' }}>
                  <button className="ishanya-btn" type="button" onClick={() => setModalStep('utr')}>
                    Done
                  </button>
                </div>
              </>
            )}

            {modalStep === 'utr' && (
              <>
                <h2>Submit Payment Details</h2>
                <div className="ishanya-input-group" style={{ textAlign: 'left' }}>
                  <label className="ishanya-label">UTR / Transaction Number</label>
                  <input
                    className="ishanya-input"
                    type="text"
                    placeholder="Enter UTR number"
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
                <p style={{ color: '#291809' }}>Save your registration ID:</p>
                <div className="ishanya-success-id">
                  <span>{registrationId}</span>
                  <button onClick={handleCopy}>{copied ? 'Copied!' : 'Copy'}</button>
                </div>
                <p style={{ color: '#666', fontSize: '0.85rem' }}>Use this ID to check your status later.</p>
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
