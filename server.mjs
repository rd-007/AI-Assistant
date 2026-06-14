import { createReadStream } from 'node:fs'
import { access, constants } from 'node:fs/promises'
import http from 'node:http'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  forwardToNvidia,
  isRateLimited,
  PORT,
  PUBLIC_DIR_NAME,
  readRequestBody,
  sendJson,
  ALLOWED_CHAT_MODELS,
  ALLOWED_PARSE_MODELS,
} from './lib/nvidiaProxy.mjs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const PUBLIC_DIR = path.join(__dirname, PUBLIC_DIR_NAME)

// SEC-06: CORS configuration
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || '*'

const setCorsHeaders = (response) => {
  response.setHeader('Access-Control-Allow-Origin', ALLOWED_ORIGIN)
  response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Api-Token')
}

// PERF-23: async file existence check instead of blocking existsSync
const fileExists = async (filePath) => {
  try {
    await access(filePath, constants.R_OK)
    return true
  } catch {
    return false
  }
}

const getClientIp = (request) =>
  request.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
  request.socket?.remoteAddress ||
  'unknown'

// MIME type map
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
}

const serveStaticFile = async (request, response) => {
  const requestPath = request.url === '/' ? '/index.html' : request.url.split('?')[0]
  const safePath = path.normalize(requestPath).replace(/^(\.\.[/\\])+/, '')
  let filePath = path.join(PUBLIC_DIR, safePath)

  if (!(await fileExists(filePath)) || safePath.endsWith('/')) {
    filePath = path.join(PUBLIC_DIR, 'index.html')
  }

  if (!(await fileExists(filePath))) {
    sendJson(response, 404, { error: { message: 'Not found' } })
    return
  }

  const ext = path.extname(filePath).toLowerCase()
  const contentType = MIME_TYPES[ext] || 'application/octet-stream'

  response.writeHead(200, { 'Content-Type': contentType })
  createReadStream(filePath).pipe(response)
}

// SEC-03: validate chat request body
const validateChatBody = (body) => {
  if (!body || typeof body !== 'object') return 'Request body must be a JSON object'
  if (!body.model || typeof body.model !== 'string') return 'Missing or invalid "model" field'
  if (!ALLOWED_CHAT_MODELS.has(body.model)) return `Model "${body.model}" is not supported`
  if (!Array.isArray(body.messages) || body.messages.length === 0) return 'Missing or empty "messages" array'
  if (body.messages.length > 50) return 'Too many messages (max 50)'
  return null
}

// SEC-03: validate document parse request body
const validateDocParseBody = (body) => {
  if (!body || typeof body !== 'object') return 'Request body must be a JSON object'
  if (!body.model || typeof body.model !== 'string') return 'Missing or invalid "model" field'
  if (!ALLOWED_PARSE_MODELS.has(body.model)) return `Model "${body.model}" is not supported`
  if (!Array.isArray(body.input) || body.input.length === 0) return 'Missing or empty "input" array'
  return null
}

const server = http.createServer(async (request, response) => {
  // SEC-06: set CORS headers on every response
  setCorsHeaders(response)

  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    response.writeHead(204)
    response.end()
    return
  }

  try {
    // SEC-05: rate limit API requests
    if (request.url.startsWith('/api/')) {
      const ip = getClientIp(request)
      if (isRateLimited(ip)) {
        sendJson(response, 429, { error: { message: 'Too many requests. Please wait and try again.' } })
        return
      }
    }

    if (request.method === 'POST' && request.url === '/api/chat') {
      const body = await readRequestBody(request)
      const validationError = validateChatBody(body)
      if (validationError) {
        sendJson(response, 400, { error: { message: validationError } })
        return
      }

      // Only forward whitelisted fields
      const sanitizedBody = {
        model: body.model,
        messages: body.messages,
        stream: false,
      }

      const result = await forwardToNvidia('https://integrate.api.nvidia.com/v1/chat/completions', sanitizedBody)
      sendJson(response, result.status, result.payload)
      return
    }

    if (request.method === 'POST' && request.url === '/api/document-parse') {
      const body = await readRequestBody(request)
      const validationError = validateDocParseBody(body)
      if (validationError) {
        sendJson(response, 400, { error: { message: validationError } })
        return
      }

      const sanitizedBody = {
        model: body.model,
        input: body.input,
      }

      const result = await forwardToNvidia('https://ai.api.nvidia.com/v1/gr/nvidia/nemotron-parse', sanitizedBody)
      sendJson(response, result.status, result.payload)
      return
    }

    if (request.method === 'GET' && request.url === '/health') {
      sendJson(response, 200, { ok: true })
      return
    }

    if (await fileExists(PUBLIC_DIR)) {
      await serveStaticFile(request, response)
      return
    }

    sendJson(response, 404, {
      error: {
        message: 'Frontend build not found. Run "npm run build" for production or use "npm run dev".',
      },
    })
  } catch (error) {
    // BACK-10: log full error server-side, send generic message to client
    console.error('[SERVER ERROR]', error)

    const statusCode = error?.statusCode || 500
    const clientMessage =
      statusCode === 413 ? 'Request body too large' :
      statusCode === 400 ? (error?.message || 'Bad request') :
      'Internal server error'

    sendJson(response, statusCode, {
      error: { message: clientMessage },
    })
  }
})

server.listen(PORT, () => {
  console.log(`NVIDIA proxy server running at http://localhost:${PORT}`)
})
