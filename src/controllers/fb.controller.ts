import { scrapFBPostComments } from '@/services/facebook/post.service'
import type { Response, Request } from 'express'

/**
 * Scrapes posts and analyzes their comments.
 * @param {Request} req - The request object
 * @param {Response} res - The response object
 * @returns {Promise<void>} A promise that resolves when the posts are scraped and analyzed
 */
export const createPostCommentsController = async (req: Request, res: Response): Promise<void> => {
  try {
    const { days, categoryId } = req.query
    const data = await scrapFBPostComments(Number(days), Number(categoryId))
    res.status(200).json(data)
  } catch (error: unknown) {
    console.error(error)
    res.status(500).json({ message: (error as Error).message })
  }
}
