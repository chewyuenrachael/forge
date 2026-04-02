import Anthropic from '@anthropic-ai/sdk'

export function isAPIAvailable(): boolean {
  return !!process.env.ANTHROPIC_API_KEY
}

export function createAnthropicClient(): Anthropic | null {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return null
  }
  return new Anthropic({ apiKey })
}

export async function generateCompletion(
  systemPrompt: string,
  userMessage: string
): Promise<string> {
  const client = createAnthropicClient()
  if (!client) {
    return '[Demo Mode] AI-generated content is unavailable without an API key.'
  }

  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1024,
    system: systemPrompt,
    messages: [{ role: 'user', content: userMessage }],
  })

  const block = response.content[0]
  if (block && block.type === 'text') {
    return block.text
  }
  return ''
}
