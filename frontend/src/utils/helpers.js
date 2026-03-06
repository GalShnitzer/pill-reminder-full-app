const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

export function formatTime(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: userTimezone,
  });
}

export function formatDate(dateStr) {
  if (!dateStr) return '—';
  // "YYYY-MM-DD" strings — parse as local date to avoid UTC midnight offset shift
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    const [y, m, d] = dateStr.split('-').map(Number);
    return new Date(y, m - 1, d).toLocaleDateString(undefined, {
      day: 'numeric', month: 'short', year: 'numeric',
    });
  }
  return new Date(dateStr).toLocaleDateString(undefined, {
    day: 'numeric', month: 'short', year: 'numeric', timeZone: userTimezone,
  });
}

export function getApiError(error) {
  return error?.response?.data?.message || error?.message || 'Something went wrong';
}

export function timeToMinutes(hhmm) {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}
