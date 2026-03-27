const jsonHeaders = {
  'Content-Type': 'application/json',
}

export const PORT = Number(process.env.PORT || 8787)
export const PUBLIC_DIR_NAME = 'dist'

export const sendJson = (response, statusCode, payload) => {
  response.writeHead(statusCode, jsonHeaders)
  response.end(JSON.stringify(payload))
}

export const readRequestBody = async (request) => {
  const chunks = []

  for await (const chunk of request) {
    chunks.push(chunk)
  }

  if (chunks.length === 0) {
    return {}
  }

  return JSON.parse(Buffer.concat(chunks).toString('utf8'))
}

export const getNvidiaApiKey = () => process.env.NVIDIA_API_KEY || process.env.VITE_NVIDIA_API_KEY

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

  const upstream = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${nvidiaApiKey}`,
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
