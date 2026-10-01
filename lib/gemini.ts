import { GoogleGenAI } from '@google/genai'

export function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY?.trim()
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured on the server. Please set it in your .env.local file.')
  }
  return new GoogleGenAI({ apiKey })
}

export function getCandidateModels(): string[] {
  const configured = process.env.GEMINI_MODEL?.trim().replace(/^models\//, '')
  const defaults = [
    'gemini-3.5-flash-lite',
    'gemini-flash-lite-latest',
    'gemini-flash-latest',
    'gemini-3.8-flash',
  ]
  const list = configured ? [configured, ...defaults.filter((m) => m !== configured)] : defaults
  return Array.from(new Set(list))
}

interface GenerateOptions {
  contents: any
  config?: any
  preferredModel?: string
}

export async function generateContentWithFallback(options: GenerateOptions): Promise<{ text: string; modelUsed: string }> {
  const client = getGeminiClient()
  const candidateModels = options.preferredModel
    ? [options.preferredModel, ...getCandidateModels().filter((m) => m !== options.preferredModel)]
    : getCandidateModels()

  let lastError: unknown

  for (const model of candidateModels) {
    try {
      const response = await client.models.generateContent({
        model,
        contents: options.contents,
        config: options.config,
      })

      const text = response.text || ''
      if (text) {
        return { text, modelUsed: model }
      }
    } catch (err: any) {
      lastError = err
      const status = err?.status || err?.code
      const msg = err?.message || String(err)
      console.warn(`[Gemini] Attempt with model '${model}' failed (status: ${status}): ${msg.slice(0, 150)}`)
      // Continue to next candidate model
    }
  }

  throw lastError instanceof Error ? lastError : new Error('All Gemini model candidates failed to generate content.')
}
