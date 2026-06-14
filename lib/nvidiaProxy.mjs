const jsonHeaders = {
  'Content-Type': 'application/json',
}

export const PORT = Number(process.env.PORT || 8787)
export const PUBLIC_DIR_NAME = 'dist'

// --- Rate Limiting (SEC-05) ---
const rateLimitMap = new Map()
const RATE_LIMIT = 20 // max requests per window
const RATE_WINDOW_MS = 60_000 // 60 seconds

export const isRateLimited = (ip) => {
  const now = Date.now()
  let record = rateLimitMap.get(ip)

  if (!record || now > record.resetAt) {
    record = { count: 0, resetAt: now + RATE_WINDOW_MS }
  }

  record.count++
  rateLimitMap.set(ip, record)
  return record.count > RATE_LIMIT
}

// Clean up stale entries every 5 minutes to prevent memory leak
setInterval(() => {
  const now = Date.now()
  for (const [ip, record] of rateLimitMap) {
    if (now > record.resetAt) rateLimitMap.delete(ip)
  }
}, 5 * 60_000).unref()

// --- Helpers ---

export const sendJson = (response, statusCode, payload) => {
  response.writeHead(statusCode, jsonHeaders)
  response.end(JSON.stringify(payload))
}

// SEC-04: enforce a maximum request body size to prevent memory exhaustion
const MAX_BODY_BYTES = 5 * 1024 * 1024 // 5 MB

export const readRequestBody = async (request) => {
  const chunks = []
  let totalBytes = 0

  for await (const chunk of request) {
    totalBytes += chunk.length
    if (totalBytes > MAX_BODY_BYTES) {
      const err = new Error('Request body too large')
      err.statusCode = 413
      throw err
    }
    chunks.push(chunk)
  }

  if (chunks.length === 0) {
    return {}
  }

  // BACK-11: handle malformed JSON gracefully
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'))
  } catch {
    const err = new Error('Invalid JSON in request body')
    err.statusCode = 400
    throw err
  }
}

// SEC-02: removed VITE_NVIDIA_API_KEY fallback — API key must only exist server-side
export const getNvidiaApiKey = () => process.env.NVIDIA_API_KEY

// SEC-03: whitelist of allowed models to prevent abuse
export const ALLOWED_CHAT_MODELS = new Set([
  'meta/llama-3.1-8b-instruct',
  'nvidia/llama-3.1-nemotron-nano-8b-v1',
  'nvidia/nemotron-nano-12b-v2-vl',
])

export const ALLOWED_PARSE_MODELS = new Set([
  'nvidia/nemotron-parse',
])

export const forwardToNvidia = async (url, body) => {
  const nvidiaApiKey = getNvidiaApiKey()

  if (!nvidiaApiKey) {
    return {
      ok: false,
      status: 500,
      payload: {
        error: {
          message: 'Missing NVIDIA_API_KEY. Add it to your environment before starting the server.',
        },
      },
    }
  }

  // BACK-09: add a 30-second timeout to prevent hung connections
  const upstream = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${nvidiaApiKey}`,
      'X-Title': "RD's NVIDIA Assistant",
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(30_000),
  })

  const payload = await upstream.json().catch(() => ({
    error: {
      message: upstream.statusText || 'NVIDIA request failed',
    },
  }))

  return {
    ok: upstream.ok,
    status: upstream.status,
    payload,
  }
}
