import { forwardToNvidia } from '../lib/nvidiaProxy.mjs'

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    response.status(405).json({ error: { message: 'Method not allowed' } })
    return
  }

  const result = await forwardToNvidia(
    'https://integrate.api.nvidia.com/v1/chat/completions',
    request.body ?? {},
  )

  response.status(result.status).json(result.payload)
}
