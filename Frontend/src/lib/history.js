const HISTORY_KEY = 'papermatch_history'

export function loadHistory() {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]')
  } catch {
    return []
  }
}

export function saveHistory(entry) {
  const history = [entry, ...loadHistory()].slice(0, 50)
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history))
  return history
}

export function formatDate(iso) {
  try {
    return new Date(iso).toLocaleString()
  } catch {
    return ''
  }
}