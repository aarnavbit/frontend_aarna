import QRCode from 'qrcode'

function roundRect(ctx, x, y, width, height, radius) {
  ctx.beginPath()
  ctx.moveTo(x + radius, y)
  ctx.lineTo(x + width - radius, y)
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius)
  ctx.lineTo(x + width, y + height - radius)
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height)
  ctx.lineTo(x + radius, y + height)
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius)
  ctx.lineTo(x, y + radius)
  ctx.quadraticCurveTo(x, y, x + radius, y)
  ctx.closePath()
}

/**
 * Generates and triggers download of a high-resolution event pass / registration code card image.
 * @param {Object} team
 * @returns {Promise<string>} Downloaded filename
 */
export async function downloadRegistrationPass(team) {
  if (!team) return

  const regId = team.registration_id || team.registrationId || 'ISH-TEMP'
  const teamName = team.team_name || team.teamName || 'Unnamed Team'
  const leaderName = team.leader_name || team.leaderName || 'Leader'
  const leaderRoll = team.leader_roll_no || team.leaderRollNo || ''
  const leaderDept = team.leader_dept || team.leaderDept || ''
  const leaderSec = team.leader_sec || team.leaderSec || ''
  const leaderYear = team.leader_year || team.leaderYear || ''
  const leaderPhone = team.leader_phone || team.leaderPhone || ''
  const leaderEmail = team.leader_email || team.leaderEmail || ''

  const members = team.members || []
  const m2 = members[0] || {}
  const m3 = members[1] || {}

  const amount = team.amount || 150
  const status = (team.status || 'pending').toLowerCase()
  const createdAt = team.created_at
    ? new Date(Number(team.created_at)).toLocaleString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : new Date().toLocaleString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })

  // URL for QR code (points directly to check status on website)
  const host = typeof window !== 'undefined' ? window.location.origin : 'https://aarna.live'
  const qrUrl = `${host}/ishanya?id=${encodeURIComponent(regId)}`

  // Generate QR code data URL
  let qrImage = null
  try {
    const qrDataUrl = await QRCode.toDataURL(qrUrl, {
      margin: 1,
      width: 400,
      errorCorrectionLevel: 'M',
      color: {
        dark: '#0a0e1a',
        light: '#ffffff',
      },
    })

    qrImage = new Image()
    qrImage.crossOrigin = 'anonymous'
    await new Promise((resolve, reject) => {
      qrImage.onload = resolve
      qrImage.onerror = reject
      qrImage.src = qrDataUrl
    })
  } catch (err) {
    console.error('Failed to generate pass QR code:', err)
  }

  // Setup Canvas with 2x retina scale for crisp typography
  const canvas = document.createElement('canvas')
  const scale = 2
  const width = 1000
  const height = 650
  canvas.width = width * scale
  canvas.height = height * scale
  const ctx = canvas.getContext('2d')
  ctx.scale(scale, scale)

  // 1. Base Background Gradient
  const bgGrad = ctx.createLinearGradient(0, 0, width, height)
  bgGrad.addColorStop(0, '#070a12')
  bgGrad.addColorStop(0.5, '#0f172a')
  bgGrad.addColorStop(1, '#1e1b4b')
  ctx.fillStyle = bgGrad
  ctx.fillRect(0, 0, width, height)

  // 2. Subtle Geometric Grid Pattern
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)'
  ctx.lineWidth = 1
  for (let x = 0; x < width; x += 40) {
    ctx.beginPath()
    ctx.moveTo(x, 0)
    ctx.lineTo(x, height)
    ctx.stroke()
  }
  for (let y = 0; y < height; y += 40) {
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(width, y)
    ctx.stroke()
  }

  // 3. Glowing Outer Border
  const borderGrad = ctx.createLinearGradient(0, 0, width, height)
  borderGrad.addColorStop(0, '#ea580c')
  borderGrad.addColorStop(0.5, '#f59e0b')
  borderGrad.addColorStop(1, '#8b5cf6')
  ctx.strokeStyle = borderGrad
  ctx.lineWidth = 3.5
  roundRect(ctx, 16, 16, width - 32, height - 32, 20)
  ctx.stroke()

  // 4. Top Header Box
  ctx.fillStyle = 'rgba(15, 23, 42, 0.85)'
  ctx.strokeStyle = 'rgba(245, 158, 11, 0.35)'
  ctx.lineWidth = 1.5
  roundRect(ctx, 32, 28, width - 64, 76, 14)
  ctx.fill()
  ctx.stroke()

  // Header Title
  ctx.font = 'bold 28px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Tektur", sans-serif'
  ctx.fillStyle = '#f59e0b'
  ctx.fillText("ISHANYA '26", 52, 63)

  ctx.font = 'bold 11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Tektur", sans-serif'
  ctx.fillStyle = '#94a3b8'
  ctx.fillText('AARNA • VISUALIZE. CREATE. INSPIRE.', 52, 84)

  // Status / Pass Badge (top right)
  const isAccepted = status === 'accepted'
  const isRejected = status === 'rejected'
  const badgeText = isAccepted ? 'VERIFIED PASS' : isRejected ? 'REJECTED' : 'OFFICIAL PASS'
  const badgeColor = isAccepted ? '#10b981' : isRejected ? '#ef4444' : '#f59e0b'
  const badgeBg = isAccepted ? 'rgba(16, 185, 129, 0.18)' : isRejected ? 'rgba(239, 68, 68, 0.18)' : 'rgba(245, 158, 11, 0.18)'

  ctx.font = 'bold 12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  const badgeWidth = ctx.measureText(badgeText).width + 28
  const badgeX = width - 52 - badgeWidth

  ctx.fillStyle = badgeBg
  ctx.strokeStyle = badgeColor
  ctx.lineWidth = 1.5
  roundRect(ctx, badgeX, 48, badgeWidth, 34, 10)
  ctx.fill()
  ctx.stroke()

  ctx.fillStyle = badgeColor
  ctx.fillText(badgeText, badgeX + 14, 70)

  // 5. Hero Registration Code Box (Left Side)
  const leftX = 32
  const leftW = 590

  // Code Container Box
  ctx.fillStyle = 'rgba(245, 158, 11, 0.08)'
  ctx.strokeStyle = '#f59e0b'
  ctx.lineWidth = 2
  roundRect(ctx, leftX, 120, leftW, 104, 14)
  ctx.fill()
  ctx.stroke()

  ctx.font = 'bold 11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  ctx.fillStyle = '#f59e0b'
  ctx.fillText('REGISTRATION CODE / ID', leftX + 22, 145)

  // Big Monospace Code with Subtle Amber Glow
  ctx.save()
  ctx.font = 'bold 38px "SF Mono", Monaco, Consolas, "Courier New", monospace'
  ctx.shadowColor = '#f59e0b'
  ctx.shadowBlur = 12
  ctx.fillStyle = '#ffffff'
  ctx.fillText(regId, leftX + 22, 188)
  ctx.restore()

  ctx.font = '11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  ctx.fillStyle = '#94a3b8'
  ctx.fillText('Present this registration code at entry & desk verification', leftX + 22, 210)

  // 6. Team & Members Details Box
  ctx.fillStyle = 'rgba(15, 23, 42, 0.85)'
  ctx.strokeStyle = '#334155'
  ctx.lineWidth = 1.5
  roundRect(ctx, leftX, 238, leftW, 335, 14)
  ctx.fill()
  ctx.stroke()

  // Team Name
  ctx.font = 'bold 18px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  ctx.fillStyle = '#f8fafc'
  ctx.fillText(`TEAM: ${teamName}`, leftX + 22, 268)

  // Divider
  ctx.strokeStyle = 'rgba(51, 65, 85, 0.6)'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(leftX + 22, 282)
  ctx.lineTo(leftX + leftW - 22, 282)
  ctx.stroke()

  // Member 1 (Leader)
  ctx.font = 'bold 12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  ctx.fillStyle = '#f59e0b'
  ctx.fillText('MEMBER 1 (LEADER):', leftX + 22, 306)

  ctx.font = 'bold 14px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  ctx.fillStyle = '#ffffff'
  const leaderRollStr = leaderRoll ? ` [${leaderRoll}]` : ''
  ctx.fillText(`${leaderName}${leaderRollStr}`, leftX + 165, 306)

  ctx.font = '11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  ctx.fillStyle = '#94a3b8'
  const leaderSub = [
    leaderDept ? `Dept: ${leaderDept}${leaderSec ? `-${leaderSec}` : ''}` : '',
    leaderYear ? `Yr: ${leaderYear}` : '',
    leaderPhone ? `📱 ${leaderPhone}` : '',
    leaderEmail ? `📧 ${leaderEmail}` : '',
  ]
    .filter(Boolean)
    .join('  |  ')
  ctx.fillText(leaderSub || 'Team Leader Details', leftX + 22, 324)

  // Member 2
  ctx.font = 'bold 12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  ctx.fillStyle = '#c084fc'
  ctx.fillText('MEMBER 2:', leftX + 22, 360)

  ctx.font = 'bold 14px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  ctx.fillStyle = '#ffffff'
  const m2RollStr = m2.roll_no ? ` [${m2.roll_no}]` : ''
  ctx.fillText(`${m2.name || 'Member 2'}${m2RollStr}`, leftX + 165, 360)

  ctx.font = '11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  ctx.fillStyle = '#94a3b8'
  const m2Sub = [
    m2.department ? `Dept: ${m2.department}${m2.section || m2.sec ? `-${m2.section || m2.sec}` : ''}` : '',
    m2.year ? `Yr: ${m2.year}` : '',
    m2.phone ? `📱 ${m2.phone}` : '',
  ]
    .filter(Boolean)
    .join('  |  ')
  ctx.fillText(m2Sub || 'Team Member Details', leftX + 22, 378)

  // Member 3
  ctx.font = 'bold 12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  ctx.fillStyle = '#c084fc'
  ctx.fillText('MEMBER 3:', leftX + 22, 414)

  ctx.font = 'bold 14px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  ctx.fillStyle = '#ffffff'
  const m3RollStr = m3.roll_no ? ` [${m3.roll_no}]` : ''
  ctx.fillText(`${m3.name || 'Member 3'}${m3RollStr}`, leftX + 165, 414)

  ctx.font = '11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  ctx.fillStyle = '#94a3b8'
  const m3Sub = [
    m3.department ? `Dept: ${m3.department}${m3.section || m3.sec ? `-${m3.section || m3.sec}` : ''}` : '',
    m3.year ? `Yr: ${m3.year}` : '',
    m3.phone ? `📱 ${m3.phone}` : '',
  ]
    .filter(Boolean)
    .join('  |  ')
  ctx.fillText(m3Sub || 'Team Member Details', leftX + 22, 432)

  // Summary row at bottom of left card
  ctx.fillStyle = 'rgba(30, 41, 59, 0.7)'
  roundRect(ctx, leftX + 14, 465, leftW - 28, 92, 10)
  ctx.fill()

  ctx.font = 'bold 12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  ctx.fillStyle = '#38bdf8'
  ctx.fillText(`REGISTRATION FEE: ₹${amount} (3 Members Fixed)`, leftX + 28, 492)

  ctx.font = '11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  ctx.fillStyle = '#cbd5e1'
  const utrStr = team.utr_number || team.utrNumber ? `UTR: ${team.utr_number || team.utrNumber}` : 'Payment Verification Pending'
  ctx.fillText(utrStr, leftX + 28, 514)

  ctx.fillStyle = isAccepted ? '#10b981' : isRejected ? '#ef4444' : '#f59e0b'
  ctx.fillText(`STATUS: ${(team.status || 'pending').toUpperCase()}`, leftX + 28, 536)

  // 7. Right Side: Verification QR Code Card
  const rightX = 642
  const rightW = width - rightX - 32

  ctx.fillStyle = 'rgba(15, 23, 42, 0.85)'
  ctx.strokeStyle = '#334155'
  ctx.lineWidth = 1.5
  roundRect(ctx, rightX, 120, rightW, 453, 14)
  ctx.fill()
  ctx.stroke()

  ctx.font = 'bold 13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  ctx.fillStyle = '#38bdf8'
  ctx.textAlign = 'center'
  ctx.fillText('VERIFICATION QR CODE', rightX + rightW / 2, 152)

  ctx.font = '10px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  ctx.fillStyle = '#94a3b8'
  ctx.fillText('Scan with phone to check live status', rightX + rightW / 2, 170)

  // Draw QR Image in center of container
  const qrSize = 220
  const qrX = rightX + (rightW - qrSize) / 2
  const qrY = 188

  if (qrImage) {
    // White background padding around QR code
    ctx.fillStyle = '#ffffff'
    roundRect(ctx, qrX - 8, qrY - 8, qrSize + 16, qrSize + 16, 10)
    ctx.fill()
    ctx.drawImage(qrImage, qrX, qrY, qrSize, qrSize)
  }

  // QR card footer info
  ctx.font = 'bold 15px "SF Mono", Monaco, Consolas, monospace'
  ctx.fillStyle = '#fbbf24'
  ctx.textAlign = 'center'
  ctx.fillText(regId, rightX + rightW / 2, 452)

  ctx.font = '11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  ctx.fillStyle = '#94a3b8'
  ctx.fillText('Keep this pass image saved', rightX + rightW / 2, 478)
  ctx.fillText('on your mobile phone', rightX + rightW / 2, 496)

  // Status Badge below QR
  ctx.fillStyle = badgeBg
  ctx.strokeStyle = badgeColor
  ctx.lineWidth = 1
  roundRect(ctx, rightX + (rightW - 140) / 2, 516, 140, 28, 8)
  ctx.fill()
  ctx.stroke()

  ctx.font = 'bold 11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  ctx.fillStyle = badgeColor
  ctx.fillText((team.status || 'PENDING').toUpperCase(), rightX + rightW / 2, 534)

  // 8. Footer Bar
  ctx.textAlign = 'left'
  ctx.font = '11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  ctx.fillStyle = '#64748b'
  ctx.fillText(`Issued: ${createdAt}`, 36, 610)

  ctx.textAlign = 'right'
  ctx.fillText('Ishanya 2026 • Official Registration Portal • aarna.live', width - 36, 610)

  // 9. Download the Image
  const filename = `Ishanya_Pass_${regId}.png`
  const dataUrl = canvas.toDataURL('image/png')
  const downloadLink = document.createElement('a')
  downloadLink.download = filename
  downloadLink.href = dataUrl
  document.body.appendChild(downloadLink)
  downloadLink.click()
  document.body.removeChild(downloadLink)

  return filename
}
