import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Users, UserPlus, LogOut, Search, Filter, Shield, 
  X, CheckCircle, AlertCircle, LoaderCircle, Eye, Star,
  GraduationCap
} from 'lucide-react'
import { adminApi } from '../../api/adminApi'

export function AdminDashboardPage() {
  const [admin, setAdmin] = useState(null)
  const [applicants, setApplicants] = useState([])
  const [subadmins, setSubadmins] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('applicants') // 'applicants' | 'subadmins'

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('')
  const [deptFilter, setDeptFilter] = useState('')
  const [sectionFilter, setSectionFilter] = useState('')
  const [yearFilter, setYearFilter] = useState('')

  // Drawer state
  const [selectedApplicant, setSelectedApplicant] = useState(null)

  // Sub-admin form state
  const [newRoll, setNewRoll] = useState('')
  const [newPass, setNewPass] = useState('')
  const [newDept, setNewDept] = useState('')
  const [newSec, setNewSec] = useState('')
  const [subAdminMsg, setSubAdminMsg] = useState({ type: '', text: '' })
  const [creatingSub, setCreatingSub] = useState(false)

  const navigate = useNavigate()

  const fetchInitialData = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      // Fetch me info
      const meData = await adminApi.getMe()
      setAdmin(meData.admin)

      // Fetch applicants
      const appData = await adminApi.getApplicants()
      setApplicants(appData.applicants || [])

      // If superadmin, fetch subadmins list
      if (meData.admin.role === 'superadmin') {
        const saData = await adminApi.getSubAdmins()
        setSubadmins(saData.subadmins || [])
      }
    } catch (err) {
      if (err.status === 401) {
        navigate('/admin/login')
      } else {
        setError(err.message || 'Failed to load dashboard data.')
      }
    } finally {
      setLoading(false)
    }
  }, [navigate])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchInitialData()
  }, [fetchInitialData])

  const handleLogout = () => {
    adminApi.logout()
    navigate('/admin/login')
  }

  const handleCreateSubAdmin = async (e) => {
    e.preventDefault()
    setSubAdminMsg({ type: '', text: '' })
    setCreatingSub(true)
    try {
      await adminApi.createSubAdmin({
        rollnumber: newRoll,
        password: newPass,
        assigned_department: newDept,
        assigned_section: newSec
      })
      setSubAdminMsg({ type: 'success', text: `Sub-admin ${newRoll.toUpperCase()} created successfully!` })
      setNewRoll('')
      setNewPass('')
      setNewDept('')
      setNewSec('')
      // Refresh subadmins list
      const saData = await adminApi.getSubAdmins()
      setSubadmins(saData.subadmins || [])
    } catch (err) {
      setSubAdminMsg({ type: 'error', text: err.message || 'Failed to create sub-admin' })
    } finally {
      setCreatingSub(false)
    }
  }

  // Filter applicants
  const filteredApplicants = applicants.filter(app => {
    const matchesSearch = 
      app.fullname.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.rollnumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.emailaddress.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.portfolio.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesDept = !deptFilter || app.department.toLowerCase() === deptFilter.toLowerCase()
    const matchesSec = !sectionFilter || app.section.toLowerCase() === sectionFilter.toLowerCase()
    const matchesYear = !yearFilter || app.year.toString() === yearFilter.toString()

    return matchesSearch && matchesDept && matchesSec && matchesYear
  })

  // Get unique departments and sections for filter dropdowns
  const uniqueDepts = Array.from(new Set(applicants.map(a => a.department))).filter(Boolean)
  const uniqueSections = Array.from(new Set(applicants.map(a => a.section))).filter(Boolean)

  if (loading) {
    return (
      <div style={{ minHeight: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', color: '#94a3b8' }}>
          <LoaderCircle className="spin" size={32} style={{ marginBottom: '1rem', color: '#6366f1' }} />
          <p>Loading Admin Dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '2rem 1rem', color: '#f8fafc' }}>
      {/* Top Header */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '1rem',
        paddingBottom: '1.5rem',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        marginBottom: '2rem'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <Shield size={22} style={{ color: '#6366f1' }} />
            <h1 style={{ fontSize: '1.75rem', fontWeight: '700', margin: 0, color: '#fff' }}>
              AARNA Admin Dashboard
            </h1>
          </div>
          <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.9rem' }}>
            Logged in as <strong style={{ color: '#6366f1' }}>{admin?.rollnumber}</strong> 
            <span style={{
              marginLeft: '8px',
              padding: '2px 8px',
              borderRadius: '12px',
              fontSize: '0.75rem',
              fontWeight: '600',
              background: admin?.role === 'superadmin' ? 'rgba(99, 102, 241, 0.2)' : 'rgba(16, 185, 129, 0.2)',
              color: admin?.role === 'superadmin' ? '#818cf8' : '#34d399',
              border: `1px solid ${admin?.role === 'superadmin' ? 'rgba(99, 102, 241, 0.4)' : 'rgba(16, 185, 129, 0.4)'}`
            }}>
              {admin?.role === 'superadmin' ? 'Super Admin' : `Sub-Admin (${admin?.assigned_department || 'All'} / ${admin?.assigned_section || 'All'})`}
            </span>
          </p>
        </div>

        <button
          onClick={handleLogout}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 16px',
            borderRadius: '8px',
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: '#fca5a5',
            fontWeight: '600',
            cursor: 'pointer',
            fontSize: '0.9rem',
            transition: 'background 0.2s'
          }}
        >
          <LogOut size={16} /> Sign Out
        </button>
      </div>

      {error && (
        <div style={{
          padding: '1rem',
          background: 'rgba(239, 68, 68, 0.15)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          borderRadius: '8px',
          color: '#fca5a5',
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      {/* Overview Stat Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '1.25rem',
        marginBottom: '2rem'
      }}>
        <div style={{
          background: 'rgba(15, 23, 42, 0.6)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '12px',
          padding: '1.25rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#94a3b8', fontSize: '0.85rem' }}>
            <span>Total Applicants</span>
            <Users size={18} style={{ color: '#6366f1' }} />
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: '700', color: '#fff', marginTop: '0.5rem' }}>
            {applicants.length}
          </div>
        </div>

        <div style={{
          background: 'rgba(15, 23, 42, 0.6)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '12px',
          padding: '1.25rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#94a3b8', fontSize: '0.85rem' }}>
            <span>Filtered Applicants</span>
            <Filter size={18} style={{ color: '#10b981' }} />
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: '700', color: '#fff', marginTop: '0.5rem' }}>
            {filteredApplicants.length}
          </div>
        </div>

        <div style={{
          background: 'rgba(15, 23, 42, 0.6)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '12px',
          padding: '1.25rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#94a3b8', fontSize: '0.85rem' }}>
            <span>Departments Represented</span>
            <GraduationCap size={18} style={{ color: '#f59e0b' }} />
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: '700', color: '#fff', marginTop: '0.5rem' }}>
            {uniqueDepts.length}
          </div>
        </div>

        {admin?.role === 'superadmin' && (
          <div style={{
            background: 'rgba(15, 23, 42, 0.6)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '12px',
            padding: '1.25rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#94a3b8', fontSize: '0.85rem' }}>
              <span>Sub-Admins Managed</span>
              <UserPlus size={18} style={{ color: '#ec4899' }} />
            </div>
            <div style={{ fontSize: '1.85rem', fontWeight: '700', color: '#fff', marginTop: '0.5rem' }}>
              {subadmins.length}
            </div>
          </div>
        )}
      </div>

      {/* Tabs navigation for Super Admin */}
      {admin?.role === 'superadmin' && (
        <div style={{ display: 'flex', gap: '8px', marginBottom: '1.5rem', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', paddingBottom: '8px' }}>
          <button
            onClick={() => setActiveTab('applicants')}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              border: 'none',
              background: activeTab === 'applicants' ? '#6366f1' : 'transparent',
              color: activeTab === 'applicants' ? '#fff' : '#94a3b8',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Users size={16} /> Applicants List
          </button>
          <button
            onClick={() => setActiveTab('subadmins')}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              border: 'none',
              background: activeTab === 'subadmins' ? '#6366f1' : 'transparent',
              color: activeTab === 'subadmins' ? '#fff' : '#94a3b8',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <UserPlus size={16} /> Manage Sub-Admins
          </button>
        </div>
      )}

      {/* TAB 1: Applicants List */}
      {activeTab === 'applicants' && (
        <div>
          {/* Search & Filter Controls */}
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '1rem',
            marginBottom: '1.5rem',
            background: 'rgba(15, 23, 42, 0.4)',
            padding: '1rem',
            borderRadius: '12px',
            border: '1px solid rgba(255, 255, 255, 0.06)'
          }}>
            <div style={{ flex: '1 1 250px', position: 'relative' }}>
              <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
              <input
                type="text"
                placeholder="Search by name, roll no, email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px 9px 38px',
                  borderRadius: '8px',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  background: 'rgba(30, 41, 59, 0.8)',
                  color: '#fff',
                  fontSize: '0.9rem',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              style={{
                padding: '9px 12px',
                borderRadius: '8px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                background: 'rgba(30, 41, 59, 0.8)',
                color: '#fff',
                fontSize: '0.9rem',
                outline: 'none'
              }}
            >
              <option value="">All Departments</option>
              {uniqueDepts.map(d => <option key={d} value={d}>{d}</option>)}
            </select>

            <select
              value={sectionFilter}
              onChange={(e) => setSectionFilter(e.target.value)}
              style={{
                padding: '9px 12px',
                borderRadius: '8px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                background: 'rgba(30, 41, 59, 0.8)',
                color: '#fff',
                fontSize: '0.9rem',
                outline: 'none'
              }}
            >
              <option value="">All Sections</option>
              {uniqueSections.map(s => <option key={s} value={s}>Sec {s}</option>)}
            </select>

            <select
              value={yearFilter}
              onChange={(e) => setYearFilter(e.target.value)}
              style={{
                padding: '9px 12px',
                borderRadius: '8px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                background: 'rgba(30, 41, 59, 0.8)',
                color: '#fff',
                fontSize: '0.9rem',
                outline: 'none'
              }}
            >
              <option value="">All Years</option>
              <option value="1">1st Year</option>
              <option value="2">2nd Year</option>
              <option value="3">3rd Year</option>
              <option value="4">4th Year</option>
            </select>
          </div>

          {/* Table Container */}
          <div style={{
            background: 'rgba(15, 23, 42, 0.6)',
            borderRadius: '12px',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            overflowX: 'auto'
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ background: 'rgba(30, 41, 59, 0.8)', color: '#94a3b8', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
                  <th style={{ padding: '12px 16px' }}>Applicant</th>
                  <th style={{ padding: '12px 16px' }}>Roll Number</th>
                  <th style={{ padding: '12px 16px' }}>Dept / Sec / Year</th>
                  <th style={{ padding: '12px 16px' }}>Portfolio</th>
                  <th style={{ padding: '12px 16px' }}>Leadership Rating</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredApplicants.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
                      No applicants found matching your criteria.
                    </td>
                  </tr>
                ) : (
                  filteredApplicants.map((app) => (
                    <tr
                      key={app.id}
                      style={{
                        borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                        transition: 'background 0.15s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      <td style={{ padding: '12px 16px' }}>
                        <strong style={{ color: '#fff', display: 'block' }}>{app.fullname}</strong>
                        <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{app.emailaddress}</span>
                      </td>
                      <td style={{ padding: '12px 16px', fontWeight: '500', color: '#cbd5e1' }}>
                        {app.rollnumber}
                      </td>
                      <td style={{ padding: '12px 16px', color: '#cbd5e1' }}>
                        {app.department} • Sec {app.section} • Year {app.year}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{
                          padding: '4px 10px',
                          borderRadius: '12px',
                          background: 'rgba(99, 102, 241, 0.15)',
                          color: '#818cf8',
                          fontSize: '0.8rem',
                          fontWeight: '500'
                        }}>
                          {app.portfolio}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#f59e0b' }}>
                          <Star size={14} fill="#f59e0b" />
                          <span>{app.leadershiprating} / 10</span>
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                        <button
                          onClick={() => setSelectedApplicant(app)}
                          style={{
                            padding: '6px 12px',
                            borderRadius: '6px',
                            background: 'rgba(255, 255, 255, 0.08)',
                            border: '1px solid rgba(255, 255, 255, 0.15)',
                            color: '#fff',
                            fontSize: '0.8rem',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          <Eye size={14} /> View Details
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: Manage Sub-Admins (Super Admin Only) */}
      {activeTab === 'subadmins' && admin?.role === 'superadmin' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem' }}>
          {/* Create Form */}
          <div style={{
            background: 'rgba(15, 23, 42, 0.6)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '12px',
            padding: '1.5rem'
          }}>
            <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.2rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <UserPlus size={20} style={{ color: '#6366f1' }} /> Create Sub-Admin Account
            </h3>

            {subAdminMsg.text && (
              <div style={{
                padding: '10px 14px',
                borderRadius: '6px',
                marginBottom: '1rem',
                fontSize: '0.875rem',
                background: subAdminMsg.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                color: subAdminMsg.type === 'success' ? '#6ee7b7' : '#fca5a5',
                border: `1px solid ${subAdminMsg.type === 'success' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`
              }}>
                {subAdminMsg.text}
              </div>
            )}

            <form onSubmit={handleCreateSubAdmin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: '#cbd5e1', marginBottom: '4px' }}>
                  Roll Number *
                </label>
                <input
                  type="text"
                  placeholder="e.g. 21CS001"
                  value={newRoll}
                  onChange={(e) => setNewRoll(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    background: 'rgba(30, 41, 59, 0.8)',
                    color: '#fff',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: '#cbd5e1', marginBottom: '4px' }}>
                  Password *
                </label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={newPass}
                  onChange={(e) => setNewPass(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    background: 'rgba(30, 41, 59, 0.8)',
                    color: '#fff',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: '#cbd5e1', marginBottom: '4px' }}>
                  Assigned Department (Leave empty for All)
                </label>
                <input
                  type="text"
                  placeholder="e.g. CSE or ECE"
                  value={newDept}
                  onChange={(e) => setNewDept(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    background: 'rgba(30, 41, 59, 0.8)',
                    color: '#fff',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: '#cbd5e1', marginBottom: '4px' }}>
                  Assigned Section (Leave empty for All)
                </label>
                <input
                  type="text"
                  placeholder="e.g. A or B"
                  value={newSec}
                  onChange={(e) => setNewSec(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    background: 'rgba(30, 41, 59, 0.8)',
                    color: '#fff',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={creatingSub}
                style={{
                  marginTop: '0.5rem',
                  padding: '10px',
                  borderRadius: '6px',
                  border: 'none',
                  background: '#6366f1',
                  color: '#fff',
                  fontWeight: '600',
                  cursor: creatingSub ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                {creatingSub ? <LoaderCircle className="spin" size={16} /> : <CheckCircle size={16} />} Create Sub-Admin
              </button>
            </form>
          </div>

          {/* Sub-Admins List */}
          <div style={{
            background: 'rgba(15, 23, 42, 0.6)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '12px',
            padding: '1.5rem'
          }}>
            <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.2rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Shield size={20} style={{ color: '#10b981' }} /> Existing Sub-Admins
            </h3>

            {subadmins.length === 0 ? (
              <p style={{ color: '#64748b', fontSize: '0.9rem' }}>No sub-admins have been created yet.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {subadmins.map((sa) => (
                  <div
                    key={sa.id}
                    style={{
                      padding: '12px 16px',
                      borderRadius: '8px',
                      background: 'rgba(30, 41, 59, 0.6)',
                      border: '1px solid rgba(255, 255, 255, 0.06)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}
                  >
                    <div>
                      <strong style={{ color: '#fff', display: 'block' }}>{sa.rollnumber}</strong>
                      <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                        Dept: {sa.assigned_department} | Sec: {sa.assigned_section}
                      </span>
                    </div>
                    <span style={{
                      fontSize: '0.75rem',
                      padding: '2px 8px',
                      borderRadius: '10px',
                      background: 'rgba(16, 185, 129, 0.15)',
                      color: '#34d399'
                    }}>
                      Active
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Applicant Detail Drawer Modal */}
      {selectedApplicant && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          justifyContent: 'flex-end',
          zIndex: 1000
        }}>
          <div style={{
            maxWidth: '540px',
            width: '100%',
            height: '100%',
            background: '#0f172a',
            borderLeft: '1px solid rgba(255, 255, 255, 0.1)',
            padding: '2rem',
            overflowY: 'auto',
            position: 'relative',
            boxSizing: 'border-box'
          }}>
            <button
              onClick={() => setSelectedApplicant(null)}
              style={{
                position: 'absolute',
                top: '1.5rem',
                right: '1.5rem',
                background: 'rgba(255, 255, 255, 0.08)',
                border: 'none',
                color: '#fff',
                borderRadius: '50%',
                width: '36px',
                height: '36px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}
            >
              <X size={20} />
            </button>

            <span style={{ color: '#6366f1', fontSize: '0.8rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Applicant Profile
            </span>
            <h2 style={{ fontSize: '1.5rem', fontWeight: '700', margin: '0.25rem 0 1rem 0', color: '#fff' }}>
              {selectedApplicant.fullname}
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginTop: '1.5rem' }}>
              <div style={{ background: 'rgba(30, 41, 59, 0.5)', padding: '1rem', borderRadius: '8px' }}>
                <h4 style={{ margin: '0 0 0.5rem 0', color: '#94a3b8', fontSize: '0.8rem', textTransform: 'uppercase' }}>Contact Info</h4>
                <p style={{ margin: '2px 0', fontSize: '0.9rem' }}><strong>Email:</strong> {selectedApplicant.emailaddress}</p>
                <p style={{ margin: '2px 0', fontSize: '0.9rem' }}><strong>Phone:</strong> {selectedApplicant.mobilenumber}</p>
                <p style={{ margin: '2px 0', fontSize: '0.9rem' }}><strong>Roll Number:</strong> {selectedApplicant.rollnumber}</p>
              </div>

              <div style={{ background: 'rgba(30, 41, 59, 0.5)', padding: '1rem', borderRadius: '8px' }}>
                <h4 style={{ margin: '0 0 0.5rem 0', color: '#94a3b8', fontSize: '0.8rem', textTransform: 'uppercase' }}>Academic Info</h4>
                <p style={{ margin: '2px 0', fontSize: '0.9rem' }}><strong>Department:</strong> {selectedApplicant.department}</p>
                <p style={{ margin: '2px 0', fontSize: '0.9rem' }}><strong>Section:</strong> {selectedApplicant.section}</p>
                <p style={{ margin: '2px 0', fontSize: '0.9rem' }}><strong>Year:</strong> {selectedApplicant.year}</p>
                <p style={{ margin: '2px 0', fontSize: '0.9rem' }}><strong>Portfolio Preference:</strong> {selectedApplicant.portfolio}</p>
              </div>

              <div style={{ background: 'rgba(30, 41, 59, 0.5)', padding: '1rem', borderRadius: '8px' }}>
                <h4 style={{ margin: '0 0 0.5rem 0', color: '#94a3b8', fontSize: '0.8rem', textTransform: 'uppercase' }}>Skills & Experience</h4>
                <p style={{ margin: '2px 0 8px 0', fontSize: '0.9rem' }}><strong>Skills:</strong> {selectedApplicant.skills}</p>
                <p style={{ margin: '2px 0', fontSize: '0.9rem' }}><strong>Previous Club:</strong> {selectedApplicant.previousclub}</p>
                <p style={{ margin: '2px 0', fontSize: '0.9rem' }}><strong>Current Club:</strong> {selectedApplicant.currentclub}</p>
                <p style={{ margin: '2px 0', fontSize: '0.9rem' }}><strong>Leadership Rating:</strong> {selectedApplicant.leadershiprating} / 10</p>
              </div>

              <div style={{ background: 'rgba(30, 41, 59, 0.5)', padding: '1rem', borderRadius: '8px' }}>
                <h4 style={{ margin: '0 0 0.5rem 0', color: '#94a3b8', fontSize: '0.8rem', textTransform: 'uppercase' }}>Why Join AARNA</h4>
                <p style={{ margin: 0, fontSize: '0.9rem', color: '#cbd5e1', lineHeight: '1.5' }}>
                  {selectedApplicant.whyjoinaarna}
                </p>
              </div>

              <div style={{ background: 'rgba(30, 41, 59, 0.5)', padding: '1rem', borderRadius: '8px' }}>
                <h4 style={{ margin: '0 0 0.5rem 0', color: '#94a3b8', fontSize: '0.8rem', textTransform: 'uppercase' }}>How They Heard About AARNA</h4>
                <p style={{ margin: 0, fontSize: '0.9rem', color: '#cbd5e1', lineHeight: '1.5' }}>
                  {selectedApplicant.knowaboutaarna}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
