import { useEffect, useState, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Users, Search, Filter, Shield, X, CheckCircle, AlertCircle,
  LoaderCircle, Eye, ArrowLeft, RefreshCw, MessageSquare, Image as ImageIcon
} from 'lucide-react'
import { adminApi } from '../../api/adminApi'
import { ishanyaApi } from '../../api/ishanyaApi'

export function IshanyaAdminPage() {
  const navigate = useNavigate()
  const [admin, setAdmin] = useState(null)
  const [teams, setTeams] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [refreshing, setRefreshing] = useState(false)

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  // Selected team for drawer / screenshot
  const [selectedTeam, setSelectedTeam] = useState(null)
  const [screenshotModal, setScreenshotModal] = useState({ open: false, data: null, title: '' })
  const [actionLoading, setActionLoading] = useState(false)

  // Edit / Decision notes state
  const [editingNotesId, setEditingNotesId] = useState(null)
  const [adminNotes, setAdminNotes] = useState('')

  // Verify auth on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const meData = await adminApi.getMe()
        setAdmin(meData.admin)
      } catch {
        navigate('/admin/login')
      }
    }
    checkAuth()
  }, [navigate])

  // Fetch teams
  const fetchTeams = useCallback(async () => {
    setError('')
    try {
      const data = await ishanyaApi.getTeams()
      setTeams(data.teams || [])
    } catch (err) {
      if (err.status === 401) {
        navigate('/admin/login')
      } else {
        setError(err.message || 'Failed to load Ishanya teams')
      }
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [navigate])

  useEffect(() => {
    fetchTeams()
  }, [fetchTeams])

  const handleRefresh = () => {
    setRefreshing(true)
    fetchTeams()
  }

  // Handle status update (accept / reject / edit)
  const handleStatusChange = async (team, newStatus) => {
    const actionLabel = newStatus === 'accepted' ? 'ACCEPT' : 'REJECT'
    const promptNotes = prompt(
      `Are you sure you want to ${actionLabel} team "${team.team_name}" (${team.registration_id})?\n\nAn automated email will be sent to ${team.leader_email}.\n\nOptional note for internal record:`,
      team.admin_notes || ''
    )

    if (promptNotes === null) {
      // User clicked cancel
      return
    }

    setActionLoading(true)
    try {
      await ishanyaApi.updateTeamStatus(team.registration_id, {
        status: newStatus,
        notes: promptNotes.trim() || undefined,
      })
      await fetchTeams()
      if (selectedTeam?.registration_id === team.registration_id) {
        setSelectedTeam(prev => prev ? { ...prev, status: newStatus, admin_notes: promptNotes.trim() } : null)
      }
    } catch (err) {
      alert(`Error updating status: ${err.message}`)
    } finally {
      setActionLoading(false)
    }
  }

  // View screenshot
  const handleViewScreenshot = async (team) => {
    try {
      const res = await ishanyaApi.getScreenshot(team.registration_id)
      if (res.screenshot) {
        setScreenshotModal({
          open: true,
          data: res.screenshot.startsWith('data:') ? res.screenshot : `data:image/jpeg;base64,${res.screenshot}`,
          title: `Payment Screenshot — ${team.team_name} (${team.registration_id})`
        })
      } else {
        alert('No payment screenshot was uploaded by this team.')
      }
    } catch (err) {
      alert(`Failed to fetch screenshot: ${err.message}`)
    }
  }

  // Save admin notes directly
  const handleSaveNotes = async (team) => {
    setActionLoading(true)
    try {
      await ishanyaApi.updateTeamStatus(team.registration_id, {
        status: team.status,
        notes: adminNotes,
      })
      setEditingNotesId(null)
      await fetchTeams()
    } catch (err) {
      alert(`Error saving notes: ${err.message}`)
    } finally {
      setActionLoading(false)
    }
  }

  // Filtered and searched teams
  const filteredTeams = useMemo(() => {
    return teams.filter(t => {
      const matchesStatus = statusFilter === 'all' || t.status === statusFilter
      const term = searchTerm.toLowerCase().trim()
      const matchesSearch =
        !term ||
        t.registration_id?.toLowerCase().includes(term) ||
        t.team_name?.toLowerCase().includes(term) ||
        t.leader_name?.toLowerCase().includes(term) ||
        t.leader_email?.toLowerCase().includes(term) ||
        t.leader_phone?.includes(term) ||
        t.utr_number?.toLowerCase().includes(term) ||
        t.members?.some(m => m.name?.toLowerCase().includes(term) || m.phone?.includes(term))
      return matchesStatus && matchesSearch
    })
  }, [teams, statusFilter, searchTerm])

  // Stats
  const stats = useMemo(() => {
    return {
      total: teams.length,
      pending: teams.filter(t => t.status === 'pending').length,
      accepted: teams.filter(t => t.status === 'accepted').length,
      rejected: teams.filter(t => t.status === 'rejected').length,
    }
  }, [teams])

  const formatDate = (ms) => {
    if (!ms) return 'N/A'
    return new Date(Number(ms)).toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#090d16',
      color: '#f8fafc',
      fontFamily: "var(--font-primary, 'Tektur', sans-serif)",
      padding: '24px',
    }}>
      {/* Top Header Bar */}
      <div style={{
        maxWidth: '1300px',
        margin: '0 auto 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px',
        borderBottom: '1px solid #1e293b',
        paddingBottom: '20px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button
            onClick={() => navigate('/admin/dashboard')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              backgroundColor: '#1e293b',
              color: '#94a3b8',
              border: '1px solid #334155',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: 600,
            }}
          >
            <ArrowLeft size={16} /> Back to Dashboard
          </button>
          <div>
            <h1 style={{
              margin: 0,
              fontSize: '24px',
              fontWeight: 800,
              letterSpacing: '-0.02em',
              color: '#f8fafc',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}>
              <span style={{
                background: 'linear-gradient(135deg, #ea580c, #f59e0b)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}>
                Ishanya
              </span>
              Event Registrations
            </h1>
            <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '13px' }}>
              Review, verify payments, and manage team approvals with automated notifications
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              backgroundColor: '#1e293b',
              color: '#f8fafc',
              border: '1px solid #334155',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: 600,
            }}
          >
            <RefreshCw size={15} className={refreshing ? 'spin' : ''} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      <div style={{ maxWidth: '1300px', margin: '0 auto' }}>
        {/* Stats Row */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '16px',
          marginBottom: '24px',
        }}>
          <div style={{
            backgroundColor: '#0f172a',
            border: '1px solid #1e293b',
            borderRadius: '12px',
            padding: '16px 20px',
          }}>
            <div style={{ color: '#94a3b8', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>Total Teams</div>
            <div style={{ fontSize: '28px', fontWeight: 800, color: '#f8fafc' }}>{stats.total}</div>
          </div>
          <div style={{
            backgroundColor: '#0f172a',
            border: '1px solid #1e293b',
            borderRadius: '12px',
            padding: '16px 20px',
            borderLeft: '4px solid #f59e0b',
          }}>
            <div style={{ color: '#f59e0b', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>Pending Review</div>
            <div style={{ fontSize: '28px', fontWeight: 800, color: '#f8fafc' }}>{stats.pending}</div>
          </div>
          <div style={{
            backgroundColor: '#0f172a',
            border: '1px solid #1e293b',
            borderRadius: '12px',
            padding: '16px 20px',
            borderLeft: '4px solid #10b981',
          }}>
            <div style={{ color: '#10b981', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>Accepted</div>
            <div style={{ fontSize: '28px', fontWeight: 800, color: '#f8fafc' }}>{stats.accepted}</div>
          </div>
          <div style={{
            backgroundColor: '#0f172a',
            border: '1px solid #1e293b',
            borderRadius: '12px',
            padding: '16px 20px',
            borderLeft: '4px solid #ef4444',
          }}>
            <div style={{ color: '#ef4444', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>Rejected</div>
            <div style={{ fontSize: '28px', fontWeight: 800, color: '#f8fafc' }}>{stats.rejected}</div>
          </div>
        </div>

        {/* Search and Filters Bar */}
        <div style={{
          display: 'flex',
          gap: '12px',
          flexWrap: 'wrap',
          alignItems: 'center',
          backgroundColor: '#0f172a',
          padding: '16px',
          borderRadius: '12px',
          border: '1px solid #1e293b',
          marginBottom: '20px',
        }}>
          <div style={{
            flex: 1,
            minWidth: '240px',
            display: 'flex',
            alignItems: 'center',
            backgroundColor: '#1e293b',
            borderRadius: '8px',
            padding: '0 12px',
            border: '1px solid #334155',
          }}>
            <Search size={16} color="#64748b" />
            <input
              type="text"
              placeholder="Search by ID, team, leader, phone, or UTR..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 10px',
                background: 'transparent',
                border: 'none',
                outline: 'none',
                color: '#f8fafc',
                fontSize: '14px',
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span style={{ fontSize: '13px', color: '#94a3b8', fontWeight: 600 }}>Status:</span>
            {['all', 'pending', 'accepted', 'rejected'].map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                style={{
                  padding: '6px 14px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: 700,
                  textTransform: 'capitalize',
                  cursor: 'pointer',
                  border: statusFilter === s ? '1px solid #ea580c' : '1px solid #334155',
                  backgroundColor: statusFilter === s ? '#ea580c' : '#1e293b',
                  color: statusFilter === s ? '#fff' : '#94a3b8',
                }}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div style={{
            padding: '14px 18px',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid #ef4444',
            borderRadius: '10px',
            color: '#fca5a5',
            marginBottom: '20px',
            fontSize: '14px',
          }}>
            {error}
          </div>
        )}

        {/* Teams Table */}
        {loading ? (
          <div style={{
            padding: '60px',
            textAlign: 'center',
            color: '#94a3b8',
            backgroundColor: '#0f172a',
            borderRadius: '12px',
            border: '1px solid #1e293b',
          }}>
            <LoaderCircle size={32} className="spin" style={{ margin: '0 auto 12px' }} />
            <p>Loading Ishanya registrations...</p>
          </div>
        ) : filteredTeams.length === 0 ? (
          <div style={{
            padding: '60px',
            textAlign: 'center',
            color: '#64748b',
            backgroundColor: '#0f172a',
            borderRadius: '12px',
            border: '1px solid #1e293b',
          }}>
            <p style={{ fontSize: '16px', fontWeight: 600 }}>No teams found matching your filters.</p>
          </div>
        ) : (
          <div style={{
            backgroundColor: '#0f172a',
            borderRadius: '12px',
            border: '1px solid #1e293b',
            overflowX: 'auto',
          }}>
            <table style={{
              width: '100%',
              borderCollapse: 'collapse',
              textAlign: 'left',
              fontSize: '13px',
            }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #1e293b', backgroundColor: 'rgba(15, 23, 42, 0.5)' }}>
                  <th style={{ padding: '14px 16px', color: '#94a3b8', fontWeight: 700 }}>ID</th>
                  <th style={{ padding: '14px 16px', color: '#94a3b8', fontWeight: 700 }}>Team Name</th>
                  <th style={{ padding: '14px 16px', color: '#94a3b8', fontWeight: 700 }}>Leader Info</th>
                  <th style={{ padding: '14px 16px', color: '#94a3b8', fontWeight: 700 }}>Members</th>
                  <th style={{ padding: '14px 16px', color: '#94a3b8', fontWeight: 700 }}>Payment (UTR)</th>
                  <th style={{ padding: '14px 16px', color: '#94a3b8', fontWeight: 700 }}>Status</th>
                  <th style={{ padding: '14px 16px', color: '#94a3b8', fontWeight: 700 }}>Registered</th>
                  <th style={{ padding: '14px 16px', color: '#94a3b8', fontWeight: 700, textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTeams.map((team) => {
                  const isAccepted = team.status === 'accepted'
                  const isRejected = team.status === 'rejected'
                  const isPending = team.status === 'pending'

                  return (
                    <tr
                      key={team.registration_id}
                      style={{
                        borderBottom: '1px solid #1e293b',
                        transition: 'background-color 0.15s',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#131e33')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      {/* Registration ID */}
                      <td style={{ padding: '14px 16px', whiteSpace: 'nowrap' }}>
                        <span style={{
                          fontFamily: 'monospace',
                          fontSize: '13px',
                          fontWeight: 700,
                          backgroundColor: '#1e293b',
                          color: '#f59e0b',
                          padding: '4px 8px',
                          borderRadius: '6px',
                          border: '1px solid #334155',
                        }}>
                          {team.registration_id}
                        </span>
                      </td>

                      {/* Team Name */}
                      <td style={{ padding: '14px 16px', fontWeight: 700, color: '#f8fafc' }}>
                        {team.team_name}
                      </td>

                      {/* Leader Info */}
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ fontWeight: 600, color: '#e2e8f0' }}>{team.leader_name}</div>
                        <div style={{ fontSize: '11px', color: '#64748b' }}>{team.leader_email}</div>
                        <div style={{ fontSize: '11px', color: '#64748b' }}>{team.leader_phone}</div>
                      </td>

                      {/* Members */}
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                          {team.members?.map((m, idx) => (
                            <div key={idx} style={{ marginBottom: '2px' }}>
                              • <span style={{ color: '#e2e8f0' }}>{m.name}</span> ({m.phone})
                            </div>
                          ))}
                        </div>
                      </td>

                      {/* UTR & Screenshot */}
                      <td style={{ padding: '14px 16px' }}>
                        {team.utr_number ? (
                          <div>
                            <div style={{ fontFamily: 'monospace', fontSize: '12px', color: '#38bdf8' }}>
                              {team.utr_number}
                            </div>
                            <button
                              onClick={() => handleViewScreenshot(team)}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                background: 'transparent',
                                border: 'none',
                                color: '#a855f7',
                                cursor: 'pointer',
                                fontSize: '11px',
                                padding: 0,
                                marginTop: '4px',
                                textDecoration: 'underline',
                              }}
                            >
                              <ImageIcon size={12} /> View Screenshot
                            </button>
                          </div>
                        ) : (
                          <span style={{ color: '#64748b', fontStyle: 'italic', fontSize: '12px' }}>
                            Unpaid / No UTR
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{
                          display: 'inline-block',
                          padding: '4px 10px',
                          borderRadius: '6px',
                          fontSize: '11px',
                          fontWeight: 800,
                          textTransform: 'uppercase',
                          letterSpacing: '0.04em',
                          backgroundColor: isAccepted ? 'rgba(16, 185, 129, 0.15)' : isRejected ? 'rgba(239, 68, 68, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                          color: isAccepted ? '#10b981' : isRejected ? '#ef4444' : '#f59e0b',
                          border: `1px solid ${isAccepted ? '#10b981' : isRejected ? '#ef4444' : '#f59e0b'}`,
                        }}>
                          {team.status}
                        </span>
                        {team.admin_notes && (
                          <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px', maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={team.admin_notes}>
                            📝 {team.admin_notes}
                          </div>
                        )}
                      </td>

                      {/* Registered Date */}
                      <td style={{ padding: '14px 16px', color: '#64748b', fontSize: '12px', whiteSpace: 'nowrap' }}>
                        {formatDate(team.created_at)}
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '14px 16px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'inline-flex', gap: '8px' }}>
                          {/* Accept Button */}
                          <button
                            onClick={() => handleStatusChange(team, 'accepted')}
                            disabled={actionLoading || isAccepted}
                            title="Accept registration (sends acceptance email)"
                            style={{
                              padding: '6px 12px',
                              backgroundColor: isAccepted ? 'transparent' : '#059669',
                              color: isAccepted ? '#059669' : '#fff',
                              border: isAccepted ? '1px solid #059669' : 'none',
                              borderRadius: '6px',
                              fontSize: '12px',
                              fontWeight: 700,
                              cursor: isAccepted ? 'default' : 'pointer',
                              opacity: actionLoading ? 0.6 : 1,
                            }}
                          >
                            Accept
                          </button>

                          {/* Reject Button */}
                          <button
                            onClick={() => handleStatusChange(team, 'rejected')}
                            disabled={actionLoading || isRejected}
                            title="Reject registration (sends rejection email)"
                            style={{
                              padding: '6px 12px',
                              backgroundColor: isRejected ? 'transparent' : '#dc2626',
                              color: isRejected ? '#dc2626' : '#fff',
                              border: isRejected ? '1px solid #dc2626' : 'none',
                              borderRadius: '6px',
                              fontSize: '12px',
                              fontWeight: 700,
                              cursor: isRejected ? 'default' : 'pointer',
                              opacity: actionLoading ? 0.6 : 1,
                            }}
                          >
                            Reject
                          </button>

                          {/* Details / Edit Notes */}
                          <button
                            onClick={() => {
                              setSelectedTeam(team)
                              setAdminNotes(team.admin_notes || '')
                            }}
                            title="View Full Details / Edit Notes"
                            style={{
                              padding: '6px 10px',
                              backgroundColor: '#1e293b',
                              color: '#94a3b8',
                              border: '1px solid #334155',
                              borderRadius: '6px',
                              fontSize: '12px',
                              cursor: 'pointer',
                            }}
                          >
                            <Eye size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Screenshot Modal */}
      {screenshotModal.open && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0,0,0,0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '20px',
        }} onClick={() => setScreenshotModal({ open: false, data: null, title: '' })}>
          <div style={{
            backgroundColor: '#0f172a',
            border: '1px solid #334155',
            borderRadius: '14px',
            padding: '24px',
            maxWidth: '600px',
            width: '100%',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
          }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '16px', color: '#f8fafc' }}>{screenshotModal.title}</h3>
              <button
                onClick={() => setScreenshotModal({ open: false, data: null, title: '' })}
                style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', textAlign: 'center' }}>
              <img
                src={screenshotModal.data}
                alt="Payment Proof"
                style={{ maxWidth: '100%', maxHeight: '60vh', borderRadius: '8px', objectFit: 'contain' }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Detail & Notes Drawer */}
      {selectedTeam && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0,0,0,0.6)',
          display: 'flex',
          justifyContent: 'flex-end',
          zIndex: 9998,
        }} onClick={() => setSelectedTeam(null)}>
          <div style={{
            backgroundColor: '#0f172a',
            borderLeft: '1px solid #1e293b',
            width: '100%',
            maxWidth: '480px',
            height: '100%',
            padding: '28px',
            overflowY: 'auto',
            boxSizing: 'border-box',
          }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <div>
                <span style={{
                  fontFamily: 'monospace',
                  fontSize: '12px',
                  fontWeight: 700,
                  backgroundColor: '#1e293b',
                  color: '#f59e0b',
                  padding: '3px 8px',
                  borderRadius: '4px',
                }}>
                  {selectedTeam.registration_id}
                </span>
                <h2 style={{ margin: '8px 0 0', fontSize: '20px', color: '#f8fafc' }}>{selectedTeam.team_name}</h2>
              </div>
              <button
                onClick={() => setSelectedTeam(null)}
                style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
              >
                <X size={22} />
              </button>
            </div>

            {/* Current Status Banner */}
            <div style={{
              padding: '14px',
              borderRadius: '8px',
              backgroundColor: '#1e293b',
              marginBottom: '20px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <div>
                <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Current Status</div>
                <div style={{ fontSize: '15px', fontWeight: 800, textTransform: 'uppercase', color: selectedTeam.status === 'accepted' ? '#10b981' : selectedTeam.status === 'rejected' ? '#ef4444' : '#f59e0b' }}>
                  {selectedTeam.status}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => handleStatusChange(selectedTeam, 'accepted')}
                  style={{
                    padding: '6px 12px',
                    backgroundColor: '#059669',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Accept
                </button>
                <button
                  onClick={() => handleStatusChange(selectedTeam, 'rejected')}
                  style={{
                    padding: '6px 12px',
                    backgroundColor: '#dc2626',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Reject
                </button>
              </div>
            </div>

            {/* Leader Details */}
            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ color: '#94a3b8', fontSize: '12px', textTransform: 'uppercase', margin: '0 0 10px', letterSpacing: '0.05em' }}>
                Team Leader
              </h4>
              <div style={{ backgroundColor: '#131e33', padding: '12px', borderRadius: '8px' }}>
                <div style={{ fontWeight: 600, color: '#f8fafc' }}>{selectedTeam.leader_name}</div>
                <div style={{ fontSize: '13px', color: '#94a3b8', marginTop: '4px' }}>📧 {selectedTeam.leader_email}</div>
                <div style={{ fontSize: '13px', color: '#94a3b8', marginTop: '2px' }}>📱 {selectedTeam.leader_phone}</div>
              </div>
            </div>

            {/* Members Details */}
            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ color: '#94a3b8', fontSize: '12px', textTransform: 'uppercase', margin: '0 0 10px', letterSpacing: '0.05em' }}>
                Team Members ({selectedTeam.members?.length || 0})
              </h4>
              {selectedTeam.members?.map((m, idx) => (
                <div key={idx} style={{ backgroundColor: '#131e33', padding: '10px 12px', borderRadius: '8px', marginBottom: '8px' }}>
                  <div style={{ fontWeight: 600, color: '#f8fafc' }}>Member {idx + 2}: {m.name}</div>
                  <div style={{ fontSize: '13px', color: '#94a3b8', marginTop: '2px' }}>📱 {m.phone}</div>
                </div>
              ))}
            </div>

            {/* Payment Details */}
            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ color: '#94a3b8', fontSize: '12px', textTransform: 'uppercase', margin: '0 0 10px', letterSpacing: '0.05em' }}>
                Payment Verification
              </h4>
              <div style={{ backgroundColor: '#131e33', padding: '12px', borderRadius: '8px' }}>
                <div style={{ fontSize: '13px', color: '#94a3b8' }}>
                  UTR Number: <span style={{ fontFamily: 'monospace', color: '#38bdf8', fontWeight: 700 }}>{selectedTeam.utr_number || 'Not provided'}</span>
                </div>
                {selectedTeam.utr_number && (
                  <button
                    onClick={() => handleViewScreenshot(selectedTeam)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      marginTop: '10px',
                      padding: '6px 12px',
                      backgroundColor: '#1e293b',
                      color: '#a855f7',
                      border: '1px solid #334155',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontWeight: 600,
                    }}
                  >
                    <ImageIcon size={14} /> View Uploaded Screenshot
                  </button>
                )}
              </div>
            </div>

            {/* Internal Admin Notes */}
            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ color: '#94a3b8', fontSize: '12px', textTransform: 'uppercase', margin: '0 0 10px', letterSpacing: '0.05em' }}>
                Internal Admin Notes
              </h4>
              <textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Add notes for this team review..."
                rows={3}
                style={{
                  width: '100%',
                  padding: '10px',
                  backgroundColor: '#1e293b',
                  border: '1px solid #334155',
                  borderRadius: '8px',
                  color: '#f8fafc',
                  fontSize: '13px',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
              <button
                onClick={() => handleSaveNotes(selectedTeam)}
                disabled={actionLoading}
                style={{
                  marginTop: '8px',
                  padding: '6px 14px',
                  backgroundColor: '#3b82f6',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Save Notes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
