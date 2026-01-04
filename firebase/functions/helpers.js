const getISOWeek = (d) => {
  const date = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  date.setUTCDate(date.getUTCDate() + 4 - (date.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((date - yearStart) / 86400000) + 1) / 7);
  const yyyy = date.getUTCFullYear();
  const w = String(weekNo).padStart(2, '0');
  return `${yyyy}-W${w}`;
}

const isoWeekStartDate = (yearWeek) => {
  const [yearStr, wStr] = yearWeek.split('-W')
  const year = parseInt(yearStr, 10)
  const week = parseInt(wStr, 10)
  const simple = new Date(Date.UTC(year, 0, 1 + (week - 1) * 7))
  const dow = simple.getUTCDay()
  const isoDow = dow === 0 ? 7 : dow
  const monday = new Date(simple)
  monday.setUTCDate(simple.getUTCDate() - (isoDow - 1))
  const yyyy = monday.getUTCFullYear();
  const mm = String(monday.getUTCMonth() + 1).padStart(2, '0')
  const dd = String(monday.getUTCDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

const formatDate = (d) => {
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(d.getUTCDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

module.exports = { getISOWeek, isoWeekStartDate, formatDate }

// get previous ISO week id (YYYY-Www)
function getPreviousWeek(weekId) {
  const start = new Date(`${isoWeekStartDate(weekId)}T00:00:00Z`)
  start.setUTCDate(start.getUTCDate() - 7)
  return getISOWeek(start)
}

module.exports.getPreviousWeek = getPreviousWeek
