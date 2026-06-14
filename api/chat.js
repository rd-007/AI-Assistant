import { forwardToNvidia, ALLOWED_CHAT_MODELS } from '../lib/nvidiaProxy.mjs'

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    response.status(405).json({ error: { message: 'Method not allowed' } })
    return
  }

  // BACK-08: basic auth check for serverless endpoints
  const expectedToken = process.env.APP_SECRET_TOKEN
  if (expectedToken) {
    const token = request.headers['x-api-token']
    if (token !== expectedToken) {
      response.status(401).json({ error: { message: 'Unauthorized' } })
      return
    }
  }

  // SEC-03: validate the request body
  const body = request.body ?? {}
  const { model, messages } = body

  if (!model || typeof model !== 'string' || !ALLOWED_CHAT_MODELS.has(model)) {
    response.status(400).json({ error: { message: 'Invalid or unsupported model' } })
    return
  }

  if (!Array.isArray(messages) || messages.length === 0 || messages.length > 50) {
    response.status(400).json({ error: { message: 'Invalid messages array' } })
    return
  }

  try {
    const result = await forwardToNvidia(
      'https://integrate.api.nvidia.com/v1/chat/completions',
      { model, messages, stream: false },
    )
    response.status(result.status).json(result.payload)
  } catch (error) {
    console.error('[CHAT API ERROR]', error)
    response.status(500).json({ error: { message: 'Internal server error' } })
  }
}
