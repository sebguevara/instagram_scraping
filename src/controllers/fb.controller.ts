import { scrapFBPostComments } from '@/services/facebook/post.service'
import { syncPostCommentCounts } from '@/services/facebook/comment.service'
import type { Response, Request } from 'express'
import { createProfileHistory } from '@/services/facebook/profile.service'

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
    const { days, categoryId } = req.query
    const data = await scrapFBPostComments(Number(days), Number(categoryId))
    res.status(200).json(data)
  } catch (error: unknown) {
    console.error(error)
    res.status(500).json({ message: (error as Error).message })
  }
}

/**
 * Synchronizes the `numberOfComments` value of each post with the actual number of
 * comments stored in `comment_entity` and returns a summary of the operation.
 * @param {Request} req - The request object
 * @param {Response} res - The response object
 * @returns {Promise<void>} A summary of the synchronization
 */
export const syncPostCommentsController = async (req: Request, res: Response): Promise<void> => {
  try {
    const { categoryId } = req.query
    const data = await syncPostCommentCounts(Number(categoryId))
    res.status(200).json(data)
  } catch (error: unknown) {
    console.error(error)
    res.status(500).json({ message: (error as Error).message })
  }
}
