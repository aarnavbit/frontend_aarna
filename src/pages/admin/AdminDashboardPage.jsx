import { useEffect, useState, useCallback, useMemo, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Users, UserPlus, LogOut, Search, Filter, Shield, 
  X, CheckCircle, AlertCircle, LoaderCircle, Eye, Star,
  GraduationCap, Download, ChevronLeft, ChevronRight,
  ArrowUpDown, ArrowUp, ArrowDown, Briefcase, ChevronDown,
  FileSpreadsheet, FileText, RefreshCw, Sparkles
} from 'lucide-react'
import * as XLSX from 'xlsx'
import { adminApi } from '../../api/adminApi'

const ITEMS_PER_PAGE = 10

const RAW_DB_EXPORT_COLUMNS = [
  'fullname',
  'emailaddress',
  'rollnumber',
  'mobilenumber',
  'department',
  'section',
  'year',
  'portfolio',
  'knowaboutaarna',
  'whyjoinaarna',
  'skills',
  'previousclub',
  'currentclub',
  'leadershiprating'
]

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
  const [portfolioFilter, setPortfolioFilter] = useState('')

  // Sorting state
  const [sortKey, setSortKey] = useState('id')
  const [sortOrder, setSortOrder] = useState('desc') // 'asc' | 'desc'

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)

  // Export dropdown state
  const [exportOpen, setExportOpen] = useState(false)
  const exportRef = useRef(null)

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

  // Close export dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (exportRef.current && !exportRef.current.contains(event.target)) {
        setExportOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

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
  const filteredApplicants = useMemo(() => {
    return applicants.filter(app => {
      const term = searchTerm.trim().toLowerCase()
      const matchesSearch = !term || 
        (app.fullname && app.fullname.toLowerCase().includes(term)) ||
        (app.rollnumber && app.rollnumber.toLowerCase().includes(term)) ||
        (app.emailaddress && app.emailaddress.toLowerCase().includes(term)) ||
        (app.mobilenumber && app.mobilenumber.toLowerCase().includes(term)) ||
        (app.portfolio && app.portfolio.toLowerCase().includes(term)) ||
        (app.skills && app.skills.toLowerCase().includes(term)) ||
        (app.previousclub && app.previousclub.toLowerCase().includes(term)) ||
        (app.currentclub && app.currentclub.toLowerCase().includes(term))
      
      const matchesDept = !deptFilter || (app.department && app.department.toLowerCase() === deptFilter.toLowerCase())
      const matchesSec = !sectionFilter || (app.section && app.section.toLowerCase() === sectionFilter.toLowerCase())
      const matchesYear = !yearFilter || (app.year && app.year.toString() === yearFilter.toString())
      const matchesPortfolio = !portfolioFilter || (app.portfolio && app.portfolio.toLowerCase().includes(portfolioFilter.toLowerCase()))

      return matchesSearch && matchesDept && matchesSec && matchesYear && matchesPortfolio
    })
  }, [applicants, searchTerm, deptFilter, sectionFilter, yearFilter, portfolioFilter])

  // Reset to page 1 whenever filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, deptFilter, sectionFilter, yearFilter, portfolioFilter])

  // Sort applicants
  const sortedApplicants = useMemo(() => {
    const list = [...filteredApplicants]
    if (!sortKey) return list

    return list.sort((a, b) => {
      let valA = a[sortKey] ?? ''
      let valB = b[sortKey] ?? ''

      if (typeof valA === 'string') valA = valA.toLowerCase()
      if (typeof valB === 'string') valB = valB.toLowerCase()

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1
      return 0
    })
  }, [filteredApplicants, sortKey, sortOrder])

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(sortedApplicants.length / ITEMS_PER_PAGE))
  const paginatedApplicants = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
    return sortedApplicants.slice(startIndex, startIndex + ITEMS_PER_PAGE)
  }, [sortedApplicants, currentPage])

  // Unique options for filter dropdowns
  const uniqueDepts = useMemo(() => Array.from(new Set(applicants.map(a => a.department))).filter(Boolean).sort(), [applicants])
  const uniqueSections = useMemo(() => Array.from(new Set(applicants.map(a => a.section))).filter(Boolean).sort(), [applicants])
  const uniquePortfolios = useMemo(() => Array.from(new Set(applicants.map(a => a.portfolio))).filter(Boolean).sort(), [applicants])

  // Column sort click handler
  const handleSort = (key) => {
    if (sortKey === key) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortOrder('asc')
    }
  }

  const renderSortIcon = (key) => {
    if (sortKey !== key) {
      return <ArrowUpDown size={13} style={{ opacity: 0.4, marginLeft: '4px' }} />
    }
    return sortOrder === 'asc' 
      ? <ArrowUp size={13} style={{ color: '#818cf8', marginLeft: '4px' }} />
      : <ArrowDown size={13} style={{ color: '#818cf8', marginLeft: '4px' }} />
  }

  // Export handling using SheetJS (xlsx)
  const triggerExport = (dataToExport, format, scopeLabel) => {
    setExportOpen(false)
    if (!dataToExport || dataToExport.length === 0) {
      alert('No data available to export.')
      return
    }

    // Map each item strictly to raw database column names requested
    const formattedData = dataToExport.map(app => ({
      fullname: app.fullname || '',
      emailaddress: app.emailaddress || '',
      rollnumber: app.rollnumber || '',
      mobilenumber: app.mobilenumber || '',
      department: app.department || '',
      section: app.section || '',
      year: app.year || '',
      portfolio: app.portfolio || '',
      knowaboutaarna: app.knowaboutaarna || '',
      whyjoinaarna: app.whyjoinaarna || '',
      skills: app.skills || '',
      previousclub: app.previousclub || '',
      currentclub: app.currentclub || '',
      leadershiprating: app.leadershiprating ?? ''
    }))

    const worksheet = XLSX.utils.json_to_sheet(formattedData, { header: RAW_DB_EXPORT_COLUMNS })
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Applicants')

    const dateStr = new Date().toISOString().split('T')[0]
    const fileName = `AARNA_Applicants_${scopeLabel}_${dateStr}.${format}`

    if (format === 'csv') {
      XLSX.writeFile(workbook, fileName, { bookType: 'csv' })
    } else {
      XLSX.writeFile(workbook, fileName, { bookType: 'xlsx' })
    }
  }

  if (loading) {
    return (
      <div style={{ minHeight: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', color: '#94a3b8' }}>
          <LoaderCircle className="spin" size={36} style={{ marginBottom: '1rem', color: '#6366f1' }} />
          <p style={{ fontSize: '1rem', fontWeight: '500' }}>Loading Admin Dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '2rem 1.5rem', color: '#f8fafc' }}>
      {/* Top Header */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '1.5rem',
        paddingBottom: '1.5rem',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        marginBottom: '2rem'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(168, 85, 247, 0.2))',
              border: '1px solid rgba(99, 102, 241, 0.3)'
            }}>
              <Shield size={24} style={{ color: '#818cf8' }} />
            </div>
            <h1 style={{ fontSize: '1.85rem', fontWeight: '800', margin: 0, color: '#fff', letterSpacing: '-0.02em' }}>
              AARNA Admin Dashboard
            </h1>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.9rem' }}>
              Logged in as <strong style={{ color: '#6366f1' }}>{admin?.rollnumber}</strong>
            </p>
            <span style={{
              padding: '3px 10px',
              borderRadius: '12px',
              fontSize: '0.75rem',
              fontWeight: '600',
              background: admin?.role === 'superadmin' ? 'rgba(99, 102, 241, 0.2)' : 'rgba(16, 185, 129, 0.2)',
              color: admin?.role === 'superadmin' ? '#818cf8' : '#34d399',
              border: `1px solid ${admin?.role === 'superadmin' ? 'rgba(99, 102, 241, 0.4)' : 'rgba(16, 185, 129, 0.4)'}`
            }}>
              {admin?.role === 'superadmin' ? 'Super Admin' : `Sub-Admin (${admin?.assigned_department || 'All'} / ${admin?.assigned_section || 'All'})`}
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {/* Refresh Data button */}
          <button
            onClick={fetchInitialData}
            title="Refresh Data"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '9px 14px',
              borderRadius: '8px',
              background: 'rgba(30, 41, 59, 0.8)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              color: '#cbd5e1',
              fontWeight: '500',
              cursor: 'pointer',
              fontSize: '0.875rem',
              transition: 'all 0.2s'
            }}
          >
            <RefreshCw size={15} /> Refresh
          </button>

          {/* Export Dropdown Button */}
          <div ref={exportRef} style={{ position: 'relative' }}>
            <button
              onClick={() => setExportOpen(prev => !prev)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '9px 16px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                border: 'none',
                color: '#fff',
                fontWeight: '600',
                cursor: 'pointer',
                fontSize: '0.875rem',
                boxShadow: '0 4px 14px rgba(79, 70, 229, 0.35)',
                transition: 'transform 0.15s, boxShadow 0.15s'
              }}
            >
              <Download size={16} />
              <span>Export Data</span>
              <ChevronDown size={15} style={{ transform: exportOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }} />
            </button>

            {exportOpen && (
              <div style={{
                position: 'absolute',
                top: 'calc(100% + 6px)',
                right: 0,
                width: '240px',
                background: '#0f172a',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: '10px',
                boxShadow: '0 12px 30px rgba(0, 0, 0, 0.5)',
                zIndex: 100,
                overflow: 'hidden',
                padding: '6px'
              }}>
                <div style={{ padding: '6px 10px', fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', color: '#64748b', letterSpacing: '0.05em' }}>
                  Filtered Data ({filteredApplicants.length})
                </div>
                <button
                  onClick={() => triggerExport(sortedApplicants, 'csv', 'Filtered')}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    padding: '8px 10px',
                    borderRadius: '6px',
                    background: 'transparent',
                    border: 'none',
                    color: '#e2e8f0',
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    transition: 'background 0.15s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(99, 102, 241, 0.15)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <FileText size={15} style={{ color: '#38bdf8' }} /> Export Filtered as CSV
                </button>
                <button
                  onClick={() => triggerExport(sortedApplicants, 'xlsx', 'Filtered')}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    padding: '8px 10px',
                    borderRadius: '6px',
                    background: 'transparent',
                    border: 'none',
                    color: '#e2e8f0',
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    transition: 'background 0.15s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(99, 102, 241, 0.15)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <FileSpreadsheet size={15} style={{ color: '#34d399' }} /> Export Filtered as XLSX
                </button>

                <div style={{ height: '1px', background: 'rgba(255, 255, 255, 0.08)', margin: '6px 0' }} />

                <div style={{ padding: '6px 10px', fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', color: '#64748b', letterSpacing: '0.05em' }}>
                  All Database Data ({applicants.length})
                </div>
                <button
                  onClick={() => triggerExport(applicants, 'csv', 'All')}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    padding: '8px 10px',
                    borderRadius: '6px',
                    background: 'transparent',
                    border: 'none',
                    color: '#e2e8f0',
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    transition: 'background 0.15s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(99, 102, 241, 0.15)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <FileText size={15} style={{ color: '#818cf8' }} /> Export All as CSV
                </button>
                <button
                  onClick={() => triggerExport(applicants, 'xlsx', 'All')}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    padding: '8px 10px',
                    borderRadius: '6px',
                    background: 'transparent',
                    border: 'none',
                    color: '#e2e8f0',
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    transition: 'background 0.15s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(99, 102, 241, 0.15)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <FileSpreadsheet size={15} style={{ color: '#a78bfa' }} /> Export All as XLSX
                </button>
              </div>
            )}
          </div>

          {/* Sign Out */}
          <button
            onClick={handleLogout}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '9px 14px',
              borderRadius: '8px',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#fca5a5',
              fontWeight: '600',
              cursor: 'pointer',
              fontSize: '0.875rem',
              transition: 'background 0.2s'
            }}
          >
            <LogOut size={16} /> Sign Out
          </button>
        </div>
      </div>

      {error && (
        <div style={{
          padding: '1.25rem',
          background: 'rgba(239, 68, 68, 0.15)',
          border: '1px solid rgba(239, 68, 68, 0.35)',
          borderRadius: '10px',
          color: '#fca5a5',
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <AlertCircle size={22} style={{ flexShrink: 0, color: '#f87171' }} />
            <div>
              <strong style={{ display: 'block', color: '#fff', fontSize: '0.95rem' }}>Data Fetch Error</strong>
              <span style={{ fontSize: '0.875rem' }}>{error}</span>
            </div>
          </div>
          <button
            onClick={fetchInitialData}
            style={{
              padding: '6px 14px',
              borderRadius: '6px',
              background: 'rgba(239, 68, 68, 0.25)',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              color: '#fff',
              fontWeight: '600',
              cursor: 'pointer',
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <RefreshCw size={14} /> Retry Connection
          </button>
        </div>
      )}

      {!error && applicants.length === 0 && (
        <div style={{
          padding: '1.25rem',
          background: 'rgba(99, 102, 241, 0.12)',
          border: '1px solid rgba(99, 102, 241, 0.3)',
          borderRadius: '10px',
          color: '#c7d2fe',
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <Sparkles size={22} style={{ color: '#818cf8', flexShrink: 0 }} />
          <div>
            <strong style={{ display: 'block', color: '#fff', fontSize: '0.95rem' }}>No Registration Data Yet</strong>
            <span style={{ fontSize: '0.875rem', color: '#a5b4fc' }}>
              The database is currently connected but has 0 applicant records. When users submit the recruitment form at <code style={{ color: '#fff', background: 'rgba(0,0,0,0.3)', padding: '2px 6px', borderRadius: '4px' }}>/apply</code>, their entries will immediately appear here.
            </span>
          </div>
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
          background: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '12px',
          padding: '1.25rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#94a3b8', fontSize: '0.85rem' }}>
            <span>Total Applicants</span>
            <Users size={18} style={{ color: '#6366f1' }} />
          </div>
          <div style={{ fontSize: '1.9rem', fontWeight: '800', color: '#fff', marginTop: '0.5rem' }}>
            {applicants.length}
          </div>
        </div>

        <div style={{
          background: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '12px',
          padding: '1.25rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#94a3b8', fontSize: '0.85rem' }}>
            <span>Matching Filter</span>
            <Filter size={18} style={{ color: '#10b981' }} />
          </div>
          <div style={{ fontSize: '1.9rem', fontWeight: '800', color: '#fff', marginTop: '0.5rem' }}>
            {filteredApplicants.length}
          </div>
        </div>

        <div style={{
          background: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '12px',
          padding: '1.25rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#94a3b8', fontSize: '0.85rem' }}>
            <span>Departments</span>
            <GraduationCap size={18} style={{ color: '#f59e0b' }} />
          </div>
          <div style={{ fontSize: '1.9rem', fontWeight: '800', color: '#fff', marginTop: '0.5rem' }}>
            {uniqueDepts.length}
          </div>
        </div>

        <div style={{
          background: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '12px',
          padding: '1.25rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#94a3b8', fontSize: '0.85rem' }}>
            <span>Portfolios</span>
            <Briefcase size={18} style={{ color: '#a855f7' }} />
          </div>
          <div style={{ fontSize: '1.9rem', fontWeight: '800', color: '#fff', marginTop: '0.5rem' }}>
            {uniquePortfolios.length}
          </div>
        </div>

        {admin?.role === 'superadmin' && (
          <div style={{
            background: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '12px',
            padding: '1.25rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#94a3b8', fontSize: '0.85rem' }}>
              <span>Sub-Admins</span>
              <UserPlus size={18} style={{ color: '#ec4899' }} />
            </div>
            <div style={{ fontSize: '1.9rem', fontWeight: '800', color: '#fff', marginTop: '0.5rem' }}>
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
              padding: '8px 18px',
              borderRadius: '6px',
              border: 'none',
              background: activeTab === 'applicants' ? '#6366f1' : 'transparent',
              color: activeTab === 'applicants' ? '#fff' : '#94a3b8',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.9rem'
            }}
          >
            <Users size={16} /> Applicants List ({applicants.length})
          </button>
          <button
            onClick={() => setActiveTab('subadmins')}
            style={{
              padding: '8px 18px',
              borderRadius: '6px',
              border: 'none',
              background: activeTab === 'subadmins' ? '#6366f1' : 'transparent',
              color: activeTab === 'subadmins' ? '#fff' : '#94a3b8',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.9rem'
            }}
          >
            <UserPlus size={16} /> Manage Sub-Admins ({subadmins.length})
          </button>
        </div>
      )}

      {/* TAB 1: Applicants List */}
      {activeTab === 'applicants' && (
        <div>
          {/* Filter Bar */}
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '0.85rem',
            marginBottom: '1.25rem',
            background: 'rgba(15, 23, 42, 0.5)',
            padding: '1rem',
            borderRadius: '12px',
            border: '1px solid rgba(255, 255, 255, 0.08)'
          }}>
            {/* Search Input */}
            <div style={{ flex: '1 1 240px', position: 'relative' }}>
              <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
              <input
                type="text"
                placeholder="Search by name, roll, email, skills..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px 9px 38px',
                  borderRadius: '8px',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  background: 'rgba(30, 41, 59, 0.8)',
                  color: '#fff',
                  fontSize: '0.875rem',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  style={{
                    position: 'absolute',
                    right: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: '#94a3b8',
                    cursor: 'pointer',
                    padding: '2px'
                  }}
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Department Filter */}
            <select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              style={{
                padding: '9px 12px',
                borderRadius: '8px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                background: 'rgba(30, 41, 59, 0.8)',
                color: '#fff',
                fontSize: '0.875rem',
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              <option value="">All Departments</option>
              {uniqueDepts.map(d => <option key={d} value={d}>{d}</option>)}
            </select>

            {/* Section Filter */}
            <select
              value={sectionFilter}
              onChange={(e) => setSectionFilter(e.target.value)}
              style={{
                padding: '9px 12px',
                borderRadius: '8px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                background: 'rgba(30, 41, 59, 0.8)',
                color: '#fff',
                fontSize: '0.875rem',
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              <option value="">All Sections</option>
              {uniqueSections.map(s => <option key={s} value={s}>Sec {s}</option>)}
            </select>

            {/* Year Filter */}
            <select
              value={yearFilter}
              onChange={(e) => setYearFilter(e.target.value)}
              style={{
                padding: '9px 12px',
                borderRadius: '8px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                background: 'rgba(30, 41, 59, 0.8)',
                color: '#fff',
                fontSize: '0.875rem',
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              <option value="">All Years</option>
              <option value="1">1st Year</option>
              <option value="2">2nd Year</option>
              <option value="3">3rd Year</option>
              <option value="4">4th Year</option>
            </select>

            {/* Portfolio Filter */}
            <select
              value={portfolioFilter}
              onChange={(e) => setPortfolioFilter(e.target.value)}
              style={{
                padding: '9px 12px',
                borderRadius: '8px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                background: 'rgba(30, 41, 59, 0.8)',
                color: '#fff',
                fontSize: '0.875rem',
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              <option value="">All Portfolios</option>
              {uniquePortfolios.map(p => <option key={p} value={p}>{p}</option>)}
            </select>

            {/* Reset Filters button */}
            {(searchTerm || deptFilter || sectionFilter || yearFilter || portfolioFilter) && (
              <button
                onClick={() => {
                  setSearchTerm('')
                  setDeptFilter('')
                  setSectionFilter('')
                  setYearFilter('')
                  setPortfolioFilter('')
                }}
                style={{
                  padding: '9px 12px',
                  borderRadius: '8px',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  background: 'rgba(239, 68, 68, 0.1)',
                  color: '#fca5a5',
                  fontSize: '0.85rem',
                  fontWeight: '500',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <X size={14} /> Clear Filters
              </button>
            )}
          </div>

          {/* Table Container - Shows ALL database columns with sorting */}
          <div style={{
            background: 'rgba(15, 23, 42, 0.65)',
            borderRadius: '12px',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            overflowX: 'auto',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)'
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem', whiteSpace: 'nowrap' }}>
              <thead>
                <tr style={{ background: 'rgba(30, 41, 59, 0.9)', color: '#94a3b8', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
                  <th onClick={() => handleSort('fullname')} style={{ padding: '12px 14px', cursor: 'pointer', userSelect: 'none' }}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <span>Full Name</span> {renderSortIcon('fullname')}
                    </div>
                  </th>
                  <th onClick={() => handleSort('rollnumber')} style={{ padding: '12px 14px', cursor: 'pointer', userSelect: 'none' }}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <span>Roll No</span> {renderSortIcon('rollnumber')}
                    </div>
                  </th>
                  <th onClick={() => handleSort('mobilenumber')} style={{ padding: '12px 14px', cursor: 'pointer', userSelect: 'none' }}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <span>Mobile</span> {renderSortIcon('mobilenumber')}
                    </div>
                  </th>
                  <th onClick={() => handleSort('department')} style={{ padding: '12px 14px', cursor: 'pointer', userSelect: 'none' }}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <span>Dept</span> {renderSortIcon('department')}
                    </div>
                  </th>
                  <th onClick={() => handleSort('section')} style={{ padding: '12px 14px', cursor: 'pointer', userSelect: 'none' }}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <span>Sec</span> {renderSortIcon('section')}
                    </div>
                  </th>
                  <th onClick={() => handleSort('year')} style={{ padding: '12px 14px', cursor: 'pointer', userSelect: 'none' }}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <span>Year</span> {renderSortIcon('year')}
                    </div>
                  </th>
                  <th onClick={() => handleSort('portfolio')} style={{ padding: '12px 14px', cursor: 'pointer', userSelect: 'none' }}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <span>Portfolio</span> {renderSortIcon('portfolio')}
                    </div>
                  </th>
                  <th onClick={() => handleSort('leadershiprating')} style={{ padding: '12px 14px', cursor: 'pointer', userSelect: 'none' }}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <span>Rating</span> {renderSortIcon('leadershiprating')}
                    </div>
                  </th>
                  <th onClick={() => handleSort('skills')} style={{ padding: '12px 14px', cursor: 'pointer', userSelect: 'none' }}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <span>Skills</span> {renderSortIcon('skills')}
                    </div>
                  </th>
                  <th onClick={() => handleSort('previousclub')} style={{ padding: '12px 14px', cursor: 'pointer', userSelect: 'none' }}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <span>Prev Club</span> {renderSortIcon('previousclub')}
                    </div>
                  </th>
                  <th onClick={() => handleSort('currentclub')} style={{ padding: '12px 14px', cursor: 'pointer', userSelect: 'none' }}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <span>Current Club</span> {renderSortIcon('currentclub')}
                    </div>
                  </th>
                  <th onClick={() => handleSort('knowaboutaarna')} style={{ padding: '12px 14px', cursor: 'pointer', userSelect: 'none' }}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <span>How Heard</span> {renderSortIcon('knowaboutaarna')}
                    </div>
                  </th>
                  <th onClick={() => handleSort('whyjoinaarna')} style={{ padding: '12px 14px', cursor: 'pointer', userSelect: 'none' }}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <span>Why Join</span> {renderSortIcon('whyjoinaarna')}
                    </div>
                  </th>
                  <th style={{ padding: '12px 14px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedApplicants.length === 0 ? (
                  <tr>
                    <td colSpan="14" style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
                      No applicants found matching your criteria.
                    </td>
                  </tr>
                ) : (
                  paginatedApplicants.map((app) => (
                    <tr
                      key={app.id}
                      style={{
                        borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                        transition: 'background 0.15s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      {/* Name & Email */}
                      <td style={{ padding: '12px 14px' }}>
                        <strong style={{ color: '#fff', display: 'block', fontWeight: '600' }}>{app.fullname}</strong>
                        <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>{app.emailaddress}</span>
                      </td>
                      {/* Roll Number */}
                      <td style={{ padding: '12px 14px', fontWeight: '600', color: '#cbd5e1' }}>
                        {app.rollnumber}
                      </td>
                      {/* Phone */}
                      <td style={{ padding: '12px 14px', color: '#cbd5e1' }}>
                        {app.mobilenumber}
                      </td>
                      {/* Dept */}
                      <td style={{ padding: '12px 14px', color: '#cbd5e1' }}>
                        {app.department}
                      </td>
                      {/* Sec */}
                      <td style={{ padding: '12px 14px', color: '#cbd5e1' }}>
                        {app.section}
                      </td>
                      {/* Year */}
                      <td style={{ padding: '12px 14px', color: '#cbd5e1' }}>
                        {app.year}
                      </td>
                      {/* Portfolio */}
                      <td style={{ padding: '12px 14px' }}>
                        <span style={{
                          padding: '3px 8px',
                          borderRadius: '10px',
                          background: 'rgba(99, 102, 241, 0.15)',
                          color: '#818cf8',
                          fontSize: '0.78rem',
                          fontWeight: '500'
                        }}>
                          {app.portfolio}
                        </span>
                      </td>
                      {/* Leadership Rating */}
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#f59e0b', fontWeight: '600' }}>
                          <Star size={13} fill="#f59e0b" />
                          <span>{app.leadershiprating}/10</span>
                        </div>
                      </td>
                      {/* Skills */}
                      <td style={{ padding: '12px 14px', maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', color: '#cbd5e1' }} title={app.skills}>
                        {app.skills || 'N/A'}
                      </td>
                      {/* Prev Club */}
                      <td style={{ padding: '12px 14px', color: '#cbd5e1' }}>
                        {app.previousclub || 'N/A'}
                      </td>
                      {/* Current Club */}
                      <td style={{ padding: '12px 14px', color: '#cbd5e1' }}>
                        {app.currentclub || 'N/A'}
                      </td>
                      {/* How Heard */}
                      <td style={{ padding: '12px 14px', maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', color: '#94a3b8' }} title={app.knowaboutaarna}>
                        {app.knowaboutaarna || 'N/A'}
                      </td>
                      {/* Why Join */}
                      <td style={{ padding: '12px 14px', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', color: '#94a3b8' }} title={app.whyjoinaarna}>
                        {app.whyjoinaarna || 'N/A'}
                      </td>
                      {/* Action */}
                      <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                        <button
                          onClick={() => setSelectedApplicant(app)}
                          style={{
                            padding: '5px 10px',
                            borderRadius: '6px',
                            background: 'rgba(255, 255, 255, 0.08)',
                            border: '1px solid rgba(255, 255, 255, 0.15)',
                            color: '#fff',
                            fontSize: '0.78rem',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            transition: 'background 0.15s'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(99, 102, 241, 0.25)'}
                          onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'}
                        >
                          <Eye size={13} /> View
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {sortedApplicants.length > 0 && (
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '1rem',
              marginTop: '1.25rem',
              padding: '0.75rem 1rem',
              background: 'rgba(15, 23, 42, 0.4)',
              borderRadius: '10px',
              border: '1px solid rgba(255, 255, 255, 0.06)'
            }}>
              <div style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
                Showing <strong style={{ color: '#fff' }}>{Math.min((currentPage - 1) * ITEMS_PER_PAGE + 1, sortedApplicants.length)}</strong> to <strong style={{ color: '#fff' }}>{Math.min(currentPage * ITEMS_PER_PAGE, sortedApplicants.length)}</strong> of <strong style={{ color: '#fff' }}>{sortedApplicants.length}</strong> applicants
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '32px',
                    height: '32px',
                    borderRadius: '6px',
                    background: currentPage === 1 ? 'rgba(30, 41, 59, 0.4)' : 'rgba(30, 41, 59, 0.9)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: currentPage === 1 ? '#475569' : '#fff',
                    cursor: currentPage === 1 ? 'not-allowed' : 'pointer'
                  }}
                >
                  <ChevronLeft size={16} />
                </button>

                {Array.from({ length: totalPages }, (_, index) => index + 1).map((pageNum) => {
                  if (
                    pageNum === 1 || 
                    pageNum === totalPages || 
                    (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                  ) {
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        style={{
                          minWidth: '32px',
                          height: '32px',
                          padding: '0 6px',
                          borderRadius: '6px',
                          background: currentPage === pageNum ? '#6366f1' : 'rgba(30, 41, 59, 0.8)',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          color: '#fff',
                          fontWeight: currentPage === pageNum ? '700' : '400',
                          fontSize: '0.85rem',
                          cursor: 'pointer'
                        }}
                      >
                        {pageNum}
                      </button>
                    )
                  } else if (
                    (pageNum === 2 && currentPage > 3) ||
                    (pageNum === totalPages - 1 && currentPage < totalPages - 2)
                  ) {
                    return <span key={pageNum} style={{ color: '#64748b', fontSize: '0.85rem' }}>...</span>
                  }
                  return null
                })}

                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '32px',
                    height: '32px',
                    borderRadius: '6px',
                    background: currentPage === totalPages ? 'rgba(30, 41, 59, 0.4)' : 'rgba(30, 41, 59, 0.9)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: currentPage === totalPages ? '#475569' : '#fff',
                    cursor: currentPage === totalPages ? 'not-allowed' : 'pointer'
                  }}
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: Manage Sub-Admins (Super Admin Only) */}
      {activeTab === 'subadmins' && admin?.role === 'superadmin' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem' }}>
          {/* Create Form */}
          <div style={{
            background: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(12px)',
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
            background: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(12px)',
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
                        Dept: {sa.assigned_department || 'All'} | Sec: {sa.assigned_section || 'All'}
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
              Applicant Details
            </span>
            <h2 style={{ fontSize: '1.5rem', fontWeight: '700', margin: '0.25rem 0 1rem 0', color: '#fff' }}>
              {selectedApplicant.fullname}
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginTop: '1.5rem' }}>
              <div style={{ background: 'rgba(30, 41, 59, 0.5)', padding: '1rem', borderRadius: '8px' }}>
                <h4 style={{ margin: '0 0 0.5rem 0', color: '#94a3b8', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Contact Info</h4>
                <p style={{ margin: '4px 0', fontSize: '0.9rem' }}><strong>Email:</strong> {selectedApplicant.emailaddress}</p>
                <p style={{ margin: '4px 0', fontSize: '0.9rem' }}><strong>Phone:</strong> {selectedApplicant.mobilenumber}</p>
                <p style={{ margin: '4px 0', fontSize: '0.9rem' }}><strong>Roll Number:</strong> {selectedApplicant.rollnumber}</p>
              </div>

              <div style={{ background: 'rgba(30, 41, 59, 0.5)', padding: '1rem', borderRadius: '8px' }}>
                <h4 style={{ margin: '0 0 0.5rem 0', color: '#94a3b8', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Academic Info</h4>
                <p style={{ margin: '4px 0', fontSize: '0.9rem' }}><strong>Department:</strong> {selectedApplicant.department}</p>
                <p style={{ margin: '4px 0', fontSize: '0.9rem' }}><strong>Section:</strong> {selectedApplicant.section}</p>
                <p style={{ margin: '4px 0', fontSize: '0.9rem' }}><strong>Year:</strong> {selectedApplicant.year}</p>
                <p style={{ margin: '4px 0', fontSize: '0.9rem' }}><strong>Portfolio Preference:</strong> {selectedApplicant.portfolio}</p>
              </div>

              <div style={{ background: 'rgba(30, 41, 59, 0.5)', padding: '1rem', borderRadius: '8px' }}>
                <h4 style={{ margin: '0 0 0.5rem 0', color: '#94a3b8', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Skills & Experience</h4>
                <p style={{ margin: '4px 0 8px 0', fontSize: '0.9rem', lineHeight: '1.4' }}><strong>Skills:</strong> {selectedApplicant.skills}</p>
                <p style={{ margin: '4px 0', fontSize: '0.9rem' }}><strong>Previous Club:</strong> {selectedApplicant.previousclub || 'N/A'}</p>
                <p style={{ margin: '4px 0', fontSize: '0.9rem' }}><strong>Current Club:</strong> {selectedApplicant.currentclub || 'N/A'}</p>
                <p style={{ margin: '4px 0', fontSize: '0.9rem' }}><strong>Leadership Rating:</strong> {selectedApplicant.leadershiprating} / 10</p>
              </div>

              <div style={{ background: 'rgba(30, 41, 59, 0.5)', padding: '1rem', borderRadius: '8px' }}>
                <h4 style={{ margin: '0 0 0.5rem 0', color: '#94a3b8', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Why Join AARNA</h4>
                <p style={{ margin: 0, fontSize: '0.9rem', color: '#cbd5e1', lineHeight: '1.5', whiteSpace: 'pre-wrap' }}>
                  {selectedApplicant.whyjoinaarna}
                </p>
              </div>

              <div style={{ background: 'rgba(30, 41, 59, 0.5)', padding: '1rem', borderRadius: '8px' }}>
                <h4 style={{ margin: '0 0 0.5rem 0', color: '#94a3b8', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>How They Heard About AARNA</h4>
                <p style={{ margin: 0, fontSize: '0.9rem', color: '#cbd5e1', lineHeight: '1.5', whiteSpace: 'pre-wrap' }}>
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
