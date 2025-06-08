import { openai } from '@/config'
import type { PostTopic, PostTopicResponse } from '@/interfaces'
import { extractJson } from './extract_json'
import {
  OPENAI_MAX_TOKENS_POST,
  OPENAI_MODEL,
  OPENAI_SYSTEM_PROMPT_POST,
  OPENAI_TEMPERATURE,
} from '@/const'

/**
 * Classifies a post into one of the given topics.
 * @param {string} description - The description of the post to classify
 * @param {PostTopic[]} topics - The list of topics to classify the post into
 * @returns {Promise<PostTopicResponse>} The classified topic
 */
export const getPostTopic = async (
  description: string,
  topics: PostTopic[]
): Promise<PostTopicResponse> => {
  const topicsList = topics.map((t) => `id: ${t.id}, ${t.topic}`).join('; ')
  const systemPrompt = OPENAI_SYSTEM_PROMPT_POST(topicsList)
  const userPrompt = `El texto a analizar es: ${description}`

  const response = await openai.chat.completions.create({
    model: OPENAI_MODEL,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    temperature: OPENAI_TEMPERATURE,
    max_tokens: OPENAI_MAX_TOKENS_POST,
  })

  const rawContent = response.choices?.[0]?.message?.content || '{}'
  try {
    const onlyJson = extractJson(rawContent)
    return JSON.parse(onlyJson) as PostTopicResponse
  } catch (error) {
    console.log('error:', error)
    throw new Error('No se pudo parsear la respuesta GPT')
  }
}
