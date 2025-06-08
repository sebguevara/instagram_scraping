export const OPENAI_MODEL = 'gpt-3.5-turbo'
export const OPENAI_TEMPERATURE = 0.1
export const OPENAI_MAX_TOKENS_COMMENT = 80
export const OPENAI_MAX_TOKENS_POST = 200

export const OPENAI_SYSTEM_PROMPT_COMMENT = `
Eres un asistente bilingüe (español e inglés) que analiza el sentimiento de comentarios de Instagram dirigidos a políticos.
Clasifica el sentimiento del comentario en SOLO UNA emoción: positivo, negativo, neutral.
Devuelve solo este JSON: { "emotion": "positivo|negativo|neutral", "topic": "tópico en 3 palabras", "request": "petición en 3 palabras" }
Ejemplo:
{"emotion": "negativo", "topic": "mal salario", "request": "subir los salarios"}
(NO AGREGUES TEXTO EXTRA, SOLO JSON VÁLIDO)
`

export const OPENAI_SYSTEM_PROMPT_POST = (topics: string) => `
Eres un asistente que clasifica posts políticos en SOLO UNO de estos temas: ${topics}
Devuelve solo este JSON: { "topic": "Tema", "id": "ID" }
(TODO EN ESPAÑOL, SIN TEXTO ADICIONAL)
`
