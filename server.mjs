import { createReadStream, existsSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import http from 'node:http'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const PORT = Number(process.env.PORT || 8787)
const NVIDIA_API_KEY = process.env.NVIDIA_API_KEY || process.env.VITE_NVIDIA_API_KEY
const PUBLIC_DIR = path.join(__dirname, 'dist')

const jsonHeaders = {
  'Content-Type': 'application/json',
}

const sendJson = (response, statusCode, payload) => {
  response.writeHead(statusCode, jsonHeaders)
  response.end(JSON.stringify(payload))
}

const readRequestBody = async (request) => {
  const chunks = []

  for await (const chunk of request) {
    chunks.push(chunk)
  }

  if (chunks.length === 0) {
    return {}
  }

  return JSON.parse(Buffer.concat(chunks).toString('utf8'))
}

const forwardToNvidia = async (url, body) => {
  if (!NVIDIA_API_KEY) {
    return {
      ok: false,
      status: 500,
      payload: {
        error: {
          message: 'Missing NVIDIA_API_KEY. Add it to .env before starting the server.',
        },
      },
    }
  }

  const upstream = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${NVIDIA_API_KEY}`,
      'X-Title': "RD's NVIDIA Assistant",
    },
    body: JSON.stringify(body),
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

const serveStaticFile = async (request, response) => {
  const requestPath = request.url === '/' ? '/index.html' : request.url
  const safePath = path.normalize(requestPath).replace(/^(\.\.[/\\])+/, '')
  let filePath = path.join(PUBLIC_DIR, safePath)

  if (!existsSync(filePath) || safePath.endsWith('/')) {
    filePath = path.join(PUBLIC_DIR, 'index.html')
  }

  if (!existsSync(filePath)) {
    sendJson(response, 404, { error: { message: 'Not found' } })
    return
  }

  const ext = path.extname(filePath).toLowerCase()
  const contentType =
    ext === '.html' ? 'text/html; charset=utf-8'
      : ext === '.js' ? 'application/javascript; charset=utf-8'
        : ext === '.css' ? 'text/css; charset=utf-8'
          : ext === '.json' ? 'application/json; charset=utf-8'
            : ext === '.svg' ? 'image/svg+xml'
              : 'application/octet-stream'

  response.writeHead(200, { 'Content-Type': contentType })
  createReadStream(filePath).pipe(response)
}

const server = http.createServer(async (request, response) => {
  try {
    if (request.method === 'POST' && request.url === '/api/chat') {
      const body = await readRequestBody(request)
      const result = await forwardToNvidia('https://integrate.api.nvidia.com/v1/chat/completions', body)
      sendJson(response, result.status, result.payload)
      return
    }

    if (request.method === 'POST' && request.url === '/api/document-parse') {
      const body = await readRequestBody(request)
      const result = await forwardToNvidia('https://ai.api.nvidia.com/v1/gr/nvidia/nemotron-parse', body)
      sendJson(response, result.status, result.payload)
      return
    }

    if (request.method === 'GET' && request.url === '/health') {
      sendJson(response, 200, { ok: true })
      return
    }

    if (existsSync(PUBLIC_DIR)) {
      await serveStaticFile(request, response)
      return
    }

    const message = await readFile(path.join(__dirname, 'README.md'), 'utf8').catch(() => '')
    sendJson(response, 404, {
      error: {
        message: 'Frontend build not found. Run "npm run build" for production or use "npm run dev".',
      },
      readmePreview: message.slice(0, 120),
    })
  } catch (error) {
    sendJson(response, 500, {
      error: {
        message: error?.message || 'Internal server error',
      },
    })
  }
})

server.listen(PORT, () => {
  console.log(`NVIDIA proxy server running at http://localhost:${PORT}`)
})
