/**
 * Extracts a JSON object from a given text string.
 * @param {string} text - The text to extract the JSON from
 * @returns {string} The extracted JSON string
 * @throws {Error} If no JSON is found in the text
 */
export const extractJson = (text: string): string => {
  const match = text.match(/{[\s\S]*}/)
  if (match) return match[0]
  throw new Error('No se encontró JSON en la respuesta')
}
