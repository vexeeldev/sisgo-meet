import { API_URL, MYIP_KEY } from '@/lib/config'

// Re-export api from api-new for backward compatibility
export { api } from '@/lib/api-new'

function apiUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) return path
  const base = (API_URL ?? '').replace(/\/$/, '')
  const p = path.startsWith('/') ? path : `/${path}`
  return `${base}${p}`
}

async function APIRequest(
  url: string,
  method = 'POST',
  body?: unknown,
  signal?: AbortSignal
): Promise<unknown> {
  const init: RequestInit = {
    method,
    headers: { 'Content-Type': 'application/json' },
    signal
  }

  if (body) {
    init.body = JSON.stringify(body)
  }

  const response = await fetch(apiUrl(url), init)

  let data: unknown
  try {
    data = await response.json()
  } catch {
    data = null
  }

  if (!response.ok) {
    const fromBody =
      data && typeof data === 'object' ? (data as Record<string, unknown>) : { message: response.statusText }
    return {
      status: response.status,
      ok: false,
      isError: true,
      ...fromBody
    }
  }

  return data
}

async function GetClientIp() {
  try {
    const res = await fetch('https://api.sisgo.co.id/myip.php', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${MYIP_KEY}`
      }
    })
    const data = await res.json()

    return data.data
  } catch (err) {
    console.error('Failed to get client IP:', err)
    return null
  }
}
