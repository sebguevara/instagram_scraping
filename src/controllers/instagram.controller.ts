import { createProfileHistory } from '@/services/profile.service'
import { scrapPostComments } from '@/services/post.service'
import { syncPostCommentCounts } from '@/services/comment.service'
import type { Response, Request } from 'express'

/**
 * Creates a profile history.
 * @param {Request} req - The request object
 * @param {Response} res - The response object
 * @returns {Promise<void>} A promise that resolves when the profile history is created
 */
export const createProfileHistoryController = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const data = await createProfileHistory()
    res.status(200).json(data)
  } catch (error: unknown) {
    console.error(error)
    res.status(500).json({ message: (error as Error).message })
  }
}

/**
 * Scrapes posts and analyzes their comments.
 * @param {Request} req - The request object
 * @param {Response} res - The response object
 * @returns {Promise<void>} A promise that resolves when the posts are scraped and analyzed
 */
export const createPostCommentsController = async (req: Request, res: Response): Promise<void> => {
  try {
    const data = await scrapPostComments()
    res.status(200).json(data)
  } catch (error: unknown) {
    console.error(error)
    res.status(500).json({ message: (error as Error).message })
  }
}

/**
 * Sincroniza el valor `numberOfComments` de cada post con la cantidad real de
 * comentarios almacenados en `comment_entity` y retorna un resumen de la
 * operación.
 * @param {Request} req - Objeto de la petición
 * @param {Response} res - Objeto de la respuesta
 * @returns {Promise<void>} Resumen de la sincronización
 */
export const syncPostCommentsController = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const data = await syncPostCommentCounts()
    res.status(200).json(data)
  } catch (error: unknown) {
    console.error(error)
    res.status(500).json({ message: (error as Error).message })
  }
}
