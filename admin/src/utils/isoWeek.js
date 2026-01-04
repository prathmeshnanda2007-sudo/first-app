// Small ISO week helpers for client-side UI
export function getISOWeek(date = new Date()) {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
  // Thursday in current week decides the year
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7))
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7)
  const yyyy = d.getUTCFullYear()
  const w = String(weekNo).padStart(2, '0')
  return `${yyyy}-W${w}`
}

export function weeksAgo(date = new Date(), weeks = 1) {
  const d = new Date(date)
  d.setUTCDate(d.getUTCDate() - weeks * 7)
  return d
}
