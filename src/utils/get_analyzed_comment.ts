import { openai } from '@/config'
import {
  OPENAI_MAX_TOKENS_COMMENT,
  OPENAI_MODEL,
  OPENAI_SYSTEM_PROMPT_COMMENT,
  OPENAI_TEMPERATURE,
} from '@/const'
import type { CommentAnalysisRequest } from '@/interfaces'
import { extractJson } from './extract_json'

/**
 * Analyzes a comment and returns an object with the emotion, topic, and request.
 * @param {string} comment - The comment to analyze
 * @returns {Promise<CommentAnalysisRequest>} The analyzed comment
 * @throws {Error} If no JSON is found in the text
 */
export const getAnalyzedComment = async (comment: string): Promise<CommentAnalysisRequest> => {
  const systemPrompt = OPENAI_SYSTEM_PROMPT_COMMENT
  const userPrompt = `Comentario a analizar: ${comment}`

  const response = await openai.chat.completions.create({
    model: OPENAI_MODEL,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    temperature: OPENAI_TEMPERATURE,
    max_tokens: OPENAI_MAX_TOKENS_COMMENT,
  })

  const rawContent = response.choices?.[0]?.message?.content || '{}'
  try {
    const onlyJson = extractJson(rawContent)
    return JSON.parse(onlyJson) as CommentAnalysisRequest
  } catch (error) {
    console.log('error:', error)
    throw new Error('No se pudo parsear la respuesta GPT')
  }
}
