export const config = { maxDuration: 300 }

const model = process.env.GEMINI_MODEL ?? 'gemini-3.6-flash'

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST')
    return response.status(405).json({ error: 'Method not allowed' })
  }

  const expectedToken = process.env.GEMINI_API_KEY
  const suppliedToken = request.headers.authorization?.replace(/^Bearer\s+/i, '')
  if (!expectedToken || suppliedToken !== expectedToken) {
    return response.status(401).json({ error: 'Unauthorized' })
  }

  const apiKey = expectedToken
  if (!apiKey) return response.status(503).json({ error: 'Gemini is not configured' })

  const prompt = request.body?.prompt
  if (typeof prompt !== 'string' || prompt.length < 100 || prompt.length > 120000) {
    return response.status(400).json({ error: 'Invalid prompt' })
  }

  const geminiResponse = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.2,
          responseMimeType: 'application/json',
        },
      }),
    },
  )

  if (!geminiResponse.ok) {
    const detail = await geminiResponse.text()
    return response.status(geminiResponse.status).json({ error: 'Gemini request failed', detail })
  }

  const payload = await geminiResponse.json()
  const text = payload.candidates?.[0]?.content?.parts
    ?.map((part) => part.text ?? '')
    .join('')
  if (!text) return response.status(502).json({ error: 'Gemini returned no text' })

  try {
    return response.status(200).json(JSON.parse(text))
  } catch {
    return response.status(502).json({ error: 'Gemini returned invalid JSON' })
  }
}
